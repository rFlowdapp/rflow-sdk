/**
 * Example: Creating a Yield Deal
 *
 * This example shows how to create a yield deal using the SDK.
 * Note: This requires a funded wallet with receipt tokens.
 */
import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import {
  RFlowClient,
  SourceProtocol,
  KNOWN_MINTS,
} from "../src";

async function main() {
  // Setup connection and wallet
  // In production, load your keypair from a file or environment
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  // WARNING: Never hardcode private keys in production!
  // This is just for demonstration
  const keypair = Keypair.generate();
  const wallet = new Wallet(keypair);

  console.log("Creating yield deal example");
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);

  // Create client with wallet
  const client = new RFlowClient({ connection, wallet });

  // Check if protocol is paused
  const isPaused = await client.isPaused();
  if (isPaused) {
    console.error("Protocol is paused!");
    return;
  }

  // Create deal parameters
  const dealParams = {
    // The receipt token you want to lock (e.g., kUSDC from Kamino)
    receiptTokenMint: KNOWN_MINTS.KUSDC,

    // Amount of receipt tokens to lock (in smallest units)
    // For kUSDC with 6 decimals: 10,000 kUSDC = 10_000_000_000
    receiptTokensAmount: 10_000_000_000,

    // Principal value at lock time (in USDC smallest units)
    principalValueAtLock: 10_000_000_000,

    // Expected yield over the duration (based on current APY)
    // e.g., 1.5% yield on 10,000 USDC for 90 days = 150 USDC
    expectedYield: 150_000_000,

    // Selling price - typically discounted from expected yield
    // Buyer pays this upfront, receives the yield at the end
    sellingPrice: 125_000_000, // 125 USDC (17% discount on yield)

    // Duration in days
    durationDays: 90 as const,

    // Source protocol
    sourceProtocol: SourceProtocol.Kamino,

    // Payment mint (defaults to USDC)
    paymentMint: KNOWN_MINTS.USDC,
  };

  console.log("\nDeal parameters:");
  console.log(`  Receipt Token: ${dealParams.receiptTokenMint.toBase58()}`);
  console.log(`  Amount: ${dealParams.receiptTokensAmount / 1e6} tokens`);
  console.log(`  Expected Yield: ${dealParams.expectedYield / 1e6} USDC`);
  console.log(`  Selling Price: ${dealParams.sellingPrice / 1e6} USDC`);
  console.log(`  Duration: ${dealParams.durationDays} days`);
  console.log(`  Protocol: ${dealParams.sourceProtocol}`);

  try {
    // Build create deal instructions
    console.log("\nBuilding transaction...");
    const instructions = await client.yieldDeals.createDeal(dealParams);

    // Create and send transaction
    const tx = new Transaction().add(...instructions);

    console.log("Sending transaction...");
    const signature = await sendAndConfirmTransaction(
      connection,
      tx,
      [keypair],
      { commitment: "confirmed" }
    );

    console.log(`\nDeal created successfully!`);
    console.log(`Transaction: ${signature}`);

    // Fetch the created deal
    const config = await client.getConfig();
    if (config) {
      const newDealId = config.dealCounter - 1;
      const deal = await client.yieldDeals.getDeal(newDealId);

      if (deal) {
        console.log(`\nCreated deal #${deal.dealId}:`);
        console.log(`  PDA: ${deal.pda.toBase58()}`);
        console.log(`  Status: ${deal.status}`);
        console.log(`  Available: ${deal.isAvailable}`);
      }
    }
  } catch (error) {
    console.error("\nError creating deal:", error);
  }
}

main().catch(console.error);
