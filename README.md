# @rflowdapp/rflow

TypeScript SDK for the **rFlow Solana Protocol** — yield discounting + Meteora LP fee deals on Solana mainnet.

[![npm version](https://img.shields.io/npm/v/@rflowdapp/rflow.svg)](https://www.npmjs.com/package/@rflowdapp/rflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

rFlow lets users sell their **future yield** from DeFi protocols (lending, liquid staking, Meteora DAMM v2 LP fees) for **immediate USDC**. Sellers lock receipt tokens / LP NFTs, buyers pay upfront for the right to collect the yield at maturity.

| Network | Program ID |
| ------- | ---------- |
| Mainnet | [`2woLsnG7zvKdyd7geH9GAFgKSt6NLrnLDDMmFBUdDjFU`](https://explorer.solana.com/address/2woLsnG7zvKdyd7geH9GAFgKSt6NLrnLDDMmFBUdDjFU) |

---

## Install

```bash
npm install @rflowdapp/rflow @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

The Pyth oracle helper is optional. Install it only if you trade LST deals (mSOL / jitoSOL / bSOL) on mainnet:

```bash
npm install @pythnetwork/hermes-client @pythnetwork/pyth-solana-receiver
```

## Quick Start

### Create a yield deal in <20 lines (mSOL)

```typescript
import { RFlowClient, SourceProtocol, KNOWN_MINTS } from "@rflowdapp/rflow";
import { Connection, Transaction, sendAndConfirmTransaction, Keypair } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";

const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
const wallet = new Wallet(Keypair.fromSecretKey(/* your secret */));
const client = new RFlowClient({ connection, wallet });

const ixs = await client.yieldDeals.createDeal({
  receiptTokenMint: KNOWN_MINTS.MSOL,         // mSOL (9 decimals)
  receiptTokensAmount: 10_000_000_000,        // 10 mSOL locked
  principalValueAtLock: 2_000_000_000,        // $2000 in USDC units (6 dp)
  expectedYield: 30_000_000,                  // 30 USDC of yield
  sellingPrice: 25_000_000,                   // sell for 25 USDC (17% discount)
  durationDays: 90,
  sourceProtocol: SourceProtocol.Marinade,
  exchangeRateAtLock: 200_000_000,            // 1 mSOL ≈ 200 USDC, scaled 1e6
});

const tx = new Transaction().add(...ixs);
await sendAndConfirmTransaction(connection, tx, [wallet.payer]);
```

### Create a Meteora LP fee deal

```typescript
import { RFlowClient, KNOWN_MINTS } from "@rflowdapp/rflow";
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

const ixs = await client.meteoraDeals.createDeal({
  positionNftMint: new PublicKey("..."),     // Position NFT mint (Token-2022)
  positionAccount: new PublicKey("..."),     // Meteora Position account
  pool: new PublicKey("..."),                // Meteora DAMM v2 pool
  tokenAMint: new PublicKey("So111..."),     // wSOL
  tokenBMint: KNOWN_MINTS.USDC,
  feeAAtLock: 0,                             // snapshot fee_a_pending
  feeBAtLock: 0,                             // snapshot fee_b_pending
  expectedFeeA: 250_000_000,                 // estimated SOL fees over duration
  expectedFeeB: 75_000_000,                  // estimated USDC fees over duration
  expectedFeeValueUsdc: 100_000_000,         // 100 USDC combined estimate
  sellingPrice: 80_000_000,                  // sell for 80 USDC (20% discount)
  durationDays: 60,
});

const tx = new Transaction().add(...ixs);
await sendAndConfirmTransaction(connection, tx, [wallet.payer]);
```

See [`examples/`](./examples) for fully-runnable scripts (`npx tsx examples/<name>.ts`).

---

## Settling deals

After a deal's `endsAt` is in the past, **anyone** can call `settleDeal` (it's permissionless). The SDK does three things for you that the on-chain program won't:

1. **Defaults `currentTokenValue`** to `principalValueAtLock + expectedYield` read straight off the on-chain deal account (both raw u64 BNs). That value always falls inside the program's `exchangeRateAtLock ± 10%` tolerance band — passing a UI-units number (e.g. `632.81` instead of `632_808_370`) returns `InvalidTokenValue` (Custom 6027).
2. **Adds idempotent `createAssociatedTokenAccount` instructions** for the buyer's and seller's receipt-token ATAs when missing. The buyer not having an ATA is what blocked settlement in production before v0.2.0.
3. **Auto-fetches the Pyth price update** for LST receipt tokens when `config.use_oracle` is true on-chain (mSOL, jitoSOL, bSOL). This sends a separate transaction to the Pyth Solana receiver before settle.

```typescript
const ixs = await client.yieldDeals.settleDeal(dealId);
const tx = new Transaction().add(...ixs);
await sendAndConfirmTransaction(connection, tx, [wallet.payer]);
```

For non-LST tokens or devnet, no Pyth update is needed and the SDK skips that step automatically.

### Buyback (seller early-exit)

```typescript
// Seller pays selling_price + yield + dynamic penalty (3% → 1%) to the buyer
const ixs = await client.yieldDeals.buybackDeal(dealId);
```

Same defaults: `currentTokenValue` auto-resolved, Pyth auto-fetched, ATAs auto-created.

### Overriding the defaults

```typescript
import { BN } from "@coral-xyz/anchor";

const ixs = await client.yieldDeals.settleDeal(dealId, {
  currentTokenValue: new BN("640123456"),    // explicit override (raw u64)
  priceUpdate: customPythAccount,            // bypass auto-fetch
  skipPythAutoFetch: true,                   // never fetch from Hermes
});
```

### Settling a Meteora LP deal

Settling a Meteora LP deal auto-claims any pending fees to the buyer's Token A/B accounts and returns the Position NFT to the seller. Because of the embedded CPI, the SDK needs the full Meteora account set:

```typescript
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@rflowdapp/rflow";

const METEORA_CP_AMM_PROGRAM = new PublicKey("cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG");
const METEORA_POOL_AUTHORITY  = new PublicKey("HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC");
// event authority PDA = ["__event_authority"] on METEORA_CP_AMM_PROGRAM

const ixs = await client.meteoraDeals.settleDeal({
  dealId,
  meteoraProgram: METEORA_CP_AMM_PROGRAM,
  poolAuthority: METEORA_POOL_AUTHORITY,
  eventAuthority: eventAuthorityPda,
  poolTokenAVault,
  poolTokenBVault,
  nftTokenProgram: TOKEN_2022_PROGRAM_ID,    // Meteora positions are Token-2022
  tokenAProgram: TOKEN_PROGRAM_ID,
  tokenBProgram: TOKEN_PROGRAM_ID,
});
```

---

## Supported LST mints + Pyth feeds

The on-chain program embeds Pyth feed IDs for these three LSTs at `programs/payflow/src/constants.rs`. The SDK exposes the same constants:

| Symbol  | Mint                                                                    | Pyth Feed ID (hex)                                                   |
| ------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| mSOL    | `mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So`                           | `0xc2289a6a43d2ce91c6f55caec370f4acc38a2ed477f58813334c6d03749ff2a4` |
| jitoSOL | `J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn`                           | `0x67be9f519b95cf24338801051f9a808eff0a578ccb388db73b7f6fe1de019ffb` |
| bSOL    | `bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1`                           | `0x89875379e70f8fbadc17aef315adf3a8d5d160b811435537e03c97e8aac97d9c` |

```typescript
import { isLSTToken, getPythFeedForMint, PYTH_PRICE_FEEDS, KNOWN_MINTS } from "@rflowdapp/rflow";

isLSTToken(KNOWN_MINTS.MSOL);                  // true
getPythFeedForMint(KNOWN_MINTS.JITO_SOL);      // "0x67be9f...."
PYTH_PRICE_FEEDS.bSOL;                          // same hex feed
```

Need the `priceUpdate` PublicKey on demand? Use the helper directly:

```typescript
import { getPythPriceUpdate } from "@rflowdapp/rflow";

const priceUpdate = await getPythPriceUpdate(connection, wallet, KNOWN_MINTS.MSOL);
// or, equivalently:
const priceUpdate2 = await client.fetchPythPriceUpdate(KNOWN_MINTS.MSOL);
```

It posts the latest Pyth price update on-chain (one extra transaction) and returns the `priceUpdate` account address ready to be passed as `priceUpdate` to `createDeal` / `settleDeal` / `buybackDeal`.

---

## Reading deals

```typescript
import { RFlowClient } from "@rflowdapp/rflow";

const client = RFlowClient.readOnly(connection);

await client.yieldDeals.getAvailableDeals();
await client.yieldDeals.getDealsBySeller(wallet.publicKey);
await client.yieldDeals.getDealsByBuyer(wallet.publicKey);
await client.yieldDeals.getDeal(42);

await client.meteoraDeals.getAvailableDeals();
await client.meteoraDeals.getDeal(7);

await client.getConfig();
await client.isPaused();
```

## PDA helpers

```typescript
import {
  findYieldDealPDA,
  findVaultPDA,
  findProtocolConfigPDA,
  findMeteoraLpDealPDA,
  findMeteoraVaultPDA,
} from "@rflowdapp/rflow";

const [dealPda, bump] = findYieldDealPDA(42);
const [vaultPda]      = findVaultPDA(dealPda);
const [configPda]     = findProtocolConfigPDA();
```

## Type definitions

```typescript
interface YieldDeal {
  dealId: number;
  pda: PublicKey;
  seller: PublicKey;
  buyer: PublicKey | null;
  receiptTokenMint: PublicKey;
  receiptTokenVault: PublicKey;
  receiptTokensAmount: BN;
  principalValueAtLock: BN;
  expectedYield: BN;
  sellingPrice: BN;
  paymentMint: PublicKey;
  durationDays: 30 | 60 | 90 | 180 | 365;
  createdAt: Date;
  purchasedAt: Date | null;
  endsAt: Date | null;
  status: DealStatus;          // "created" | "active" | "settled" | "cancelled" | "bought_back"
  sourceProtocol: SourceProtocol;
  isAvailable: boolean;
  isExpired: boolean;
}

enum SourceProtocol {
  Kamino = "kamino",
  Solend = "solend",
  Save = "save",
  Marinade = "marinade",
  Jito = "jito",
  Blaze = "blaze",
  Sanctum = "sanctum",
  RaydiumLp = "raydium_lp",
  MeteoraLp = "meteora_lp",
  OrcaLp = "orca_lp",
  FeeStream = "fee_stream",
}
```

`MeteoraLpDeal` and `ProtocolConfig` are exported from the same entry. See [`src/types/sdk.ts`](./src/types/sdk.ts) for the complete list.

## Error handling

```typescript
import {
  RFlowError,
  ProtocolPausedError,
  DealNotFoundError,
  InvalidDurationError,
  parseAnchorError,
} from "@rflowdapp/rflow";

try {
  await client.yieldDeals.createDeal(input);
} catch (err) {
  const parsed = parseAnchorError(err);
  if (parsed instanceof ProtocolPausedError) console.error("Protocol is paused");
  else if (parsed instanceof DealNotFoundError) console.error("Deal not found");
  else if (parsed instanceof RFlowError) console.error(parsed.code, parsed.message);
  else throw err;
}
```

The most common on-chain error you'll see is `InvalidTokenValue` (Custom 6027) at settle/buyback — caused by passing UI-units (e.g. `632.81`) instead of raw u64 (`632_808_370`). The SDK's default behaviour prevents this; use it.

## Limitations

- **Mainnet-only**. The default `PROGRAM_ID` is the deployed mainnet program. There is currently no devnet deployment of v0.2 contracts. Pass a custom `programId` to `RFlowClient` if you've deployed your own.
- **`config.use_oracle` is set on-chain**. The SDK auto-fetches Pyth updates only when both `config.useOracle === true` AND the receipt mint is in the LST whitelist. If you operate a fork with `use_oracle = false`, the SDK skips Pyth even for LSTs.
- **Meteora positions are Token-2022.** Pass `nftTokenProgram: TOKEN_2022_PROGRAM_ID` when calling `createDeal` / `cancelDeal` / `settleDeal` on Meteora LP deals. The SDK exports `TOKEN_2022_PROGRAM_ID` for convenience.
- **`Pyth` helper requires extra deps.** `getPythPriceUpdate` uses dynamic `import()` for `@pythnetwork/hermes-client` and `@pythnetwork/pyth-solana-receiver`. They're declared as `optionalDependencies` — install them if you trade LSTs on mainnet, skip them otherwise.
- **No bundled wallet adapter.** Bring your own `@coral-xyz/anchor` `Wallet`. For browser apps, use `@solana/wallet-adapter`.

## License

MIT
