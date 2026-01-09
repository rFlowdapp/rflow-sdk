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
import { AnchorProvider, Program, BN, type Wallet } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

import type { Payflow } from "./idl/payflow";
import idl from "./idl/payflow.json";
import { PROGRAM_ID, KNOWN_MINTS, VALID_DURATIONS } from "./constants";
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
 * Yield Deal client for interacting with yield deals
 */
export class YieldDealClient {
  constructor(
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
      })

      .accounts({
        seller,
        config: configPda,
        deal: dealPda,
        sellerTokenAccount,
        vault: vaultPda,
        receiptTokenMint: input.receiptTokenMint,
        paymentMint,
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

    const instructions: TransactionInstruction[] = [];

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

    instructions.push(buyDealIx);

    return instructions;
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

    const instructions: TransactionInstruction[] = [];

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

    instructions.push(cancelDealIx);

    return instructions;
  }

  /**
   * Settle a deal after it ends
   * @returns Transaction instructions to settle the deal
   */
  async settleDeal(
    dealId: number | BN,
    currentTokenValue: number | BN
  ): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    const payer = this.wallet.publicKey;
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

    const buyerTokenAccount = await getAssociatedTokenAddress(deal.receiptTokenMint, deal.buyer);
    const sellerTokenAccount = await getAssociatedTokenAddress(deal.receiptTokenMint, deal.seller);

    const instructions: TransactionInstruction[] = [];

    const settleDealIx = await this.program.methods
      .settleDeal(toBN(currentTokenValue))

      .accounts({
        payer,
        deal: dealPda,
        vault: vaultPda,
        buyerTokenAccount,
        sellerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .instruction();

    instructions.push(settleDealIx);

    return instructions;
  }

  /**
   * Buyback a deal before it ends (seller early exit)
   * @returns Transaction instructions to buyback the deal
   */
  async buybackDeal(
    dealId: number | BN,
    yieldAccumulated: number | BN
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

    const sellerPaymentAccount = await getAssociatedTokenAddress(deal.paymentMint, seller);
    const sellerReceiptAccount = await getAssociatedTokenAddress(deal.receiptTokenMint, seller);
    const buyerPaymentAccount = await getAssociatedTokenAddress(deal.paymentMint, deal.buyer);

    const instructions: TransactionInstruction[] = [];

    const buybackDealIx = await this.program.methods
      .buybackDeal(toBN(yieldAccumulated))

      .accounts({
        seller,
        config: configPda,
        deal: dealPda,
        vault: vaultPda,
        sellerPaymentAccount,
        sellerReceiptAccount,
        buyerPaymentAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .instruction();

    instructions.push(buybackDealIx);

    return instructions;
  }
}

/**
 * Meteora LP Deal client for interacting with Meteora LP deals
 */
export class MeteoraLpDealClient {
  constructor(
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

    const instructions: TransactionInstruction[] = [];

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

    instructions.push(buyDealIx);

    return instructions;
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
   * Settle a Meteora LP deal after it ends
   * @returns Transaction instructions to settle the deal
   */
  async settleDeal(
    dealId: number | BN,
    nftTokenProgram: PublicKey = TOKEN_PROGRAM_ID
  ): Promise<TransactionInstruction[]> {
    if (!this.wallet) {
      throw new InvalidInputError("Wallet required for write operations");
    }

    const payer = this.wallet.publicKey;
    const [dealPda] = findMeteoraLpDealPDA(dealId, this.program.programId);
    const [nftVaultPda] = findMeteoraVaultPDA(dealPda, this.program.programId);

    // Get deal info
    const deal = await this.getDeal(dealId);
    if (!deal) {
      throw new InvalidInputError(`Deal ${dealId} not found`);
    }

    const sellerNftAccount = await getAssociatedTokenAddress(
      deal.positionNftMint,
      deal.seller,
      false,
      nftTokenProgram
    );

    const instructions: TransactionInstruction[] = [];

    const settleDealIx = await this.program.methods
      .settleMeteoraLpDeal()

      .accounts({
        payer,
        deal: dealPda,
        nftVault: nftVaultPda,
        sellerNftAccount,
        positionNftMint: deal.positionNftMint,
        nftTokenProgram,
      } as any)
      .instruction();

    instructions.push(settleDealIx);

    return instructions;
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

    const buyerTokenAAccount = await getAssociatedTokenAddress(deal.tokenAMint, buyer);
    const buyerTokenBAccount = await getAssociatedTokenAddress(deal.tokenBMint, buyer);

    const instructions: TransactionInstruction[] = [];

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

    instructions.push(claimFeesIx);

    return instructions;
  }
}

/**
 * Main rFlow SDK Client
 *
 * @example
 * ```typescript
 * import { RFlowClient, SourceProtocol } from "@payflow/sdk";
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
 *   receiptTokenMint: kUsdcMint,
 *   receiptTokensAmount: 10_000_000_000,
 *   principalValueAtLock: 10_000_000_000,
 *   expectedYield: 150_000_000,
 *   sellingPrice: 125_000_000,
 *   durationDays: 90,
 *   sourceProtocol: SourceProtocol.Kamino,
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

  constructor(config: RFlowClientConfig) {
    this.connection = config.connection;
    this.programId = config.programId ?? PROGRAM_ID;

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
    this.yieldDeals = new YieldDealClient(this.program, config.wallet);
    this.meteoraDeals = new MeteoraLpDealClient(this.program, config.wallet);
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
}
