import { PublicKey } from "@solana/web3.js";

/**
 * rFlow Program ID (mainnet/devnet)
 */
export const PROGRAM_ID = new PublicKey("2yUwGR18L5a8UqfkX49M4SenYCrS4B48chioKWCnMG3y");

/**
 * PDA Seeds
 */
export const SEEDS = {
  PROTOCOL_CONFIG: Buffer.from("protocol_config"),
  YIELD_DEAL: Buffer.from("yield_deal"),
  VAULT: Buffer.from("vault"),
  METEORA_LP_DEAL: Buffer.from("meteora_lp_deal"),
  METEORA_NFT_VAULT: Buffer.from("meteora_nft_vault"),
} as const;

/**
 * Known Token Mints (Mainnet)
 */
export const KNOWN_MINTS = {
  // Stablecoins
  USDC: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),

  // Liquid Staking Tokens
  MSOL: new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"),
  JITO_SOL: new PublicKey("J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn"),
  BSOL: new PublicKey("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1"),
  STSOL: new PublicKey("7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj"),
  INF: new PublicKey("5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm"),

  // Kamino Receipt Tokens
  KUSDC: new PublicKey("H4LBbR3xBcKvgzxgY9PCxYMvxPjHYfqzEHq6k6dXN1h3"),
} as const;

/**
 * Token Program ID
 */
export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

/**
 * System Program ID
 */
export const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");

/**
 * Rent Sysvar ID
 */
export const RENT_SYSVAR_ID = new PublicKey("SysvarRent111111111111111111111111111111111");

/**
 * Valid deal durations in days
 */
export const VALID_DURATIONS = [30, 60, 90, 180, 365] as const;
export type DealDuration = (typeof VALID_DURATIONS)[number];
