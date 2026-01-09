import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { DealStatus, SourceProtocol } from "./enums";
import type { DealDuration } from "../constants";

/**
 * High-level YieldDeal representation for SDK users
 */
export interface YieldDeal {
  /** Unique deal ID */
  dealId: number;
  /** PDA bump seed */
  bump: number;
  /** Deal PDA address */
  pda: PublicKey;
  /** Seller wallet address */
  seller: PublicKey;
  /** Buyer wallet address (null if not purchased) */
  buyer: PublicKey | null;
  /** Receipt token mint address */
  receiptTokenMint: PublicKey;
  /** Vault PDA holding locked tokens */
  receiptTokenVault: PublicKey;
  /** Amount of receipt tokens locked */
  receiptTokensAmount: BN;
  /** Value in underlying at lock time */
  principalValueAtLock: BN;
  /** Expected yield over duration */
  expectedYield: BN;
  /** Asking price in payment token */
  sellingPrice: BN;
  /** Payment token mint (usually USDC) */
  paymentMint: PublicKey;
  /** Duration in days */
  durationDays: DealDuration;
  /** Timestamp when deal was created */
  createdAt: Date;
  /** Timestamp when deal was purchased (null if not yet) */
  purchasedAt: Date | null;
  /** Timestamp when deal ends (null if not yet purchased) */
  endsAt: Date | null;
  /** Current deal status */
  status: DealStatus;
  /** Source protocol of the receipt tokens */
  sourceProtocol: SourceProtocol;
  /** Whether the deal is available for purchase */
  isAvailable: boolean;
  /** Whether the deal has expired */
  isExpired: boolean;
}

/**
 * High-level MeteoraLpDeal representation for SDK users
 */
export interface MeteoraLpDeal {
  /** Unique deal ID */
  dealId: number;
  /** PDA bump seed */
  bump: number;
  /** Deal PDA address */
  pda: PublicKey;
  /** Seller wallet address */
  seller: PublicKey;
  /** Buyer wallet address (null if not purchased) */
  buyer: PublicKey | null;
  /** Position NFT mint address */
  positionNftMint: PublicKey;
  /** Meteora position account address */
  positionAccount: PublicKey;
  /** Vault PDA holding the Position NFT */
  positionNftVault: PublicKey;
  /** Meteora pool address */
  pool: PublicKey;
  /** Token A mint of the pool */
  tokenAMint: PublicKey;
  /** Token B mint of the pool */
  tokenBMint: PublicKey;
  /** fee_a_pending at deal creation (snapshot) */
  feeAAtLock: BN;
  /** fee_b_pending at deal creation (snapshot) */
  feeBAtLock: BN;
  /** Estimated Token A fees during deal period */
  expectedFeeA: BN;
  /** Estimated Token B fees during deal period */
  expectedFeeB: BN;
  /** Combined estimated value in USDC */
  expectedFeeValueUsdc: BN;
  /** Asking price in payment token */
  sellingPrice: BN;
  /** Payment token mint (usually USDC) */
  paymentMint: PublicKey;
  /** Duration in days */
  durationDays: DealDuration;
  /** Timestamp when deal was created */
  createdAt: Date;
  /** Timestamp when deal was purchased (null if not yet) */
  purchasedAt: Date | null;
  /** Timestamp when deal ends (null if not yet purchased) */
  endsAt: Date | null;
  /** Current deal status */
  status: DealStatus;
  /** Whether the deal is available for purchase */
  isAvailable: boolean;
  /** Whether the deal has expired */
  isExpired: boolean;
}

/**
 * Protocol configuration (read-only for SDK users)
 */
export interface ProtocolConfig {
  /** Protocol authority */
  authority: PublicKey;
  /** Treasury address for fees */
  treasury: PublicKey;
  /** Fee in basis points (200 = 2%) */
  feeBps: number;
  /** Minimum duration in days */
  minDurationDays: number;
  /** Maximum duration in days */
  maxDurationDays: number;
  /** Base penalty for buyback in basis points */
  basePenaltyBps: number;
  /** Minimum penalty at end in basis points */
  minPenaltyBps: number;
  /** Whether protocol is paused */
  isPaused: boolean;
  /** Current deal counter */
  dealCounter: number;
  /** Whitelist of allowed receipt token mints */
  allowedMints: PublicKey[];
}

/**
 * Input for creating a yield deal
 */
export interface CreateYieldDealInput {
  /** Receipt token mint address */
  receiptTokenMint: PublicKey;
  /** Amount of receipt tokens to lock */
  receiptTokensAmount: number | BN;
  /** Value in underlying at lock time */
  principalValueAtLock: number | BN;
  /** Expected yield over duration */
  expectedYield: number | BN;
  /** Asking price in payment token */
  sellingPrice: number | BN;
  /** Duration in days (30, 60, 90, 180, 365) */
  durationDays: DealDuration;
  /** Source protocol of the receipt tokens */
  sourceProtocol: SourceProtocol;
  /** Payment token mint (defaults to USDC) */
  paymentMint?: PublicKey;
}

/**
 * Input for creating a Meteora LP deal
 */
export interface CreateMeteoraLpDealInput {
  /** Position NFT mint address */
  positionNftMint: PublicKey;
  /** Meteora position account address */
  positionAccount: PublicKey;
  /** Meteora pool address */
  pool: PublicKey;
  /** Token A mint of the pool */
  tokenAMint: PublicKey;
  /** Token B mint of the pool */
  tokenBMint: PublicKey;
  /** Current fee_a_pending from the position */
  feeAAtLock: number | BN;
  /** Current fee_b_pending from the position */
  feeBAtLock: number | BN;
  /** Estimated Token A fees during deal period */
  expectedFeeA: number | BN;
  /** Estimated Token B fees during deal period */
  expectedFeeB: number | BN;
  /** Combined estimated value in USDC */
  expectedFeeValueUsdc: number | BN;
  /** Asking price in payment token */
  sellingPrice: number | BN;
  /** Duration in days (30, 60, 90, 180, 365) */
  durationDays: DealDuration;
  /** Payment token mint (defaults to USDC) */
  paymentMint?: PublicKey;
  /** NFT token program (TOKEN_PROGRAM_ID or TOKEN_2022_PROGRAM_ID) */
  nftTokenProgram?: PublicKey;
}

/**
 * Input for claiming Meteora fees
 */
export interface ClaimMeteoraFeesInput {
  /** Deal ID */
  dealId: number | BN;
  /** Meteora DAMM v2 program address */
  meteoraProgram: PublicKey;
  /** Meteora position account */
  meteoraPosition: PublicKey;
  /** Meteora pool account */
  meteoraPool: PublicKey;
  /** Pool's Token A vault */
  poolTokenAVault: PublicKey;
  /** Pool's Token B vault */
  poolTokenBVault: PublicKey;
}

/**
 * Filters for querying deals
 */
export interface DealFilters {
  /** Filter by status */
  status?: DealStatus | DealStatus[];
  /** Filter by seller */
  seller?: PublicKey;
  /** Filter by buyer */
  buyer?: PublicKey;
  /** Filter by source protocol */
  sourceProtocol?: SourceProtocol;
  /** Filter by minimum price */
  minPrice?: BN | number;
  /** Filter by maximum price */
  maxPrice?: BN | number;
}
