import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { PROGRAM_ID, SEEDS } from "../constants";

/**
 * Find the MeteoraLpDeal PDA for a given deal ID
 * @param dealId - The deal ID (number or BN)
 * @param programId - The program ID (defaults to PROGRAM_ID)
 * @returns [PDA, bump] tuple
 */
export function findMeteoraLpDealPDA(
  dealId: number | BN,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  const id = typeof dealId === "number" ? new BN(dealId) : dealId;
  return PublicKey.findProgramAddressSync(
    [SEEDS.METEORA_LP_DEAL, id.toArrayLike(Buffer, "le", 8)],
    programId
  );
}

/**
 * Find the NFT Vault PDA for a MeteoraLpDeal
 * @param dealPda - The deal PDA
 * @param programId - The program ID (defaults to PROGRAM_ID)
 * @returns [PDA, bump] tuple
 */
export function findMeteoraVaultPDA(
  dealPda: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.METEORA_NFT_VAULT, dealPda.toBuffer()], programId);
}
