import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, SEEDS } from "../constants";

/**
 * Find the ProtocolConfig PDA
 * @param programId - The program ID (defaults to PROGRAM_ID)
 * @returns [PDA, bump] tuple
 */
export function findProtocolConfigPDA(programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.PROTOCOL_CONFIG], programId);
}
