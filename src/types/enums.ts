/**
 * Deal Status - matches on-chain enum
 */
export enum DealStatus {
  Created = "created",
  Active = "active",
  Settled = "settled",
  Cancelled = "cancelled",
  BoughtBack = "bought_back",
}

/**
 * Source Protocol - matches on-chain enum
 */
export enum SourceProtocol {
  // Phase 1: Lending
  Kamino = "kamino",
  MarginFi = "marginfi",
  Solend = "solend",
  Save = "save",
  // Phase 1: Liquid Staking
  Marinade = "marinade",
  Jito = "jito",
  Blaze = "blaze",
  Sanctum = "sanctum",
  Lido = "lido",
  // Phase 2: LP Positions
  RaydiumLp = "raydium_lp",
  MeteoraLp = "meteora_lp",
  OrcaLp = "orca_lp",
  // Phase 3: Fee Streams
  FeeStream = "fee_stream",
}

/**
 * Protocol category for grouping
 */
export type ProtocolCategory = "lending" | "staking" | "lp" | "fee";

/**
 * Get the category of a protocol
 */
export function getProtocolCategory(protocol: SourceProtocol): ProtocolCategory {
  switch (protocol) {
    case SourceProtocol.Kamino:
    case SourceProtocol.MarginFi:
    case SourceProtocol.Solend:
    case SourceProtocol.Save:
      return "lending";
    case SourceProtocol.Marinade:
    case SourceProtocol.Jito:
    case SourceProtocol.Blaze:
    case SourceProtocol.Sanctum:
    case SourceProtocol.Lido:
      return "staking";
    case SourceProtocol.RaydiumLp:
    case SourceProtocol.MeteoraLp:
    case SourceProtocol.OrcaLp:
      return "lp";
    case SourceProtocol.FeeStream:
      return "fee";
  }
}

/**
 * Anchor enum format for on-chain SourceProtocol
 */
export type AnchorSourceProtocol =
  | { kamino: Record<string, never> }
  | { marginFi: Record<string, never> }
  | { solend: Record<string, never> }
  | { save: Record<string, never> }
  | { marinade: Record<string, never> }
  | { jito: Record<string, never> }
  | { blaze: Record<string, never> }
  | { sanctum: Record<string, never> }
  | { lido: Record<string, never> }
  | { raydiumLp: Record<string, never> }
  | { meteoraLp: Record<string, never> }
  | { orcaLp: Record<string, never> }
  | { feeStream: Record<string, never> };

/**
 * Anchor enum format for on-chain DealStatus
 */
export type AnchorDealStatus =
  | { created: Record<string, never> }
  | { active: Record<string, never> }
  | { settled: Record<string, never> }
  | { cancelled: Record<string, never> }
  | { boughtBack: Record<string, never> };

/**
 * Convert SDK SourceProtocol to Anchor format
 */
export function toAnchorSourceProtocol(protocol: SourceProtocol): AnchorSourceProtocol {
  const map: Record<SourceProtocol, AnchorSourceProtocol> = {
    [SourceProtocol.Kamino]: { kamino: {} },
    [SourceProtocol.MarginFi]: { marginFi: {} },
    [SourceProtocol.Solend]: { solend: {} },
    [SourceProtocol.Save]: { save: {} },
    [SourceProtocol.Marinade]: { marinade: {} },
    [SourceProtocol.Jito]: { jito: {} },
    [SourceProtocol.Blaze]: { blaze: {} },
    [SourceProtocol.Sanctum]: { sanctum: {} },
    [SourceProtocol.Lido]: { lido: {} },
    [SourceProtocol.RaydiumLp]: { raydiumLp: {} },
    [SourceProtocol.MeteoraLp]: { meteoraLp: {} },
    [SourceProtocol.OrcaLp]: { orcaLp: {} },
    [SourceProtocol.FeeStream]: { feeStream: {} },
  };
  return map[protocol];
}

/**
 * Convert Anchor format to SDK SourceProtocol
 */
export function fromAnchorSourceProtocol(protocol: AnchorSourceProtocol): SourceProtocol {
  if ("kamino" in protocol) return SourceProtocol.Kamino;
  if ("marginFi" in protocol) return SourceProtocol.MarginFi;
  if ("solend" in protocol) return SourceProtocol.Solend;
  if ("save" in protocol) return SourceProtocol.Save;
  if ("marinade" in protocol) return SourceProtocol.Marinade;
  if ("jito" in protocol) return SourceProtocol.Jito;
  if ("blaze" in protocol) return SourceProtocol.Blaze;
  if ("sanctum" in protocol) return SourceProtocol.Sanctum;
  if ("lido" in protocol) return SourceProtocol.Lido;
  if ("raydiumLp" in protocol) return SourceProtocol.RaydiumLp;
  if ("meteoraLp" in protocol) return SourceProtocol.MeteoraLp;
  if ("orcaLp" in protocol) return SourceProtocol.OrcaLp;
  if ("feeStream" in protocol) return SourceProtocol.FeeStream;
  throw new Error("Unknown source protocol");
}

/**
 * Convert Anchor format to SDK DealStatus
 */
export function fromAnchorDealStatus(status: AnchorDealStatus): DealStatus {
  if ("created" in status) return DealStatus.Created;
  if ("active" in status) return DealStatus.Active;
  if ("settled" in status) return DealStatus.Settled;
  if ("cancelled" in status) return DealStatus.Cancelled;
  if ("boughtBack" in status) return DealStatus.BoughtBack;
  throw new Error("Unknown deal status");
}
