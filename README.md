# rflow

TypeScript SDK for the **rFlow Solana Protocol** - Yield Discounting on Solana.

rFlow allows users to sell their future yield from DeFi protocols (lending, liquid staking, LP fees) for immediate USDC.

## Installation

```bash
npm install @rflowdapp/rflow @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

## Quick Start

```typescript
import { RFlowClient, SourceProtocol } from "@rflowdapp/rflow";
import { Connection, Keypair } from "@solana/web3.js";

// Create a read-only client
const connection = new Connection("https://api.mainnet-beta.solana.com");
const client = RFlowClient.readOnly(connection);

// Get available deals
const deals = await client.yieldDeals.getAvailableDeals();
console.log(`Found ${deals.length} available deals`);

// Or with wallet for write operations
import { Wallet } from "@coral-xyz/anchor";

const wallet = new Wallet(Keypair.generate());
const clientWithWallet = new RFlowClient({ connection, wallet });
```

## Features

### Yield Deals

Yield deals allow sellers to lock receipt tokens (kUSDC, mSOL, jitoSOL, etc.) and sell their future yield.

```typescript
// Get all available yield deals
const availableDeals = await client.yieldDeals.getAvailableDeals();

// Get deals by seller
const myDeals = await client.yieldDeals.getDealsBySeller(myWallet.publicKey);

// Get deals by buyer
const boughtDeals = await client.yieldDeals.getDealsByBuyer(myWallet.publicKey);

// Get a specific deal
const deal = await client.yieldDeals.getDeal(dealId);
```

### Meteora LP Deals

Meteora LP deals allow LP providers to sell their future fee earnings from Meteora DAMM v2 positions.

```typescript
// Get all available Meteora LP deals
const meteoraDeals = await client.meteoraDeals.getAvailableDeals();

// Get deals by pool
const poolDeals = meteoraDeals.filter(d => d.pool.equals(poolAddress));
```

## Creating Deals

### Create a Yield Deal

```typescript
import { SourceProtocol, KNOWN_MINTS } from "@rflowdapp/rflow";

const instructions = await client.yieldDeals.createDeal({
  receiptTokenMint: KNOWN_MINTS.KUSDC,
  receiptTokensAmount: 10_000_000_000, // 10,000 kUSDC (6 decimals)
  principalValueAtLock: 10_000_000_000,
  expectedYield: 150_000_000, // 150 USDC expected yield
  sellingPrice: 125_000_000, // Selling for 125 USDC (discount)
  durationDays: 90,
  sourceProtocol: SourceProtocol.Kamino,
});

// Sign and send transaction
const tx = new Transaction().add(...instructions);
await sendAndConfirmTransaction(connection, tx, [wallet.payer]);
```

### Buy a Deal

```typescript
const instructions = await client.yieldDeals.buyDeal(
  dealId,
  sellerPaymentAccount, // Seller's USDC ATA
  treasuryAccount // Protocol treasury ATA
);
```

### Cancel a Deal

```typescript
// Only the seller can cancel before purchase
const instructions = await client.yieldDeals.cancelDeal(dealId);
```

### Settle a Deal

```typescript
// Anyone can settle after the deal ends
const instructions = await client.yieldDeals.settleDeal(
  dealId,
  currentTokenValue // Current value of receipt tokens
);
```

## PDA Helpers

```typescript
import { findYieldDealPDA, findVaultPDA, findProtocolConfigPDA } from "@rflowdapp/rflow";

// Find deal PDA
const [dealPda, bump] = findYieldDealPDA(dealId);

// Find vault PDA
const [vaultPda] = findVaultPDA(dealPda);

// Find config PDA
const [configPda] = findProtocolConfigPDA();
```

## Type Definitions

### YieldDeal

```typescript
interface YieldDeal {
  dealId: number;
  pda: PublicKey;
  seller: PublicKey;
  buyer: PublicKey | null;
  receiptTokenMint: PublicKey;
  receiptTokensAmount: BN;
  principalValueAtLock: BN;
  expectedYield: BN;
  sellingPrice: BN;
  paymentMint: PublicKey;
  durationDays: 30 | 60 | 90 | 180 | 365;
  createdAt: Date;
  purchasedAt: Date | null;
  endsAt: Date | null;
  status: DealStatus;
  sourceProtocol: SourceProtocol;
  isAvailable: boolean;
  isExpired: boolean;
}
```

### Enums

```typescript
enum DealStatus {
  Created = "created",
  Active = "active",
  Settled = "settled",
  Cancelled = "cancelled",
  BoughtBack = "bought_back",
}

enum SourceProtocol {
  Kamino = "kamino",
  MarginFi = "marginfi",
  Solend = "solend",
  Save = "save",
  Marinade = "marinade",
  Jito = "jito",
  Blaze = "blaze",
  Sanctum = "sanctum",
  Lido = "lido",
  RaydiumLp = "raydium_lp",
  MeteoraLp = "meteora_lp",
  OrcaLp = "orca_lp",
  FeeStream = "fee_stream",
}
```

## Error Handling

```typescript
import { RFlowError, ProtocolPausedError, DealNotFoundError } from "@rflowdapp/rflow";

try {
  await client.yieldDeals.createDeal({ ... });
} catch (error) {
  if (error instanceof ProtocolPausedError) {
    console.error("Protocol is paused");
  } else if (error instanceof DealNotFoundError) {
    console.error("Deal not found");
  } else if (error instanceof RFlowError) {
    console.error(`Error ${error.code}: ${error.message}`);
  }
}
```

## Utilities

```typescript
import { formatAmount, parseAmount, toBN } from "@rflowdapp/rflow";

// Format BN amount with decimals
formatAmount(new BN(1_000_000), 6); // "1.000000"

// Parse string to BN
parseAmount("100.50", 6); // BN(100500000)

// Convert number to BN
toBN(1000); // BN(1000)
```

## Constants

```typescript
import { PROGRAM_ID, KNOWN_MINTS, VALID_DURATIONS } from "@rflowdapp/rflow";

// Program ID
console.log(PROGRAM_ID.toBase58());

// Known mints
console.log(KNOWN_MINTS.USDC.toBase58());
console.log(KNOWN_MINTS.MSOL.toBase58());
console.log(KNOWN_MINTS.KUSDC.toBase58());

// Valid durations
console.log(VALID_DURATIONS); // [30, 60, 90, 180, 365]
```

## License

MIT
