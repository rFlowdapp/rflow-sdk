/**
 * Example: Create a Meteora DAMM v2 LP fee deal.
 *
 * Usage:
 *   npx tsx examples/create-meteora-lp-deal.ts
 *
 * Environment variables (all required for live mode):
 *   RFLOW_RPC_URL              — Solana RPC (default: public mainnet)
 *   RFLOW_WALLET_PATH          — Path to keypair JSON (default: ~/.config/solana/id.json)
 *   METEORA_POSITION_ACCOUNT   — Your Meteora Position PDA (base58)
 *   METEORA_POOL               — The pool containing the position (base58)
 *   METEORA_NFT_MINT           — The Position NFT mint (Token-2022) (base58)
 *   METEORA_TOKEN_A_MINT       — Pool's token A mint (base58)
 *   METEORA_TOKEN_B_MINT       — Pool's token B mint (base58, usually USDC)
 *   RFLOW_EXPECTED_FEE_USDC    — Total fee estimate in USDC (e.g. "100" for 100 USDC)
 *   RFLOW_SELLING_PRICE_USDC   — Asking price in USDC (must be ≤ expected fee value)
 *   RFLOW_DURATION_DAYS        — 30 | 60 | 90 | 180 | 365 (default: 60)
 *   RFLOW_LIVE                 — "1" to send, otherwise dry-run
 *
 * What it does:
 *   1. Loads wallet + Meteora position parameters from env
 *   2. Builds a `createMeteoraLpDeal` transaction targeting the Token-2022 NFT
 *   3. Logs and (optionally) sends the transaction
 *
 * NOTE: Use Meteora's SDK (`@meteora-ag/cp-amm-sdk`) to read your current
 * position's `fee_a_pending` / `fee_b_pending` and to estimate expected fees.
 * For brevity this example just sets the snapshot to 0 and lets the buyer
 * collect everything that accrues during the deal.
 */
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

import { RFlowClient, KNOWN_MINTS, TOKEN_2022_PROGRAM_ID, VALID_DURATIONS } from "../src";
import type { DealDuration } from "../src";

function loadWallet(): Wallet {
  const path = process.env.RFLOW_WALLET_PATH ?? resolve(homedir(), ".config/solana/id.json");
  try {
    const secret = Uint8Array.from(JSON.parse(readFileSync(path, "utf8")));
    return new Wallet(Keypair.fromSecretKey(secret));
  } catch {
    console.warn(`[warn] could not load wallet from ${path} — using ephemeral keypair (dry-run only).`);
    return new Wallet(Keypair.generate());
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function parseDuration(): DealDuration {
  const raw = Number(process.env.RFLOW_DURATION_DAYS ?? "60");
  if (!VALID_DURATIONS.includes(raw as DealDuration)) {
    throw new Error(`RFLOW_DURATION_DAYS must be one of ${VALID_DURATIONS.join(", ")} (got ${raw})`);
  }
  return raw as DealDuration;
}

async function main(): Promise<void> {
  const rpc = process.env.RFLOW_RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpc, "confirmed");
  const wallet = loadWallet();
  const live = process.env.RFLOW_LIVE === "1";

  console.log("rFlow — Create Meteora LP Deal example");
  console.log(`  RPC:    ${rpc}`);
  console.log(`  Wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`  Mode:   ${live ? "LIVE (will send transaction)" : "dry-run"}`);

  // Required Meteora position context.
  // In dry-run mode you can omit these; we substitute the wallet's pubkey
  // so the build still runs end-to-end (transaction will simulate-fail).
  const positionAccount = process.env.METEORA_POSITION_ACCOUNT
    ? new PublicKey(requireEnv("METEORA_POSITION_ACCOUNT"))
    : wallet.publicKey;
  const pool = process.env.METEORA_POOL
    ? new PublicKey(requireEnv("METEORA_POOL"))
    : wallet.publicKey;
  const positionNftMint = process.env.METEORA_NFT_MINT
    ? new PublicKey(requireEnv("METEORA_NFT_MINT"))
    : wallet.publicKey;
  const tokenAMint = process.env.METEORA_TOKEN_A_MINT
    ? new PublicKey(requireEnv("METEORA_TOKEN_A_MINT"))
    : new PublicKey("So11111111111111111111111111111111111111112"); // wSOL
  const tokenBMint = process.env.METEORA_TOKEN_B_MINT
    ? new PublicKey(requireEnv("METEORA_TOKEN_B_MINT"))
    : KNOWN_MINTS.USDC;

  const expectedFeeUsdcUi = Number(process.env.RFLOW_EXPECTED_FEE_USDC ?? "100");
  const sellingPriceUsdcUi = Number(process.env.RFLOW_SELLING_PRICE_USDC ?? "80");

  const client = new RFlowClient({ connection, wallet });

  const config = await client.getConfig();
  if (!config) {
    console.error("Protocol config not found — is the SDK pointed at the right cluster?");
    return;
  }
  if (config.isPaused) {
    console.error("Protocol is paused — aborting.");
    return;
  }

  const input = {
    positionNftMint,
    positionAccount,
    pool,
    tokenAMint,
    tokenBMint,
    feeAAtLock: 0,                    // snapshot fee_a_pending right now (use Meteora SDK)
    feeBAtLock: 0,                    // snapshot fee_b_pending right now (use Meteora SDK)
    expectedFeeA: 0,                  // estimated Token A fees over duration (informational)
    expectedFeeB: Math.floor(expectedFeeUsdcUi * 1e6), // approx all in token B for simplicity
    expectedFeeValueUsdc: Math.floor(expectedFeeUsdcUi * 1e6),
    sellingPrice: Math.floor(sellingPriceUsdcUi * 1e6),
    durationDays: parseDuration(),
    paymentMint: KNOWN_MINTS.USDC,
    nftTokenProgram: TOKEN_2022_PROGRAM_ID, // Meteora positions use Token-2022
  } as const;

  console.log("\nDeal parameters:");
  console.log(`  Position NFT:    ${input.positionNftMint.toBase58()}`);
  console.log(`  Position:        ${input.positionAccount.toBase58()}`);
  console.log(`  Pool:            ${input.pool.toBase58()}`);
  console.log(`  Token A:         ${input.tokenAMint.toBase58()}`);
  console.log(`  Token B:         ${input.tokenBMint.toBase58()}`);
  console.log(`  Expected value:  ${expectedFeeUsdcUi} USDC`);
  console.log(`  Selling price:   ${sellingPriceUsdcUi} USDC`);
  console.log(`  Duration:        ${input.durationDays} days`);

  console.log("\nBuilding transaction...");
  const ixs = await client.meteoraDeals.createDeal(input);
  console.log(`  -> ${ixs.length} instruction(s)`);

  if (!live) {
    console.log("\nDry-run mode — not sending. Set RFLOW_LIVE=1 (with real position env vars) to send.");
    return;
  }

  console.log("\nSending transaction...");
  const tx = new Transaction().add(...ixs);
  const sig = await sendAndConfirmTransaction(connection, tx, [
    (wallet.payer as unknown) as Keypair,
  ]);
  console.log(`  Confirmed: ${sig}`);
  console.log(`  https://solscan.io/tx/${sig}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
