import { PublicKey } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import type { Payflow } from "../idl/payflow";
import { findMeteoraLpDealPDA } from "../pda";
import { fromAnchorDealStatus, DealStatus } from "../types/enums";
import type { MeteoraLpDeal, DealFilters } from "../types/sdk";
import type { MeteoraLpDealAccount } from "../types/accounts";
import { bnToDate } from "../utils/bn";
import type { DealDuration } from "../constants";
import { isAccountNotFoundError, FetchError } from "../errors";

/**
 * Transform on-chain MeteoraLpDealAccount to SDK MeteoraLpDeal
 */
export function transformMeteoraLpDeal(
  account: MeteoraLpDealAccount,
  pda: PublicKey
): MeteoraLpDeal {
  const status = fromAnchorDealStatus(account.status);
  const now = Date.now();
  const endsAt = bnToDate(account.endsAt);

  // Check if buyer is default pubkey (not purchased)
  const isDefaultBuyer = account.buyer.equals(PublicKey.default);

  return {
    dealId: account.dealId.toNumber(),
    bump: account.bump,
    pda,
    seller: account.seller,
    buyer: isDefaultBuyer ? null : account.buyer,
    positionNftMint: account.positionNftMint,
    positionAccount: account.positionAccount,
    positionNftVault: account.positionNftVault,
    pool: account.pool,
    tokenAMint: account.tokenAMint,
    tokenBMint: account.tokenBMint,
    feeAAtLock: account.feeAAtLock,
    feeBAtLock: account.feeBAtLock,
    expectedFeeA: account.expectedFeeA,
    expectedFeeB: account.expectedFeeB,
    expectedFeeValueUsdc: account.expectedFeeValueUsdc,
    sellingPrice: account.sellingPrice,
    paymentMint: account.paymentMint,
    durationDays: account.durationDays as DealDuration,
    createdAt: bnToDate(account.createdAt)!,
    purchasedAt: bnToDate(account.purchasedAt),
    endsAt,
    status,
    isAvailable: status === DealStatus.Created,
    isExpired: endsAt !== null && endsAt.getTime() < now,
  };
}

/**
 * Fetch a single MeteoraLpDeal by ID
 * @returns The deal if found, null if not found
 * @throws {FetchError} On network/RPC errors
 */
export async function fetchMeteoraLpDeal(
  program: Program<Payflow>,
  dealId: number | BN
): Promise<MeteoraLpDeal | null> {
  try {
    const [dealPda] = findMeteoraLpDealPDA(dealId, program.programId);
    const account = await program.account.meteoraLpDeal.fetch(dealPda);
    return transformMeteoraLpDeal(account as unknown as MeteoraLpDealAccount, dealPda);
  } catch (error) {
    if (isAccountNotFoundError(error)) {
      return null;
    }
    throw new FetchError(`MeteoraLpDeal ${dealId.toString()}`, error);
  }
}

/**
 * Fetch a single MeteoraLpDeal by PDA
 * @returns The deal if found, null if not found
 * @throws {FetchError} On network/RPC errors
 */
export async function fetchMeteoraLpDealByPda(
  program: Program<Payflow>,
  dealPda: PublicKey
): Promise<MeteoraLpDeal | null> {
  try {
    const account = await program.account.meteoraLpDeal.fetch(dealPda);
    return transformMeteoraLpDeal(account as unknown as MeteoraLpDealAccount, dealPda);
  } catch (error) {
    if (isAccountNotFoundError(error)) {
      return null;
    }
    throw new FetchError(`MeteoraLpDeal at ${dealPda.toBase58()}`, error);
  }
}

/**
 * Fetch all MeteoraLpDeals with optional filters
 */
export async function fetchAllMeteoraLpDeals(
  program: Program<Payflow>,
  filters?: DealFilters
): Promise<MeteoraLpDeal[]> {
  const accounts = await program.account.meteoraLpDeal.all();

  let deals = accounts.map((acc) =>
    transformMeteoraLpDeal(acc.account as unknown as MeteoraLpDealAccount, acc.publicKey)
  );

  // Apply filters
  if (filters) {
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      deals = deals.filter((d) => statuses.includes(d.status));
    }
    if (filters.seller) {
      deals = deals.filter((d) => d.seller.equals(filters.seller!));
    }
    if (filters.buyer) {
      deals = deals.filter((d) => d.buyer?.equals(filters.buyer!) ?? false);
    }
    if (filters.minPrice) {
      const min =
        typeof filters.minPrice === "number" ? new BN(filters.minPrice) : filters.minPrice;
      deals = deals.filter((d) => d.sellingPrice.gte(min));
    }
    if (filters.maxPrice) {
      const max =
        typeof filters.maxPrice === "number" ? new BN(filters.maxPrice) : filters.maxPrice;
      deals = deals.filter((d) => d.sellingPrice.lte(max));
    }
  }

  return deals;
}

/**
 * Fetch available MeteoraLpDeals (status = Created)
 */
export async function fetchAvailableMeteoraLpDeals(
  program: Program<Payflow>
): Promise<MeteoraLpDeal[]> {
  return fetchAllMeteoraLpDeals(program, { status: DealStatus.Created });
}

/**
 * Fetch MeteoraLpDeals by seller
 */
export async function fetchMeteoraLpDealsBySeller(
  program: Program<Payflow>,
  seller: PublicKey
): Promise<MeteoraLpDeal[]> {
  return fetchAllMeteoraLpDeals(program, { seller });
}

/**
 * Fetch MeteoraLpDeals by buyer
 */
export async function fetchMeteoraLpDealsByBuyer(
  program: Program<Payflow>,
  buyer: PublicKey
): Promise<MeteoraLpDeal[]> {
  return fetchAllMeteoraLpDeals(program, { buyer });
}
