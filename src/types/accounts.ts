import { PublicKey } from "@solana/web3.js";
import type { BN } from "@coral-xyz/anchor";
import type { AnchorDealStatus, AnchorSourceProtocol } from "./enums";

/**
 * On-chain YieldDeal account structure
 */
export interface YieldDealAccount {
  dealId: BN;
  bump: number;
  seller: PublicKey;
  buyer: PublicKey;
  receiptTokenMint: PublicKey;
  receiptTokenVault: PublicKey;
  receiptTokensAmount: BN;
  principalValueAtLock: BN;
  expectedYield: BN;
  sellingPrice: BN;
  paymentMint: PublicKey;
  /** Exchange rate at lock time (scaled by 1e6) - used for anti-manipulation validation */
  exchangeRateAtLock: BN;
  durationDays: number;
  createdAt: BN;
  purchasedAt: BN;
  endsAt: BN;
  status: AnchorDealStatus;
  sourceProtocol: AnchorSourceProtocol;
}

/**
 * On-chain MeteoraLpDeal account structure
 */
export interface MeteoraLpDealAccount {
  dealId: BN;
  bump: number;
  seller: PublicKey;
  buyer: PublicKey;
  positionNftMint: PublicKey;
  positionAccount: PublicKey;
  positionNftVault: PublicKey;
  pool: PublicKey;
  tokenAMint: PublicKey;
  tokenBMint: PublicKey;
  feeAAtLock: BN;
  feeBAtLock: BN;
  expectedFeeA: BN;
  expectedFeeB: BN;
  expectedFeeValueUsdc: BN;
  sellingPrice: BN;
  paymentMint: PublicKey;
  durationDays: number;
  createdAt: BN;
  purchasedAt: BN;
  endsAt: BN;
  status: AnchorDealStatus;
}

/**
 * On-chain ProtocolConfig account structure
 */
export interface ProtocolConfigAccount {
  authority: PublicKey;
  treasury: PublicKey;
  feeBps: number;
  minDurationDays: number;
  maxDurationDays: number;
  basePenaltyBps: number;
  minPenaltyBps: number;
  isPaused: boolean;
  dealCounter: BN;
  bump: number;
  allowedMints: PublicKey[];
  allowedPaymentMints: PublicKey[];
  useOracle: boolean;
}

/**
 * CreateDealParams for on-chain instruction
 */
export interface CreateDealParams {
  receiptTokensAmount: BN;
  principalValueAtLock: BN;
  expectedYield: BN;
  sellingPrice: BN;
  durationDays: number;
  sourceProtocol: AnchorSourceProtocol;
  /** Exchange rate at lock time (scaled by 1e6, e.g., 1.05 = 1_050_000) */
  exchangeRateAtLock: BN;
}

/**
 * CreateMeteoraLpDealParams for on-chain instruction
 */
export interface CreateMeteoraLpDealParams {
  positionAccount: PublicKey;
  pool: PublicKey;
  feeAAtLock: BN;
  feeBAtLock: BN;
  expectedFeeA: BN;
  expectedFeeB: BN;
  expectedFeeValueUsdc: BN;
  sellingPrice: BN;
  durationDays: number;
}
