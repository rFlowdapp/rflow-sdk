/**
 * Example: Create a yield deal (mSOL on Marinade).
 *
 * Usage:
 *   npx tsx examples/create-yield-deal.ts
 *
 * Environment variables:
 *   RFLOW_RPC_URL       — Solana RPC (default: public mainnet RPC, use Helius/Triton for real work)
 *   RFLOW_WALLET_PATH   — Path to a Solana keypair JSON (default: ~/.config/solana/id.json)
 *   RFLOW_RECEIPT_MINT  — Receipt token mint base58 (default: mSOL)
 *   RFLOW_AMOUNT_LAMPORTS — Amount of receipt tokens to lock, in mint's smallest units
 *                            (default: 10_000_000 = 0.01 mSOL, low risk for a smoke test)
 *   RFLOW_LIVE          — "1" to actually send the tx, otherwise dry-run (default: dry-run)
 *
 * What it does:
 *   1. Loads wallet, connects to RPC, instantiates RFlowClient
 *   2. Reads the protocol config to confirm not paused
 *   3. Builds a `createDeal` transaction with sane defaults
 *   4. Logs the deal parameters and (optionally) sends the transaction
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

import { RFlowClient, SourceProtocol, KNOWN_MINTS } from "../src";

function loadWallet(): Wallet {
  const path = process.env.RFLOW_WALLET_PATH ?? resolve(homedir(), ".config/solana/id.json");
  try {
    const secret = Uint8Array.from(JSON.parse(readFileSync(path, "utf8")));
    return new Wallet(Keypair.fromSecretKey(secret));
  } catch (err) {
    console.warn(`[warn] could not load wallet from ${path} (${(err as Error).message}).`);
    console.warn("[warn] generating an ephemeral wallet — dry-run mode only.");
    return new Wallet(Keypair.generate());
  }
}

async function main(): Promise<void> {
  const rpc = process.env.RFLOW_RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpc, "confirmed");
  const wallet = loadWallet();
  const live = process.env.RFLOW_LIVE === "1";

  console.log("rFlow — Create Yield Deal example");
  console.log(`  RPC:    ${rpc}`);
  console.log(`  Wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`  Mode:   ${live ? "LIVE (will send transaction)" : "dry-run"}`);

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
  console.log(`  Config: feeBps=${config.feeBps} dealCounter=${config.dealCounter} useOracle=${config.useOracle}`);

  const receiptTokenMint = process.env.RFLOW_RECEIPT_MINT
    ? new PublicKey(process.env.RFLOW_RECEIPT_MINT)
    : KNOWN_MINTS.MSOL;
  const receiptTokensAmount = Number(process.env.RFLOW_AMOUNT_LAMPORTS ?? "10000000"); // 0.01 mSOL by default

  // Deal economics — keep selling_price ≤ expected_yield (validated client-side).
  // For a 90d 5% APY deal on 0.01 mSOL ≈ 2 USDC principal:
  //   expected_yield ≈ 2 * 0.05 * 90/365 ≈ 0.024 USDC = 24_000 (6 dp)
  //   selling_price ≈ 20_000 (17% discount)
  const dealParams = {
    receiptTokenMint,
    receiptTokensAmount,
    principalValueAtLock: 2_000_000,  // ~$2 in USDC units
    expectedYield: 24_000,            // 0.024 USDC
    sellingPrice: 20_000,             // 0.020 USDC
    durationDays: 90 as const,
    sourceProtocol: SourceProtocol.Marinade,
    paymentMint: KNOWN_MINTS.USDC,
    // 1 mSOL ≈ 200 USDC → exchange_rate = principalValueAtLock / amount, scaled 1e6
    // 2_000_000 / 10_000_000 * 1e6 = 200_000_000 (≈ 200.000000 USDC per token)
    exchangeRateAtLock: 200_000_000,
  };

  console.log("\nDeal parameters:");
  console.log(`  Receipt token: ${dealParams.receiptTokenMint.toBase58()}`);
  console.log(`  Amount:        ${dealParams.receiptTokensAmount.toString()} (mint's smallest units)`);
  console.log(`  Principal:     ${dealParams.principalValueAtLock / 1e6} USDC`);
  console.log(`  Expected yield:${dealParams.expectedYield / 1e6} USDC`);
  console.log(`  Selling price: ${dealParams.sellingPrice / 1e6} USDC`);
  console.log(`  Duration:      ${dealParams.durationDays} days`);
  console.log(`  Source:        ${dealParams.sourceProtocol}`);

  console.log("\nBuilding transaction...");
  const ixs = await client.yieldDeals.createDeal(dealParams);
  console.log(`  -> ${ixs.length} instruction(s)`);

  if (!live) {
    console.log("\nDry-run mode — not sending. Set RFLOW_LIVE=1 to send.");
    return;
  }

  console.log("\nSending transaction...");
  const tx = new Transaction().add(...ixs);
  const sig = await sendAndConfirmTransaction(connection, tx, [
    (wallet.payer as unknown) as Keypair,
  ]);
  console.log(`  Confirmed: ${sig}`);
  console.log(`  https://solscan.io/tx/${sig}`);

  // Fetch the new deal
  const after = await client.getConfig();
  if (after) {
    const newDealId = after.dealCounter - 1;
    const deal = await client.yieldDeals.getDeal(newDealId);
    if (deal) {
      console.log(`\nCreated deal #${deal.dealId} (PDA: ${deal.pda.toBase58()}, status: ${deal.status})`);
    }
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
