/**
 * rFlow SDK Client
 *
 * IMPORTANT NOTE ON TYPE ASSERTIONS:
 * This file uses `as any` type assertions when calling Anchor's `.accounts()` method.
 * This is a known limitation with Anchor's TypeScript type generation where the
 * generated account types don't always match the runtime expectations exactly.
 * The accounts are validated at runtime by Anchor, and our test suite verifies
 * correct account usage. See: https://github.com/coral-xyz/anchor/issues/2797
 */

import {
  Connection,
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { AnchorProvider, Program, BN, type Wallet } from "./internal/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";

import type { Payflow } from "./idl/payflow";
import idl from "./idl/payflow.json";
import {
  PROGRAM_ID,
  KNOWN_MINTS,
  VALID_DURATIONS,
  PYTH_HERMES_API,
  getPythFeedForMint,
  isLSTToken,
} from "./constants";
import {
  findProtocolConfigPDA,
  findYieldDealPDA,
  findVaultPDA,
  findMeteoraLpDealPDA,
  findMeteoraVaultPDA,
} from "./pda";
import { toAnchorSourceProtocol } from "./types/enums";
import type {
  YieldDeal,
  MeteoraLpDeal,
  ProtocolConfig,
  CreateYieldDealInput,
  CreateMeteoraLpDealInput,
  ClaimMeteoraFeesInput,
  WithdrawMeteoraLiquidityInput,
  SplitMeteoraPositionInput,
  DealFilters,
} from "./types/sdk";
import {
  fetchYieldDeal,
  fetchYieldDealByPda,
  fetchAllYieldDeals,
  fetchAvailableYieldDeals,
  fetchYieldDealsBySeller,
  fetchYieldDealsByBuyer,
  fetchMeteoraLpDeal,
  fetchMeteoraLpDealByPda,
  fetchAllMeteoraLpDeals,
  fetchAvailableMeteoraLpDeals,
  fetchMeteoraLpDealsBySeller,
  fetchMeteoraLpDealsByBuyer,
  fetchProtocolConfig,
} from "./accounts";
import { toBN } from "./utils/bn";
import { InvalidInputError, InvalidDurationError } from "./errors";

// ==================== INPUT VALIDATION ====================

/**
 * Validate that a value is a positive number or BN
 */
function assertPositive(value: number | BN, fieldName: string): void {
  const bn = toBN(value);
  if (bn.isZero()) {
    throw new InvalidInputError(`${fieldName} must be greater than zero`);
  }
  if (bn.isNeg()) {
    throw new InvalidInputError(`${fieldName} cannot be negative`);
  }
}

/**
 * Validate that a value is non-negative (zero allowed)
 */
function assertNonNegative(value: number | BN, fieldName: string): void {
  const bn = toBN(value);
  if (bn.isNeg()) {
    throw new InvalidInputError(`${fieldName} cannot be negative`);
  }
}

/**
 * Validate CreateYieldDealInput
 */
function validateYieldDealInput(input: CreateYieldDealInput): void {
  assertPositive(input.receiptTokensAmount, "receiptTokensAmount");
  assertPositive(input.principalValueAtLock, "principalValueAtLock");
  assertNonNegative(input.expectedYield, "expectedYield");
  assertPositive(input.sellingPrice, "sellingPrice");

  // Business logic validation: selling price should not exceed expected yield
  const sellingPriceBN = toBN(input.sellingPrice);
  const expectedYieldBN = toBN(input.expectedYield);
  if (sellingPriceBN.gt(expectedYieldBN)) {
    throw new InvalidInputError(
      `sellingPrice (${sellingPriceBN.toString()}) cannot exceed expectedYield (${expectedYieldBN.toString()})`
    );
  }
}

/**
 * Validate CreateMeteoraLpDealInput
 */
function validateMeteoraLpDealInput(input: CreateMeteoraLpDealInput): void {
  assertNonNegative(input.feeAAtLock, "feeAAtLock");
  assertNonNegative(input.feeBAtLock, "feeBAtLock");
  assertNonNegative(input.expectedFeeA, "expectedFeeA");
  assertNonNegative(input.expectedFeeB, "expectedFeeB");
  assertPositive(input.expectedFeeValueUsdc, "expectedFeeValueUsdc");
  assertPositive(input.sellingPrice, "sellingPrice");

  // Business logic validation: selling price should not exceed expected fee value
  const sellingPriceBN = toBN(input.sellingPrice);
  const expectedValueBN = toBN(input.expectedFeeValueUsdc);
  if (sellingPriceBN.gt(expectedValueBN)) {
    throw new InvalidInputError(
      `sellingPrice (${sellingPriceBN.toString()}) cannot exceed expectedFeeValueUsdc (${expectedValueBN.toString()})`
    );
  }
}

// ==================== ATA HELPERS ====================

/**
 * Build idempotent `createAssociatedTokenAccount` instructions for any ATAs
 * in `entries` that don't yet exist on-chain. The wallet signing the
 * transaction (`payer`) covers rent for newly-created accounts.
 *
 * Mirrors `buildAtaPreInstructions` in the rFlow frontend
 * `blockchain.service.ts`. Used by settle/buyback so the on-chain instruction
 * can't fail simply because the counter-party never opened the receipt-token
 * ATA in their wallet — exactly the bug that bit production.
 */
export async function buildAtaPreInstructions(
  connection: Connection,
  payer: PublicKey,
  entries: { owner: PublicKey; mint: PublicKey; ata: PublicKey }[]
): Promise<TransactionInstruction[]> {
  const instructions: TransactionInstruction[] = [];
  for (const { owner, mint, ata } of entries) {
    const info = await connection.getAccountInfo(ata);
    if (!info) {
      instructions.push(createAssociatedTokenAccountIdempotentInstruction(payer, ata, owner, mint));
    }
  }
  return instructions;
}

// ==================== PYTH HELPER ====================

/**
 * Fetch the latest Pyth price update from Hermes for an LST mint, post it
 * on-chain via the Pyth Solana receiver, and return the resulting
 * `priceUpdate` PublicKey ready to be passed as the optional `priceUpdate`
 * account to `createDeal` / `settleDeal` / `buybackDeal`.
 *
 * Returns `null` if the mint is not a supported LST (no Pyth feed needed).
 *
 * NOTE: This builds and sends a Versioned transaction signed by `wallet` to
 * the Pyth receiver program; the wallet must have enough SOL for rent +
 * priority fees. Pyth packages are imported dynamically so the SDK works in
 * environments that don't ship them. To use this helper, install:
 *
 *   npm install @pythnetwork/hermes-client @pythnetwork/pyth-solana-receiver
 */
export async function getPythPriceUpdate(
  connection: Connection,
  wallet: Wallet,
  tokenMint: PublicKey,
  opts?: { hermesEndpoint?: string; computeUnitPriceMicroLamports?: number }
): Promise<PublicKey | null> {
  const feedId = getPythFeedForMint(tokenMint);
  if (!feedId) {
    return null;
  }

  // Dynamic imports so the core SDK doesn't force these as deps.
  const { HermesClient } = await import("@pythnetwork/hermes-client");
  const { PythSolanaReceiver } = await import("@pythnetwork/pyth-solana-receiver");

  const hermesClient = new HermesClient(opts?.hermesEndpoint ?? PYTH_HERMES_API);
  const priceUpdates = await hermesClient.getLatestPriceUpdates([feedId], {
    encoding: "base64",
  });
  const priceUpdateData = priceUpdates.binary.data;
  if (!Array.isArray(priceUpdateData) || priceUpdateData.length === 0) {
    return null;
  }

  const pythReceiver = new PythSolanaReceiver({
    connection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wallet: wallet as any,
  });

  const txBuilder = pythReceiver.newTransactionBuilder({ closeUpdateAccounts: false });
  await txBuilder.addPostPriceUpdates(priceUpdateData);

  const transactions = await txBuilder.buildVersionedTransactions({
    computeUnitPriceMicroLamports: opts?.computeUnitPriceMicroLamports ?? 100_000,
    tightComputeBudget: true,
  });

  await pythReceiver.provider.sendAll(transactions);

  return txBuilder.getPriceUpdateAccount(feedId);
}

// ==================== CLIENT CONFIGURATION ====================

/**
 * Configuration for RFlowClient
 */
export interface RFlowClientConfig {
  /** Solana connection */
  connection: Connection;
  /** Wallet for signing transactions (optional for read-only operations) */
  wallet?: Wallet;
  /** Program ID (defaults to mainnet program) */
  programId?: PublicKey;
}

/**
 * Optional overrides for settle/buyback. By default the SDK reads
 * `principalValueAtLock + expectedYield` straight off the on-chain deal
 * account — that matches the deal exactly as advertised and falls inside the
 * `exchangeRateAtLock ± 10%` band that the program enforces.
 *
 * Pass `currentTokenValue` only if you intentionally want to deviate (e.g.
 * the underlying APY has changed and you've already verified you're still in
 * tolerance). Always provide the value as a raw u64 BN, NOT UI units.
 *
 * Pass `priceUpdate` to override the Pyth account the SDK would otherwise
 * auto-fetch. When the receipt token is an LST and `config.use_oracle` is
 * true on-chain, this account is REQUIRED.
 */
export interface SettleOverrides {
  currentTokenValue?: BN;
  priceUpdate?: PublicKey | null;
  /** Disable auto-fetching the Pyth price update (default false, i.e. fetch). */
  skipPythAutoFetch?: boolean;
}

/**
 * Yield Deal client for interacting with yield deals
 */
export class YieldDealClient {
  constructor(
    private readonly connection: Connection,
    private readonly program: Program<Payflow>,
    private readonly wallet?: Wallet
  ) {}

  // ==================== READ OPERATIONS ====================

  /**
   * Get a deal by ID
   */
  async getDeal(dealId: number | BN): Promise<YieldDeal | null> {
    return fetchYieldDeal(this.program, dealId);
  }

  /**
   * Get a deal by PDA
   */
  async getDealByPda(dealPda: PublicKey): Promise<YieldDeal | null> {
    return fetchYieldDealByPda(this.program, dealPda);
  }

  /**
   * Get all deals with optional filters
   */
  async getAllDeals(filters?: DealFilters): Promise<YieldDeal[]> {
    return fetchAllYieldDeals(this.program, filters);
  }

  /**
   * Get available deals (status = Created)
   */
  async getAvailableDeals(): Promise<YieldDeal[]> {
    return fetchAvailableYieldDeals(this.program);
  }

  /**
   * Get deals by seller
   */
  async getDealsBySeller(seller: PublicKey): Promise<YieldDeal[]> {
    return fetchYieldDealsBySeller(this.program, seller);
  }

  /**
   * Get deals by buyer
   */
  async getDealsByBuyer(buyer: PublicKey): Promise<YieldDeal[]> {
    return fetchYieldDealsByBuyer(this.program, buyer);
  }

  // ==================== PDA HELPERS ====================

  /**
   * Find deal PDA for a given deal ID
   */
  findDealPda(dealId: number | BN): [PublicKey, number] {
    return findYieldDealPDA(dealId, this.program.programId);
  }

  /**
   * Find vault PDA for a deal
   */
  findVaultPda(dealPda: PublicKey): [PublicKey, number] {
    return findVaultPDA(dealPda, this.program.programId);
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new yield deal
   * @returns Transaction instructions to create the deal
   */
  async createDeal(input: CreateYieldDealInput): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    // Validate duration
    if (!VALID_DURATIONS.includes(input.durationDays)) {
      throw new InvalidDurationError(input.durationDays);
    }

    // Validate input amounts
    validateYieldDealInput(input);

    const seller = this.wallet.publicKey;
    const [configPda] = findProtocolConfigPDA(this.program.programId);

    // Get current deal counter from config
    const config = await fetchProtocolConfig(this.program);
    if (!config) {
      throw new InvalidInputError("Protocol not initialized");
    }

    const dealId = new BN(config.dealCounter);
    const [dealPda] = findYieldDealPDA(dealId, this.program.programId);
    const [vaultPda] = findVaultPDA(dealPda, this.program.programId);

    const paymentMint = input.paymentMint ?? KNOWN_MINTS.USDC;
    const sellerTokenAccount = await getAssociatedTokenAddress(input.receiptTokenMint, seller);

    // Auto-resolve Pyth price update if needed and not provided.
    let priceUpdate: PublicKey | null = input.priceUpdate ?? null;
    if (
      !priceUpdate &&
      config.useOracle &&
      isLSTToken(input.receiptTokenMint) &&
      input.fetchPythPriceUpdate !== false
    ) {
      priceUpdate = await getPythPriceUpdate(this.connection, this.wallet, input.receiptTokenMint);
      if (!priceUpdate) {
        throw new InvalidInputError(
          `Pyth price update is required for LST ${input.receiptTokenMint.toBase58()} but could not be fetched`
        );
      }
    }

    const instructions: TransactionInstruction[] = [];

    // Create deal instruction
    const createDealIx = await this.program.methods
      .createDeal({
        receiptTokensAmount: toBN(input.receiptTokensAmount),
        principalValueAtLock: toBN(input.principalValueAtLock),
        expectedYield: toBN(input.expectedYield),
        sellingPrice: toBN(input.sellingPrice),
        durationDays: input.durationDays,
        sourceProtocol: toAnchorSourceProtocol(input.sourceProtocol),
        exchangeRateAtLock: toBN(input.exchangeRateAtLock),
      })

      .accounts({
        seller,
        config: configPda,
        deal: dealPda,
        sellerTokenAccount,
        vault: vaultPda,
        receiptTokenMint: input.receiptTokenMint,
        paymentMint,
        priceUpdate,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      } as any)
      .instruction();

    instructions.push(createDealIx);

    return instructions;
  }

  /**
   * Buy a deal
   * @returns Transaction instructions to buy the deal
   */
  async buyDeal(
    dealId: number | BN,
    sellerPaymentAccount: PublicKey,
    treasuryAccount: PublicKey
  ): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    const buyer = this.wallet.publicKey;
    const [configPda] = findProtocolConfigPDA(this.program.programId);
    const [dealPda] = findYieldDealPDA(dealId, this.program.programId);

    // Get deal info to know payment mint
    const deal = await this.getDeal(dealId);
    if (!deal) {
      throw new InvalidInputError(`Deal ${dealId} not found`);
    }

    const buyerPaymentAccount = await getAssociatedTokenAddress(deal.paymentMint, buyer);

    // Idempotent ATA creation for the buyer's payment account.
    const preInstructions = await buildAtaPreInstructions(this.connection, buyer, [
      { owner: buyer, mint: deal.paymentMint, ata: buyerPaymentAccount },
    ]);

    const buyDealIx = await this.program.methods
      .buyDeal()

      .accounts({
        buyer,
        config: configPda,
        deal: dealPda,
        buyerPaymentAccount,
        sellerPaymentAccount,
        treasuryAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .instruction();

    return [...preInstructions, buyDealIx];
  }

  /**
   * Cancel a deal (seller only, before purchase)
   * @returns Transaction instructions to cancel the deal
   */
  async cancelDeal(dealId: number | BN): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    const seller = this.wallet.publicKey;
    const [dealPda] = findYieldDealPDA(dealId, this.program.programId);
    const [vaultPda] = findVaultPDA(dealPda, this.program.programId);

    // Get deal info to know receipt token mint
    const deal = await this.getDeal(dealId);
    if (!deal) {
      throw new InvalidInputError(`Deal ${dealId} not found`);
    }

    const sellerTokenAccount = await getAssociatedTokenAddress(deal.receiptTokenMint, seller);

    const preInstructions = await buildAtaPreInstructions(this.connection, seller, [
      { owner: seller, mint: deal.receiptTokenMint, ata: sellerTokenAccount },
    ]);

    const cancelDealIx = await this.program.methods
      .cancelDeal()

      .accounts({
        seller,
        deal: dealPda,
        vault: vaultPda,
        sellerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .instruction();

    return [...preInstructions, cancelDealIx];
  }

  /**
   * Settle a deal after it ends (permissionless).
   *
   * By default `currentTokenValue` is read from the on-chain deal account
   * as `principalValueAtLock + expectedYield` (both raw u64 BNs) — the
   * exact contract expects to honour the deal as advertised. The contract
   * also validates this value against `exchangeRateAtLock ± 10%` and
   * returns `InvalidTokenValue` (Custom 6027) when out of band, so passing
   * a UI-units number (e.g. 632.81 instead of 632_808_370) WILL fail.
   *
   * For LST receipt tokens with `config.use_oracle == true` on-chain the
   * SDK auto-fetches the Pyth price update via Hermes and posts it
   * on-chain. Pass `overrides.priceUpdate` to bypass, or
   * `overrides.skipPythAutoFetch = true` to disable auto-fetch entirely.
   *
   * The SDK also prepends idempotent `createAssociatedTokenAccount`
   * instructions for the buyer's and seller's receipt-token ATAs when
   * missing. The buyer's ATA being absent is exactly the bug that hit
   * production before this release.
   *
   * @returns Transaction instructions to settle the deal
   */
  async settleDeal(
    dealId: number | BN,
    overrides?: SettleOverrides
  ): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    const payer = this.wallet.publicKey;
    const [configPda] = findProtocolConfigPDA(this.program.programId);
    const [dealPda] = findYieldDealPDA(dealId, this.program.programId);
    const [vaultPda] = findVaultPDA(dealPda, this.program.programId);

    // Get deal info
    const deal = await this.getDeal(dealId);
    if (!deal) {
      throw new InvalidInputError(`Deal ${dealId} not found`);
    }
    if (!deal.buyer) {
      throw new InvalidInputError("Deal has no buyer");
    }

    // Default to principal + expected_yield, as raw u64 BNs read straight
    // off the on-chain account. This always falls inside the program's
    // ±10% tolerance band.
    const currentTokenValue =
      overrides?.currentTokenValue ?? deal.principalValueAtLock.add(deal.expectedYield);

    const buyerTokenAccount = await getAssociatedTokenAddress(deal.receiptTokenMint, deal.buyer);
    const sellerTokenAccount = await getAssociatedTokenAddress(deal.receiptTokenMint, deal.seller);

    // Auto-resolve Pyth price update if needed.
    let priceUpdate: PublicKey | null = overrides?.priceUpdate ?? null;
    if (priceUpdate === null && !overrides?.skipPythAutoFetch) {
      const config = await fetchProtocolConfig(this.program);
      if (config?.useOracle && isLSTToken(deal.receiptTokenMint)) {
        priceUpdate = await getPythPriceUpdate(this.connection, this.wallet, deal.receiptTokenMint);
        if (!priceUpdate) {
          throw new InvalidInputError(
            `Pyth price update is required for LST ${deal.receiptTokenMint.toBase58()} but could not be fetched`
          );
        }
      }
    }

    const preInstructions = await buildAtaPreInstructions(this.connection, payer, [
      { owner: deal.buyer, mint: deal.receiptTokenMint, ata: buyerTokenAccount },
      { owner: deal.seller, mint: deal.receiptTokenMint, ata: sellerTokenAccount },
    ]);

    const settleDealIx = await this.program.methods
      .settleDeal(currentTokenValue)

      .accounts({
        payer,
        seller: deal.seller, // seller receives deal account rent
        deal: dealPda,
        vault: vaultPda,
        buyerTokenAccount,
        sellerTokenAccount,
        config: configPda,
        receiptTokenMint: deal.receiptTokenMint,
        priceUpdate,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .instruction();

    return [...preInstructions, settleDealIx];
  }

  /**
   * Buyback a deal before it ends (seller early exit with penalty).
   *
   * Same `currentTokenValue` semantics as {@link settleDeal} — defaults to
   * `principalValueAtLock + expectedYield` (raw u64). Same Pyth auto-fetch
   * for LSTs. Adds idempotent ATA creation for the seller's payment +
   * receipt accounts and the buyer's payment account.
   *
   * @returns Transaction instructions to buyback the deal
   */
  async buybackDeal(
    dealId: number | BN,
    overrides?: SettleOverrides
  ): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    const seller = this.wallet.publicKey;
    const [configPda] = findProtocolConfigPDA(this.program.programId);
    const [dealPda] = findYieldDealPDA(dealId, this.program.programId);
    const [vaultPda] = findVaultPDA(dealPda, this.program.programId);

    // Get deal info
    const deal = await this.getDeal(dealId);
    if (!deal) {
      throw new InvalidInputError(`Deal ${dealId} not found`);
    }
    if (!deal.buyer) {
      throw new InvalidInputError("Deal has no buyer");
    }

    const currentTokenValue =
      overrides?.currentTokenValue ?? deal.principalValueAtLock.add(deal.expectedYield);

    const sellerPaymentAccount = await getAssociatedTokenAddress(deal.paymentMint, seller);
    const sellerReceiptAccount = await getAssociatedTokenAddress(deal.receiptTokenMint, seller);
    const buyerPaymentAccount = await getAssociatedTokenAddress(deal.paymentMint, deal.buyer);

    let priceUpdate: PublicKey | null = overrides?.priceUpdate ?? null;
    if (priceUpdate === null && !overrides?.skipPythAutoFetch) {
      const config = await fetchProtocolConfig(this.program);
      if (config?.useOracle && isLSTToken(deal.receiptTokenMint)) {
        priceUpdate = await getPythPriceUpdate(this.connection, this.wallet, deal.receiptTokenMint);
        if (!priceUpdate) {
          throw new InvalidInputError(
            `Pyth price update is required for LST ${deal.receiptTokenMint.toBase58()} but could not be fetched`
          );
        }
      }
    }

    const preInstructions = await buildAtaPreInstructions(this.connection, seller, [
      { owner: seller, mint: deal.paymentMint, ata: sellerPaymentAccount },
      { owner: seller, mint: deal.receiptTokenMint, ata: sellerReceiptAccount },
      { owner: deal.buyer, mint: deal.paymentMint, ata: buyerPaymentAccount },
    ]);

    const buybackDealIx = await this.program.methods
      .buybackDeal(currentTokenValue)

      .accounts({
        seller,
        config: configPda,
        deal: dealPda,
        vault: vaultPda,
        sellerPaymentAccount,
        sellerReceiptAccount,
        buyerPaymentAccount,
        receiptTokenMint: deal.receiptTokenMint,
        priceUpdate,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .instruction();

    return [...preInstructions, buybackDealIx];
  }
}

/**
 * Meteora LP Deal client for interacting with Meteora LP deals
 */
export class MeteoraLpDealClient {
  constructor(
    private readonly connection: Connection,
    private readonly program: Program<Payflow>,
    private readonly wallet?: Wallet
  ) {}

  // ==================== READ OPERATIONS ====================

  /**
   * Get a deal by ID
   */
  async getDeal(dealId: number | BN): Promise<MeteoraLpDeal | null> {
    return fetchMeteoraLpDeal(this.program, dealId);
  }

  /**
   * Get a deal by PDA
   */
  async getDealByPda(dealPda: PublicKey): Promise<MeteoraLpDeal | null> {
    return fetchMeteoraLpDealByPda(this.program, dealPda);
  }

  /**
   * Get all deals with optional filters
   */
  async getAllDeals(filters?: DealFilters): Promise<MeteoraLpDeal[]> {
    return fetchAllMeteoraLpDeals(this.program, filters);
  }

  /**
   * Get available deals (status = Created)
   */
  async getAvailableDeals(): Promise<MeteoraLpDeal[]> {
    return fetchAvailableMeteoraLpDeals(this.program);
  }

  /**
   * Get deals by seller
   */
  async getDealsBySeller(seller: PublicKey): Promise<MeteoraLpDeal[]> {
    return fetchMeteoraLpDealsBySeller(this.program, seller);
  }

  /**
   * Get deals by buyer
   */
  async getDealsByBuyer(buyer: PublicKey): Promise<MeteoraLpDeal[]> {
    return fetchMeteoraLpDealsByBuyer(this.program, buyer);
  }

  // ==================== PDA HELPERS ====================

  /**
   * Find deal PDA for a given deal ID
   */
  findDealPda(dealId: number | BN): [PublicKey, number] {
    return findMeteoraLpDealPDA(dealId, this.program.programId);
  }

  /**
   * Find NFT vault PDA for a deal
   */
  findNftVaultPda(dealPda: PublicKey): [PublicKey, number] {
    return findMeteoraVaultPDA(dealPda, this.program.programId);
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new Meteora LP deal
   * @returns Transaction instructions to create the deal
   */
  async createDeal(input: CreateMeteoraLpDealInput): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    // Validate duration
    if (!VALID_DURATIONS.includes(input.durationDays)) {
      throw new InvalidDurationError(input.durationDays);
    }

    // Validate input amounts
    validateMeteoraLpDealInput(input);

    const seller = this.wallet.publicKey;
    const [configPda] = findProtocolConfigPDA(this.program.programId);

    // Get current deal counter from config
    const config = await fetchProtocolConfig(this.program);
    if (!config) {
      throw new InvalidInputError("Protocol not initialized");
    }

    const dealId = new BN(config.dealCounter);
    const [dealPda] = findMeteoraLpDealPDA(dealId, this.program.programId);
    const [nftVaultPda] = findMeteoraVaultPDA(dealPda, this.program.programId);

    const paymentMint = input.paymentMint ?? KNOWN_MINTS.USDC;
    const nftTokenProgram = input.nftTokenProgram ?? TOKEN_PROGRAM_ID;
    const sellerNftAccount = await getAssociatedTokenAddress(
      input.positionNftMint,
      seller,
      false,
      nftTokenProgram
    );

    const instructions: TransactionInstruction[] = [];

    const createDealIx = await this.program.methods
      .createMeteoraLpDeal({
        positionAccount: input.positionAccount,
        pool: input.pool,
        feeAAtLock: toBN(input.feeAAtLock),
        feeBAtLock: toBN(input.feeBAtLock),
        expectedFeeA: toBN(input.expectedFeeA),
        expectedFeeB: toBN(input.expectedFeeB),
        expectedFeeValueUsdc: toBN(input.expectedFeeValueUsdc),
        sellingPrice: toBN(input.sellingPrice),
        durationDays: input.durationDays,
      })

      .accounts({
        seller,
        config: configPda,
        deal: dealPda,
        sellerNftAccount,
        nftVault: nftVaultPda,
        positionNftMint: input.positionNftMint,
        meteoraPosition: input.positionAccount,
        meteoraPool: input.pool,
        tokenAMint: input.tokenAMint,
        tokenBMint: input.tokenBMint,
        paymentMint,
        nftTokenProgram,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      } as any)
      .instruction();

    instructions.push(createDealIx);

    return instructions;
  }

  /**
   * Buy a Meteora LP deal
   * @returns Transaction instructions to buy the deal
   */
  async buyDeal(
    dealId: number | BN,
    sellerPaymentAccount: PublicKey,
    treasuryAccount: PublicKey
  ): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    const buyer = this.wallet.publicKey;
    const [configPda] = findProtocolConfigPDA(this.program.programId);
    const [dealPda] = findMeteoraLpDealPDA(dealId, this.program.programId);

    // Get deal info to know payment mint
    const deal = await this.getDeal(dealId);
    if (!deal) {
      throw new InvalidInputError(`Deal ${dealId} not found`);
    }

    const buyerPaymentAccount = await getAssociatedTokenAddress(deal.paymentMint, buyer);

    const preInstructions = await buildAtaPreInstructions(this.connection, buyer, [
      { owner: buyer, mint: deal.paymentMint, ata: buyerPaymentAccount },
    ]);

    const buyDealIx = await this.program.methods
      .buyMeteoraLpDeal()

      .accounts({
        buyer,
        config: configPda,
        deal: dealPda,
        buyerPaymentAccount,
        sellerPaymentAccount,
        treasuryAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .instruction();

    return [...preInstructions, buyDealIx];
  }

  /**
   * Cancel a Meteora LP deal (seller only, before purchase)
   * @returns Transaction instructions to cancel the deal
   */
  async cancelDeal(
    dealId: number | BN,
    nftTokenProgram: PublicKey = TOKEN_PROGRAM_ID
  ): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    const seller = this.wallet.publicKey;
    const [dealPda] = findMeteoraLpDealPDA(dealId, this.program.programId);
    const [nftVaultPda] = findMeteoraVaultPDA(dealPda, this.program.programId);

    // Get deal info
    const deal = await this.getDeal(dealId);
    if (!deal) {
      throw new InvalidInputError(`Deal ${dealId} not found`);
    }

    const sellerNftAccount = await getAssociatedTokenAddress(
      deal.positionNftMint,
      seller,
      false,
      nftTokenProgram
    );

    const instructions: TransactionInstruction[] = [];

    const cancelDealIx = await this.program.methods
      .cancelMeteoraLpDeal()

      .accounts({
        seller,
        deal: dealPda,
        nftVault: nftVaultPda,
        sellerNftAccount,
        positionNftMint: deal.positionNftMint,
        nftTokenProgram,
      } as any)
      .instruction();

    instructions.push(cancelDealIx);

    return instructions;
  }

  /**
   * Settle a Meteora LP deal after it ends (permissionless).
   *
   * The on-chain `settle_meteora_lp_deal` instruction does much more than
   * the SDK's earlier prototype: it CPI-claims any pending fees to the
   * buyer's Token A/B accounts BEFORE returning the Position NFT to the
   * seller. As a result the SDK needs the full Meteora account set
   * (program, pool authority, event authority, position, pool, pool token
   * vaults, both token mints, both token programs).
   *
   * The SDK prepends idempotent `createAssociatedTokenAccount`
   * instructions for both buyer fee ATAs and the seller NFT ATA when
   * missing.
   *
   * @returns Transaction instructions to settle the Meteora LP deal
   */
  async settleDeal(input: SettleMeteoraLpDealInput): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    const payer = this.wallet.publicKey;
    const [dealPda] = findMeteoraLpDealPDA(input.dealId, this.program.programId);
    const [nftVaultPda] = findMeteoraVaultPDA(dealPda, this.program.programId);

    // Get deal info
    const deal = await this.getDeal(input.dealId);
    if (!deal) {
      throw new InvalidInputError(`Deal ${input.dealId} not found`);
    }
    if (!deal.buyer) {
      throw new InvalidInputError("Deal has no buyer");
    }

    const nftTokenProgram = input.nftTokenProgram ?? TOKEN_PROGRAM_ID;
    const tokenAProgram = input.tokenAProgram ?? TOKEN_PROGRAM_ID;
    const tokenBProgram = input.tokenBProgram ?? TOKEN_PROGRAM_ID;

    const sellerNftAccount = await getAssociatedTokenAddress(
      deal.positionNftMint,
      deal.seller,
      false,
      nftTokenProgram
    );
    const buyerTokenAAccount = await getAssociatedTokenAddress(
      deal.tokenAMint,
      deal.buyer,
      false,
      tokenAProgram
    );
    const buyerTokenBAccount = await getAssociatedTokenAddress(
      deal.tokenBMint,
      deal.buyer,
      false,
      tokenBProgram
    );

    const preInstructions = await buildAtaPreInstructions(this.connection, payer, [
      { owner: deal.buyer, mint: deal.tokenAMint, ata: buyerTokenAAccount },
      { owner: deal.buyer, mint: deal.tokenBMint, ata: buyerTokenBAccount },
      { owner: deal.seller, mint: deal.positionNftMint, ata: sellerNftAccount },
    ]);

    const settleDealIx = await this.program.methods
      .settleMeteoraLpDeal()

      .accounts({
        payer,
        seller: deal.seller, // seller receives deal account rent
        buyer: deal.buyer,
        deal: dealPda,
        nftVault: nftVaultPda,
        sellerNftAccount,
        positionNftMint: deal.positionNftMint,
        nftTokenProgram,
        buyerTokenAAccount,
        buyerTokenBAccount,
        meteoraProgram: input.meteoraProgram,
        poolAuthority: input.poolAuthority,
        eventAuthority: input.eventAuthority,
        meteoraPosition: input.meteoraPosition ?? deal.positionAccount,
        meteoraPool: input.meteoraPool ?? deal.pool,
        poolTokenAVault: input.poolTokenAVault,
        poolTokenBVault: input.poolTokenBVault,
        tokenAMint: deal.tokenAMint,
        tokenBMint: deal.tokenBMint,
        tokenAProgram,
        tokenBProgram,
      } as any)
      .instruction();

    return [...preInstructions, settleDealIx];
  }

  /**
   * Claim Meteora fees during an active deal
   * @returns Transaction instructions to claim fees
   */
  async claimFees(input: ClaimMeteoraFeesInput): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    const buyer = this.wallet.publicKey;
    const [dealPda] = findMeteoraLpDealPDA(input.dealId, this.program.programId);
    const [nftVaultPda] = findMeteoraVaultPDA(dealPda, this.program.programId);

    // Get deal info
    const deal = await this.getDeal(input.dealId);
    if (!deal) {
      throw new InvalidInputError(`Deal ${input.dealId} not found`);
    }

    const tokenAProgram = input.tokenAProgram ?? TOKEN_PROGRAM_ID;
    const tokenBProgram = input.tokenBProgram ?? TOKEN_PROGRAM_ID;
    const buyerTokenAAccount = await getAssociatedTokenAddress(
      deal.tokenAMint,
      buyer,
      false,
      tokenAProgram
    );
    const buyerTokenBAccount = await getAssociatedTokenAddress(
      deal.tokenBMint,
      buyer,
      false,
      tokenBProgram
    );

    const preInstructions = await buildAtaPreInstructions(this.connection, buyer, [
      { owner: buyer, mint: deal.tokenAMint, ata: buyerTokenAAccount },
      { owner: buyer, mint: deal.tokenBMint, ata: buyerTokenBAccount },
    ]);

    const claimFeesIx = await this.program.methods
      .claimMeteoraFees()

      .accounts({
        buyer,
        deal: dealPda,
        nftVault: nftVaultPda,
        buyerTokenAAccount,
        buyerTokenBAccount,
        meteoraProgram: input.meteoraProgram,
        meteoraPosition: input.meteoraPosition,
        meteoraPool: input.meteoraPool,
        poolTokenAVault: input.poolTokenAVault,
        poolTokenBVault: input.poolTokenBVault,
        tokenAMint: deal.tokenAMint,
        tokenBMint: deal.tokenBMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .instruction();

    return [...preInstructions, claimFeesIx];
  }

  /**
   * Withdraw liquidity from a Meteora position after deal settlement
   * @returns Transaction instructions to withdraw liquidity
   */
  async withdrawLiquidity(input: WithdrawMeteoraLiquidityInput): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    const seller = this.wallet.publicKey;
    const [dealPda] = findMeteoraLpDealPDA(input.dealId, this.program.programId);

    // Get deal info
    const deal = await this.getDeal(input.dealId);
    if (!deal) {
      throw new InvalidInputError(`Deal ${input.dealId} not found`);
    }

    // Seller's NFT account is still held by the seller after settle.
    // Use the NFT's token program (Token-2022 for Meteora) — pass via input.
    const nftTokenProgram = input.nftTokenProgram ?? input.tokenAProgram;
    const sellerNftAccount = await getAssociatedTokenAddress(
      deal.positionNftMint,
      seller,
      false,
      nftTokenProgram
    );
    const sellerTokenAAccount = await getAssociatedTokenAddress(
      deal.tokenAMint,
      seller,
      false,
      input.tokenAProgram
    );
    const sellerTokenBAccount = await getAssociatedTokenAddress(
      deal.tokenBMint,
      seller,
      false,
      input.tokenBProgram
    );

    const preInstructions = await buildAtaPreInstructions(this.connection, seller, [
      { owner: seller, mint: deal.tokenAMint, ata: sellerTokenAAccount },
      { owner: seller, mint: deal.tokenBMint, ata: sellerTokenBAccount },
    ]);

    // Cast to any until IDL types are regenerated
    const withdrawIx = await (this.program.methods as any)
      .withdrawMeteoraLiquidity({
        tokenAAmountThreshold: toBN(input.tokenAAmountThreshold),
        tokenBAmountThreshold: toBN(input.tokenBAmountThreshold),
      })
      .accounts({
        seller,
        deal: dealPda,
        sellerNftAccount,
        sellerTokenAAccount,
        sellerTokenBAccount,
        meteoraProgram: input.meteoraProgram,
        meteoraPosition: input.meteoraPosition,
        meteoraPool: input.meteoraPool,
        poolTokenAVault: input.poolTokenAVault,
        poolTokenBVault: input.poolTokenBVault,
        tokenAMint: deal.tokenAMint,
        tokenBMint: deal.tokenBMint,
        poolAuthority: input.poolAuthority,
        eventAuthority: input.eventAuthority,
        tokenAProgram: input.tokenAProgram,
        tokenBProgram: input.tokenBProgram,
      } as any)
      .instruction();

    return [...preInstructions, withdrawIx];
  }

  /**
   * Split a Meteora position into two positions
   * Use this before creating a deal to sell only a portion of your position
   * @returns Transaction instructions to split the position
   */
  async splitPosition(input: SplitMeteoraPositionInput): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    const owner = this.wallet.publicKey;
    const nftTokenProgram = input.nftTokenProgram ?? TOKEN_PROGRAM_ID;

    // Owner's NFT accounts
    const sourceNftAccount = await getAssociatedTokenAddress(
      input.sourceNftMint,
      owner,
      false,
      nftTokenProgram
    );
    const targetNftAccount = await getAssociatedTokenAddress(
      input.targetNftMint,
      owner,
      false,
      nftTokenProgram
    );

    const instructions: TransactionInstruction[] = [];

    // Cast to any until IDL types are regenerated
    const splitIx = await (this.program.methods as any)
      .splitMeteoraPosition({
        unlockedLiquidityPercentage: input.unlockedLiquidityPercentage,
        permanentLockedLiquidityPercentage: input.permanentLockedLiquidityPercentage,
        feeAPercentage: input.feeAPercentage,
        feeBPercentage: input.feeBPercentage,
        reward_0Percentage: input.reward0Percentage,
        reward_1Percentage: input.reward1Percentage,
      })
      .accounts({
        owner,
        meteoraPool: input.meteoraPool,
        sourcePosition: input.sourcePosition,
        sourceNftAccount,
        targetPosition: input.targetPosition,
        targetNftAccount,
        targetNftMint: input.targetNftMint,
        meteoraProgram: input.meteoraProgram,
        eventAuthority: input.eventAuthority,
      } as any)
      .instruction();

    instructions.push(splitIx);

    return instructions;
  }
}

/**
 * Input for settling a Meteora LP deal (on-chain instruction auto-claims
 * fees before returning the NFT, hence the long account list).
 */
export interface SettleMeteoraLpDealInput {
  /** Deal ID */
  dealId: number | BN;
  /** Meteora DAMM v2 program (defaults from constants if omitted by caller) */
  meteoraProgram: PublicKey;
  /** Meteora pool authority (constant address) */
  poolAuthority: PublicKey;
  /** Meteora event authority PDA */
  eventAuthority: PublicKey;
  /** Meteora position account — defaults to `deal.positionAccount` */
  meteoraPosition?: PublicKey;
  /** Meteora pool account — defaults to `deal.pool` */
  meteoraPool?: PublicKey;
  /** Pool's Token A vault */
  poolTokenAVault: PublicKey;
  /** Pool's Token B vault */
  poolTokenBVault: PublicKey;
  /** NFT token program (Token or Token-2022). Defaults to TOKEN_PROGRAM_ID. */
  nftTokenProgram?: PublicKey;
  /** Token A program. Defaults to TOKEN_PROGRAM_ID. */
  tokenAProgram?: PublicKey;
  /** Token B program. Defaults to TOKEN_PROGRAM_ID. */
  tokenBProgram?: PublicKey;
}

/**
 * Main rFlow SDK Client
 *
 * @example
 * ```typescript
 * import { RFlowClient, SourceProtocol, KNOWN_MINTS } from "@rflowdapp/rflow";
 * import { Connection } from "@solana/web3.js";
 *
 * const connection = new Connection("https://api.mainnet-beta.solana.com");
 * const client = new RFlowClient({ connection, wallet: myWallet });
 *
 * // Get available deals
 * const deals = await client.yieldDeals.getAvailableDeals();
 *
 * // Create a new deal
 * const ixs = await client.yieldDeals.createDeal({
 *   receiptTokenMint: KNOWN_MINTS.MSOL,
 *   receiptTokensAmount: 10_000_000_000,  // 10 mSOL (9 decimals)
 *   principalValueAtLock: 2_000_000_000,  // ~$2000 in USDC units (6 dp)
 *   expectedYield: 30_000_000,            // 30 USDC
 *   sellingPrice: 25_000_000,             // 25 USDC
 *   durationDays: 90,
 *   sourceProtocol: SourceProtocol.Marinade,
 *   exchangeRateAtLock: 200_000_000,      // 1 mSOL = 200 USDC, scaled 1e6
 * });
 * ```
 */
export class RFlowClient {
  /** Connection to Solana cluster */
  readonly connection: Connection;
  /** Program ID */
  readonly programId: PublicKey;
  /** Anchor program instance */
  readonly program: Program<Payflow>;
  /** Yield Deals sub-client */
  readonly yieldDeals: YieldDealClient;
  /** Meteora LP Deals sub-client */
  readonly meteoraDeals: MeteoraLpDealClient;
  /** Wallet (undefined for read-only) */
  readonly wallet?: Wallet;

  constructor(config: RFlowClientConfig) {
    this.connection = config.connection;
    this.programId = config.programId ?? PROGRAM_ID;
    this.wallet = config.wallet;

    // Create provider (with or without wallet)
    const provider = config.wallet
      ? new AnchorProvider(config.connection, config.wallet, {
          commitment: "confirmed",
        })
      : new AnchorProvider(
          config.connection,
          {
            publicKey: PublicKey.default,
            signTransaction: async (tx) => tx,
            signAllTransactions: async (txs) => txs,
          } as Wallet,
          { commitment: "confirmed" }
        );

    // Create program
    this.program = new Program<Payflow>(idl as Payflow, provider);

    // Create sub-clients
    this.yieldDeals = new YieldDealClient(this.connection, this.program, config.wallet);
    this.meteoraDeals = new MeteoraLpDealClient(this.connection, this.program, config.wallet);
  }

  /**
   * Create a read-only client (no wallet required)
   */
  static readOnly(connection: Connection, programId?: PublicKey): RFlowClient {
    return new RFlowClient({ connection, programId });
  }

  /**
   * Get protocol configuration
   */
  async getConfig(): Promise<ProtocolConfig | null> {
    return fetchProtocolConfig(this.program);
  }

  /**
   * Check if protocol is paused
   */
  async isPaused(): Promise<boolean> {
    const config = await this.getConfig();
    return config?.isPaused ?? false;
  }

  /**
   * Get the protocol config PDA
   */
  getConfigPda(): [PublicKey, number] {
    return findProtocolConfigPDA(this.programId);
  }

  /**
   * Fetch a Pyth price update for an LST mint and return the on-chain
   * `priceUpdate` PublicKey. See `getPythPriceUpdate` for details.
   */
  async fetchPythPriceUpdate(
    tokenMint: PublicKey,
    opts?: { hermesEndpoint?: string; computeUnitPriceMicroLamports?: number }
  ): Promise<PublicKey | null> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required to post Pyth price updates");
    }
    return getPythPriceUpdate(this.connection, this.wallet, tokenMint, opts);
  }
}
