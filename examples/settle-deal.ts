/**
 * Example: Settle an expired yield deal (the scenario that bit production).
 *
 * `settleDeal` is permissionless — anyone can call it once `endsAt` is in the
 * past. The SDK:
 *   1. Reads `principalValueAtLock + expectedYield` off the on-chain deal
 *      account (raw u64 BNs) and passes that as `currentTokenValue`. This
 *      always falls inside the program's `exchange_rate_at_lock ± 10%`
 *      tolerance band. Passing UI-units (e.g. 632.81) returns Custom 6027.
 *   2. Adds idempotent `createAssociatedTokenAccount` instructions for the
 *      buyer's and seller's receipt-token ATAs when missing. Missing buyer
 *      ATA was the prod bug fixed in v0.2.0.
 *   3. Auto-fetches the Pyth price update for LST receipt tokens when
 *      `config.use_oracle` is true on-chain.
 *
 * Usage:
 *   npx tsx examples/settle-deal.ts <DEAL_ID>
 *   RFLOW_DEAL_ID=42 npx tsx examples/settle-deal.ts
 *
 * Environment variables:
 *   RFLOW_RPC_URL              — RPC URL (default: public mainnet)
 *   RFLOW_WALLET_PATH          — keypair JSON (default: ~/.config/solana/id.json)
 *   RFLOW_DEAL_ID              — deal ID to settle (CLI arg takes priority)
 *   RFLOW_LIVE                 — "1" to send, otherwise dry-run
 *   RFLOW_CURRENT_TOKEN_VALUE  — optional raw u64 override (decimal string)
 *
 * Anyone can settle, so this works for buyer, seller, or third-party cranker.
 */
import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import { BN } from "../src";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

import { RFlowClient, DealStatus } from "../src";

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

async function main(): Promise<void> {
  const rpc = process.env.RFLOW_RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpc, "confirmed");
  const wallet = loadWallet();
  const live = process.env.RFLOW_LIVE === "1";

  const dealIdArg = process.argv[2] ?? process.env.RFLOW_DEAL_ID;
  if (!dealIdArg) {
    console.error("Usage: npx tsx examples/settle-deal.ts <DEAL_ID>");
    process.exit(1);
  }
  const dealId = Number(dealIdArg);
  if (!Number.isInteger(dealId) || dealId < 0) {
    console.error(`Invalid deal id: ${dealIdArg}`);
    process.exit(1);
  }

  console.log("rFlow — Settle Deal example");
  console.log(`  RPC:     ${rpc}`);
  console.log(`  Wallet:  ${wallet.publicKey.toBase58()}`);
  console.log(`  Deal ID: ${dealId}`);
  console.log(`  Mode:    ${live ? "LIVE (will send transaction)" : "dry-run"}`);

  const client = new RFlowClient({ connection, wallet });
  const deal = await client.yieldDeals.getDeal(dealId);
  if (!deal) {
    console.error(`Deal ${dealId} not found on-chain.`);
    process.exit(1);
  }

  console.log("\nOn-chain deal state:");
  console.log(`  PDA:                 ${deal.pda.toBase58()}`);
  console.log(`  Seller:              ${deal.seller.toBase58()}`);
  console.log(`  Buyer:               ${deal.buyer ? deal.buyer.toBase58() : "<not yet>"}`);
  console.log(`  Receipt token mint:  ${deal.receiptTokenMint.toBase58()}`);
  console.log(`  Status:              ${deal.status}`);
  console.log(`  endsAt:              ${deal.endsAt?.toISOString() ?? "<not started>"}`);
  console.log(`  receiptTokensAmount: ${deal.receiptTokensAmount.toString()} (raw)`);
  console.log(`  principalValueAtLock:${deal.principalValueAtLock.toString()} (raw u64)`);
  console.log(`  expectedYield:       ${deal.expectedYield.toString()} (raw u64)`);

  if (deal.status !== DealStatus.Active) {
    console.error(`\nDeal is not active (status=${deal.status}). Cannot settle.`);
    process.exit(1);
  }
  if (!deal.isExpired) {
    console.error(`\nDeal is not expired yet (endsAt=${deal.endsAt?.toISOString()}).`);
    process.exit(1);
  }

  // Default settlement value = principal + expected yield (raw u64), which
  // the SDK applies automatically when no override is passed.
  const defaultCurrentTokenValue = deal.principalValueAtLock.add(deal.expectedYield);
  console.log(`\nDefault currentTokenValue: ${defaultCurrentTokenValue.toString()}`);

  const overrideRaw = process.env.RFLOW_CURRENT_TOKEN_VALUE;
  const overrides = overrideRaw
    ? { currentTokenValue: new BN(overrideRaw) }
    : undefined;
  if (overrides) {
    console.log(`Override currentTokenValue: ${overrides.currentTokenValue!.toString()}`);
  }

  console.log("\nBuilding transaction (auto-fetching Pyth price update if needed)...");
  const ixs = await client.yieldDeals.settleDeal(dealId, overrides);
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

  const after = await client.yieldDeals.getDeal(dealId);
  // After settle, the deal PDA is closed (rent returned to seller) so the
  // fetch returns null. That's expected and indicates success.
  console.log(`\nPost-settle deal state: ${after === null ? "closed (settled)" : after.status}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
