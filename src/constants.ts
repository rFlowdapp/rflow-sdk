import { PublicKey } from "@solana/web3.js";

/**
 * rFlow Program ID (Mainnet)
 * @see https://explorer.solana.com/address/2woLsnG7zvKdyd7geH9GAFgKSt6NLrnLDDMmFBUdDjFU
 */
export const PROGRAM_ID = new PublicKey("2woLsnG7zvKdyd7geH9GAFgKSt6NLrnLDDMmFBUdDjFU");

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

  // Liquid Staking Tokens (supported with Pyth oracle on-chain)
  MSOL: new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"),
  JITO_SOL: new PublicKey("J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn"),
  BSOL: new PublicKey("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1"),

  // Other LSTs / SPL receipt tokens (no on-chain Pyth feed yet)
  INF: new PublicKey("5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm"),

  // Solend/Save cTokens (Main Pool)
  C_SOL: new PublicKey("5h6ssFpeDeRbzsEHDbTQNH7nVGgsKrZydxdSTnLm6QdV"),
  C_USDC: new PublicKey("993dVFL2uXWYeoXuEBFXR4BijeXdTv4s6BzsCjJZuwqk"),

  // Kamino kTokens - dynamic per reserve, fetch via klend-sdk
  // Use KaminoMarket.load() then reserve.state.collateral.mintPubkey
} as const;

/**
 * Token Program ID
 */
export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

/**
 * Token-2022 Program ID (for Meteora NFTs and Token-2022 mints)
 */
export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

/**
 * Associated Token Program ID
 */
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

/**
 * System Program ID
 */
export const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");

/**
 * Rent Sysvar ID
 */
export const RENT_SYSVAR_ID = new PublicKey("SysvarRent111111111111111111111111111111111");

/**
 * Valid deal durations in days (matches on-chain config bounds)
 */
export const VALID_DURATIONS = [30, 60, 90, 180, 365] as const;
export type DealDuration = (typeof VALID_DURATIONS)[number];

// ═══════════════════════════════════════════════════════════════════
// PYTH ORACLE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Pyth Hermes API endpoint (public, no key required)
 */
export const PYTH_HERMES_API = "https://hermes.pyth.network";

/**
 * Pyth price feed IDs (hex, 0x-prefixed) for the LSTs supported on-chain.
 * These match the values hard-coded inside the program at
 * `programs/payflow/src/constants.rs`. Pass the resulting `PublicKey` you get
 * from `getPythPriceUpdate(...)` as the optional `priceUpdate` account when
 * settling / buying back a deal whose receipt token is one of these mints.
 */
export const PYTH_PRICE_FEEDS = {
  jitoSOL: "0x67be9f519b95cf24338801051f9a808eff0a578ccb388db73b7f6fe1de019ffb",
  mSOL: "0xc2289a6a43d2ce91c6f55caec370f4acc38a2ed477f58813334c6d03749ff2a4",
  bSOL: "0x89875379e70f8fbadc17aef315adf3a8d5d160b811435537e03c97e8aac97d9c",
  SOL: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
} as const;

/**
 * Map of mainnet LST mint -> Pyth price feed ID.
 * Only the entries in this map require a Pyth `priceUpdate` account at
 * settle/buyback time (when `config.use_oracle` is true).
 */
export const LST_MINT_TO_PYTH_FEED: Record<string, string> = {
  [KNOWN_MINTS.JITO_SOL.toBase58()]: PYTH_PRICE_FEEDS.jitoSOL,
  [KNOWN_MINTS.MSOL.toBase58()]: PYTH_PRICE_FEEDS.mSOL,
  [KNOWN_MINTS.BSOL.toBase58()]: PYTH_PRICE_FEEDS.bSOL,
};

/**
 * Returns true if the given mint is one of the LSTs the program recognises
 * via Pyth. When `config.use_oracle` is true on-chain, settle/buyback for
 * these mints MUST include a Pyth `priceUpdate` account.
 */
export function isLSTToken(mint: PublicKey | string): boolean {
  const key = typeof mint === "string" ? mint : mint.toBase58();
  return key in LST_MINT_TO_PYTH_FEED;
}

/**
 * Returns the Pyth feed ID (hex, 0x-prefixed) for a mint, or undefined.
 */
export function getPythFeedForMint(mint: PublicKey | string): string | undefined {
  const key = typeof mint === "string" ? mint : mint.toBase58();
  return LST_MINT_TO_PYTH_FEED[key];
}
