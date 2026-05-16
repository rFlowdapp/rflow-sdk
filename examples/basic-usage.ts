/**
 * Example: read-only usage. Lists protocol config + a few deals.
 *
 *   npx tsx examples/basic-usage.ts
 *
 * Environment variables:
 *   RFLOW_RPC_URL — RPC endpoint (default: public mainnet)
 *
 * No wallet, no signing, no transactions — purely informational.
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { RFlowClient, DealStatus, formatAmount } from "../src";

async function main(): Promise<void> {
  const rpc = process.env.RFLOW_RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpc, "confirmed");
  const client = RFlowClient.readOnly(connection);

  console.log("rFlow — Basic read-only example\n");

  // ==================== PROTOCOL CONFIG ====================
  console.log("1. Protocol config");
  const config = await client.getConfig();
  if (!config) {
    console.log("   (protocol not initialized for this program id)");
    return;
  }
  console.log(`   - Fee:           ${config.feeBps / 100}%`);
  console.log(`   - Duration:      ${config.minDurationDays}-${config.maxDurationDays} days`);
  console.log(`   - Paused:        ${config.isPaused}`);
  console.log(`   - Use oracle:    ${config.useOracle}`);
  console.log(`   - Total deals:   ${config.dealCounter}`);
  console.log(`   - Allowed mints: ${config.allowedMints.length}`);
  console.log(`   - Payment mints: ${config.allowedPaymentMints.length}`);

  // ==================== YIELD DEALS ====================
  console.log("\n2. Yield deals");
  const allDeals = await client.yieldDeals.getAllDeals();
  console.log(`   ${allDeals.length} total yield deals`);
  const availableDeals = allDeals.filter((d) => d.status === DealStatus.Created);
  console.log(`   ${availableDeals.length} available for purchase`);

  if (availableDeals.length > 0) {
    const sample = availableDeals[0];
    console.log("\n   Sample deal:");
    console.log(`   - ID:            ${sample.dealId}`);
    console.log(`   - Seller:        ${sample.seller.toBase58().slice(0, 8)}…`);
    console.log(`   - Receipt mint:  ${sample.receiptTokenMint.toBase58().slice(0, 8)}…`);
    console.log(`   - Price:         ${formatAmount(sample.sellingPrice, 6)} USDC`);
    console.log(`   - Expected yield:${formatAmount(sample.expectedYield, 6)} USDC`);
    console.log(`   - Duration:      ${sample.durationDays} days`);
    console.log(`   - Source:        ${sample.sourceProtocol}`);
  }

  // ==================== METEORA LP DEALS ====================
  console.log("\n3. Meteora LP deals");
  const meteoraDeals = await client.meteoraDeals.getAllDeals();
  console.log(`   ${meteoraDeals.length} total Meteora LP deals`);
  console.log(`   ${meteoraDeals.filter((d) => d.status === DealStatus.Created).length} available`);

  // ==================== PDA HELPERS ====================
  console.log("\n4. PDA helpers");
  const [dealPda, bump] = client.yieldDeals.findDealPda(0);
  console.log(`   Deal #0 PDA: ${dealPda.toBase58()} (bump ${bump})`);
  const [vaultPda] = client.yieldDeals.findVaultPda(dealPda);
  console.log(`   Vault PDA:   ${vaultPda.toBase58()}`);

  // Filter deals by wallet
  const _example = new PublicKey("11111111111111111111111111111111");
  void _example;

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
