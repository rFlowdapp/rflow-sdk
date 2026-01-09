// Enums
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
} from "./enums";

// Account types (on-chain)
export type {
  YieldDealAccount,
  MeteoraLpDealAccount,
  ProtocolConfigAccount,
  CreateDealParams,
  CreateMeteoraLpDealParams,
} from "./accounts";

// SDK types (high-level)
export type {
  YieldDeal,
  MeteoraLpDeal,
  ProtocolConfig,
  CreateYieldDealInput,
  CreateMeteoraLpDealInput,
  ClaimMeteoraFeesInput,
  DealFilters,
} from "./sdk";
