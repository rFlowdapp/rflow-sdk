import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { PROGRAM_ID, SEEDS } from "../constants";

/**
 * Find the YieldDeal PDA for a given deal ID
 * @param dealId - The deal ID (number or BN)
 * @param programId - The program ID (defaults to PROGRAM_ID)
 * @returns [PDA, bump] tuple
 */
export function findYieldDealPDA(
  dealId: number | BN,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  const id = typeof dealId === "number" ? new BN(dealId) : dealId;
  return PublicKey.findProgramAddressSync(
    [SEEDS.YIELD_DEAL, id.toArrayLike(Buffer, "le", 8)],
    programId
  );
}

/**
 * Find the Vault PDA for a YieldDeal
 * @param dealPda - The deal PDA
 * @param programId - The program ID (defaults to PROGRAM_ID)
 * @returns [PDA, bump] tuple
 */
export function findVaultPDA(
  dealPda: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.VAULT, dealPda.toBuffer()], programId);
}
