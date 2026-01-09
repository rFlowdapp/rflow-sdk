/**
 * Basic usage example for @payflow/sdk
 */
import { Connection, PublicKey } from "@solana/web3.js";
import {
  RFlowClient,
  DealStatus,
  SourceProtocol,
  formatAmount,
} from "../src";

async function main() {
  // Create connection
  const connection = new Connection(
    "https://api.mainnet-beta.solana.com",
    "confirmed"
  );

  // Create read-only client
  const client = RFlowClient.readOnly(connection);

  console.log("rFlow SDK Example\n");

  // ==================== PROTOCOL CONFIG ====================

  console.log("1. Fetching protocol config...");
  const config = await client.getConfig();

  if (config) {
    console.log(`   - Fee: ${config.feeBps / 100}%`);
    console.log(`   - Duration: ${config.minDurationDays}-${config.maxDurationDays} days`);
    console.log(`   - Paused: ${config.isPaused}`);
    console.log(`   - Total deals: ${config.dealCounter}`);
    console.log(`   - Allowed mints: ${config.allowedMints.length}`);
  } else {
    console.log("   Protocol not initialized");
  }

  // ==================== YIELD DEALS ====================

  console.log("\n2. Fetching yield deals...");
  const allDeals = await client.yieldDeals.getAllDeals();
  console.log(`   Found ${allDeals.length} total yield deals`);

  // Filter available deals
  const availableDeals = allDeals.filter((d) => d.status === DealStatus.Created);
  console.log(`   ${availableDeals.length} available for purchase`);

  // Show some deal details
  if (availableDeals.length > 0) {
    const deal = availableDeals[0];
    console.log("\n   Sample deal:");
    console.log(`   - ID: ${deal.dealId}`);
    console.log(`   - Seller: ${deal.seller.toBase58().slice(0, 8)}...`);
    console.log(`   - Price: ${formatAmount(deal.sellingPrice, 6)} USDC`);
    console.log(`   - Expected Yield: ${formatAmount(deal.expectedYield, 6)} USDC`);
    console.log(`   - Duration: ${deal.durationDays} days`);
    console.log(`   - Protocol: ${deal.sourceProtocol}`);
  }

  // ==================== METEORA LP DEALS ====================

  console.log("\n3. Fetching Meteora LP deals...");
  const meteoraDeals = await client.meteoraDeals.getAllDeals();
  console.log(`   Found ${meteoraDeals.length} total Meteora LP deals`);

  // Filter available
  const availableMeteora = meteoraDeals.filter((d) => d.status === DealStatus.Created);
  console.log(`   ${availableMeteora.length} available for purchase`);

  // ==================== DEALS BY WALLET ====================

  // Example: Find deals for a specific wallet
  const exampleWallet = new PublicKey("11111111111111111111111111111111");

  console.log("\n4. Filtering deals by wallet...");
  const sellerDeals = await client.yieldDeals.getDealsBySeller(exampleWallet);
  console.log(`   Deals as seller: ${sellerDeals.length}`);

  const buyerDeals = await client.yieldDeals.getDealsByBuyer(exampleWallet);
  console.log(`   Deals as buyer: ${buyerDeals.length}`);

  // ==================== PDA HELPERS ====================

  console.log("\n5. Using PDA helpers...");
  const dealId = 0;
  const [dealPda, bump] = client.yieldDeals.findDealPda(dealId);
  console.log(`   Deal #${dealId} PDA: ${dealPda.toBase58()}`);
  console.log(`   Bump: ${bump}`);

  const [vaultPda] = client.yieldDeals.findVaultPda(dealPda);
  console.log(`   Vault PDA: ${vaultPda.toBase58()}`);

  console.log("\nDone!");
}

main().catch(console.error);
