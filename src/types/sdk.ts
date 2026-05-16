import { PublicKey } from "@solana/web3.js";
import type { BN } from "@coral-xyz/anchor";
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
  /** Whitelist of allowed payment token mints */
  allowedPaymentMints: PublicKey[];
  /** Whether oracle validation is enabled */
  useOracle: boolean;
}

/**
 * Input for creating a yield deal
 */
export interface CreateYieldDealInput {
  /** Receipt token mint address */
  receiptTokenMint: PublicKey;
  /** Amount of receipt tokens to lock (raw u64 in mint's smallest units) */
  receiptTokensAmount: number | BN;
  /** Value in underlying at lock time (raw u64 in payment-mint smallest units) */
  principalValueAtLock: number | BN;
  /** Expected yield over duration (raw u64 in payment-mint smallest units) */
  expectedYield: number | BN;
  /** Asking price in payment token (raw u64) */
  sellingPrice: number | BN;
  /** Duration in days (30, 60, 90, 180, 365) */
  durationDays: DealDuration;
  /** Source protocol of the receipt tokens */
  sourceProtocol: SourceProtocol;
  /** Payment token mint (defaults to USDC) */
  paymentMint?: PublicKey;
  /**
   * Optional Pyth price update account. Required on mainnet for LST receipt
   * tokens when `config.use_oracle` is true. When omitted and the conditions
   * apply, the SDK auto-fetches via {@link getPythPriceUpdate}; set
   * `fetchPythPriceUpdate: false` to disable that behaviour.
   */
  priceUpdate?: PublicKey;
  /**
   * Auto-fetch Pyth price update when missing and required (defaults true).
   * Set to false if you want createDeal to error instead of fetching.
   */
  fetchPythPriceUpdate?: boolean;
  /**
   * Exchange rate at lock time (scaled by 1e6).
   * e.g. for kUSDC at 1.05 rate: 1_050_000
   * Used by the program for the ±10% tolerance band at settlement.
   */
  exchangeRateAtLock: number | BN;
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
  /** Token A program (Token or Token-2022). Defaults to TOKEN_PROGRAM_ID. */
  tokenAProgram?: PublicKey;
  /** Token B program (Token or Token-2022). Defaults to TOKEN_PROGRAM_ID. */
  tokenBProgram?: PublicKey;
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

/**
 * Input for withdrawing Meteora liquidity after deal settlement
 */
export interface WithdrawMeteoraLiquidityInput {
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
  /** Meteora pool authority (constant) */
  poolAuthority: PublicKey;
  /** Meteora event authority PDA */
  eventAuthority: PublicKey;
  /** Token A program (Token or Token2022) */
  tokenAProgram: PublicKey;
  /** Token B program (Token or Token2022) */
  tokenBProgram: PublicKey;
  /** Optional NFT token program override (defaults to `tokenAProgram`) */
  nftTokenProgram?: PublicKey;
  /** Minimum Token A to receive (slippage protection) */
  tokenAAmountThreshold: number | BN;
  /** Minimum Token B to receive (slippage protection) */
  tokenBAmountThreshold: number | BN;
}

/**
 * Input for splitting a Meteora position
 */
export interface SplitMeteoraPositionInput {
  /** Meteora pool address */
  meteoraPool: PublicKey;
  /** Source position account (to split from) */
  sourcePosition: PublicKey;
  /** Source position NFT mint */
  sourceNftMint: PublicKey;
  /** Target position account (receives split) */
  targetPosition: PublicKey;
  /** Target position NFT mint */
  targetNftMint: PublicKey;
  /** Meteora DAMM v2 program address */
  meteoraProgram: PublicKey;
  /** Meteora event authority PDA */
  eventAuthority: PublicKey;
  /** NFT token program (Token or Token2022) */
  nftTokenProgram?: PublicKey;
  /** Percentage of unlocked liquidity to transfer (0-100) */
  unlockedLiquidityPercentage: number;
  /** Percentage of permanent locked liquidity to transfer (0-100) */
  permanentLockedLiquidityPercentage: number;
  /** Percentage of pending fee A to transfer (0-100) */
  feeAPercentage: number;
  /** Percentage of pending fee B to transfer (0-100) */
  feeBPercentage: number;
  /** Percentage of reward 0 to transfer (0-100) */
  reward0Percentage: number;
  /** Percentage of reward 1 to transfer (0-100) */
  reward1Percentage: number;
}
