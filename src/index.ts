// Main client
export {
  RFlowClient,
  YieldDealClient,
  MeteoraLpDealClient,
  buildAtaPreInstructions,
  getPythPriceUpdate,
  type RFlowClientConfig,
  type SettleOverrides,
  type SettleMeteoraLpDealInput,
} from "./client";

// Constants
export {
  PROGRAM_ID,
  SEEDS,
  KNOWN_MINTS,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  RENT_SYSVAR_ID,
  VALID_DURATIONS,
  PYTH_HERMES_API,
  PYTH_PRICE_FEEDS,
  LST_MINT_TO_PYTH_FEED,
  isLSTToken,
  getPythFeedForMint,
  type DealDuration,
} from "./constants";

// Types - Enums
export {
  DealStatus,
  SourceProtocol,
  getProtocolCategory,
  toAnchorSourceProtocol,
  fromAnchorSourceProtocol,
  fromAnchorDealStatus,
  type AnchorSourceProtocol,
  type AnchorDealStatus,
  type ProtocolCategory,
} from "./types/enums";

// Types - SDK (high-level)
export type {
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

// Types - Accounts (on-chain)
export type {
  YieldDealAccount,
  MeteoraLpDealAccount,
  ProtocolConfigAccount,
  CreateDealParams,
  CreateMeteoraLpDealParams,
} from "./types/accounts";

// PDA helpers
export {
  findProtocolConfigPDA,
  findYieldDealPDA,
  findVaultPDA,
  findMeteoraLpDealPDA,
  findMeteoraVaultPDA,
} from "./pda";

// Account fetchers
export {
  transformYieldDeal,
  fetchYieldDeal,
  fetchYieldDealByPda,
  fetchAllYieldDeals,
  fetchAvailableYieldDeals,
  fetchYieldDealsBySeller,
  fetchYieldDealsByBuyer,
  transformMeteoraLpDeal,
  fetchMeteoraLpDeal,
  fetchMeteoraLpDealByPda,
  fetchAllMeteoraLpDeals,
  fetchAvailableMeteoraLpDeals,
  fetchMeteoraLpDealsBySeller,
  fetchMeteoraLpDealsByBuyer,
  transformProtocolConfig,
  fetchProtocolConfig,
} from "./accounts";

// Utils
export {
  toBN,
  toNumber,
  toNumberSafe,
  bnToDate,
  dateToBn,
  formatAmount,
  parseAmount,
  parseAmountSafe,
  BNOverflowError,
  InvalidAmountFormatError,
} from "./utils";

// Errors
export {
  RFlowError,
  FetchError,
  DealNotFoundError,
  InvalidInputError,
  ProtocolPausedError,
  InvalidDurationError,
  DealNotAvailableError,
  UnauthorizedError,
  parseAnchorError,
  isAccountNotFoundError,
  ERROR_CODES,
  type ErrorContext,
} from "./errors";

// Re-exported anchor primitives (CJS-interop-safe). Use these from the SDK
// instead of importing from `@coral-xyz/anchor` directly — anchor's package
// has no `exports` map and pure Node ESM cannot statically bind its named
// exports.
export { BN, AnchorProvider, Program, Wallet, type Idl } from "./internal/anchor";

// IDL type
export type { Payflow } from "./idl/payflow";
