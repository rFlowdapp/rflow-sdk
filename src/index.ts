// Main client
export {
  RFlowClient,
  YieldDealClient,
  MeteoraLpDealClient,
  type RFlowClientConfig,
} from "./client";

// Constants
export {
  PROGRAM_ID,
  SEEDS,
  KNOWN_MINTS,
  TOKEN_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  RENT_SYSVAR_ID,
  VALID_DURATIONS,
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

// IDL type
export type { Payflow } from "./idl/payflow";
