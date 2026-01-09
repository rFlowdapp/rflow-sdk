import { Program } from "@coral-xyz/anchor";
import type { Payflow } from "../idl/payflow";
import { findProtocolConfigPDA } from "../pda";
import type { ProtocolConfig } from "../types/sdk";
import type { ProtocolConfigAccount } from "../types/accounts";
import { isAccountNotFoundError, FetchError } from "../errors";

/**
 * Transform on-chain ProtocolConfigAccount to SDK ProtocolConfig
 */
export function transformProtocolConfig(account: ProtocolConfigAccount): ProtocolConfig {
  return {
    authority: account.authority,
    treasury: account.treasury,
    feeBps: account.feeBps,
    minDurationDays: account.minDurationDays,
    maxDurationDays: account.maxDurationDays,
    basePenaltyBps: account.basePenaltyBps,
    minPenaltyBps: account.minPenaltyBps,
    isPaused: account.isPaused,
    dealCounter: account.dealCounter.toNumber(),
    allowedMints: account.allowedMints,
  };
}

/**
 * Fetch the ProtocolConfig
 * @returns The config if found, null if not initialized
 * @throws {FetchError} On network/RPC errors
 */
export async function fetchProtocolConfig(
  program: Program<Payflow>
): Promise<ProtocolConfig | null> {
  try {
    const [configPda] = findProtocolConfigPDA(program.programId);
    const account = await program.account.protocolConfig.fetch(configPda);
    return transformProtocolConfig(account as unknown as ProtocolConfigAccount);
  } catch (error) {
    if (isAccountNotFoundError(error)) {
      return null;
    }
    throw new FetchError("ProtocolConfig", error);
  }
}
