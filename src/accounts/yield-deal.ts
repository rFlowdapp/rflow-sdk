import { PublicKey } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import type { Payflow } from "../idl/payflow";
import { findYieldDealPDA } from "../pda";
import { fromAnchorDealStatus, fromAnchorSourceProtocol, DealStatus } from "../types/enums";
import type { YieldDeal, DealFilters } from "../types/sdk";
import type { YieldDealAccount } from "../types/accounts";
import { bnToDate } from "../utils/bn";
import { type DealDuration } from "../constants";
import { isAccountNotFoundError, FetchError } from "../errors";

/**
 * Transform on-chain YieldDealAccount to SDK YieldDeal
 */
export function transformYieldDeal(account: YieldDealAccount, pda: PublicKey): YieldDeal {
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
    receiptTokenMint: account.receiptTokenMint,
    receiptTokenVault: account.receiptTokenVault,
    receiptTokensAmount: account.receiptTokensAmount,
    principalValueAtLock: account.principalValueAtLock,
    expectedYield: account.expectedYield,
    sellingPrice: account.sellingPrice,
    paymentMint: account.paymentMint,
    durationDays: account.durationDays as DealDuration,
    createdAt: bnToDate(account.createdAt)!,
    purchasedAt: bnToDate(account.purchasedAt),
    endsAt,
    status,
    sourceProtocol: fromAnchorSourceProtocol(account.sourceProtocol),
    isAvailable: status === DealStatus.Created,
    isExpired: endsAt !== null && endsAt.getTime() < now,
  };
}

/**
 * Fetch a single YieldDeal by ID
 * @returns The deal if found, null if not found
 * @throws {FetchError} On network/RPC errors
 */
export async function fetchYieldDeal(
  program: Program<Payflow>,
  dealId: number | BN
): Promise<YieldDeal | null> {
  try {
    const [dealPda] = findYieldDealPDA(dealId, program.programId);
    const account = await program.account.yieldDeal.fetch(dealPda);
    return transformYieldDeal(account as unknown as YieldDealAccount, dealPda);
  } catch (error) {
    if (isAccountNotFoundError(error)) {
      return null;
    }
    throw new FetchError(`YieldDeal ${dealId.toString()}`, error);
  }
}

/**
 * Fetch a single YieldDeal by PDA
 * @returns The deal if found, null if not found
 * @throws {FetchError} On network/RPC errors
 */
export async function fetchYieldDealByPda(
  program: Program<Payflow>,
  dealPda: PublicKey
): Promise<YieldDeal | null> {
  try {
    const account = await program.account.yieldDeal.fetch(dealPda);
    return transformYieldDeal(account as unknown as YieldDealAccount, dealPda);
  } catch (error) {
    if (isAccountNotFoundError(error)) {
      return null;
    }
    throw new FetchError(`YieldDeal at ${dealPda.toBase58()}`, error);
  }
}

/**
 * Fetch all YieldDeals with optional filters
 */
export async function fetchAllYieldDeals(
  program: Program<Payflow>,
  filters?: DealFilters
): Promise<YieldDeal[]> {
  const accounts = await program.account.yieldDeal.all();

  let deals = accounts.map((acc) =>
    transformYieldDeal(acc.account as unknown as YieldDealAccount, acc.publicKey)
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
    if (filters.sourceProtocol) {
      deals = deals.filter((d) => d.sourceProtocol === filters.sourceProtocol);
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
 * Fetch available YieldDeals (status = Created)
 */
export async function fetchAvailableYieldDeals(program: Program<Payflow>): Promise<YieldDeal[]> {
  return fetchAllYieldDeals(program, { status: DealStatus.Created });
}

/**
 * Fetch YieldDeals by seller
 */
export async function fetchYieldDealsBySeller(
  program: Program<Payflow>,
  seller: PublicKey
): Promise<YieldDeal[]> {
  return fetchAllYieldDeals(program, { seller });
}

/**
 * Fetch YieldDeals by buyer
 */
export async function fetchYieldDealsByBuyer(
  program: Program<Payflow>,
  buyer: PublicKey
): Promise<YieldDeal[]> {
  return fetchAllYieldDeals(program, { buyer });
}
