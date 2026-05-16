# Changelog

All notable changes to `@rflowdapp/rflow` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-05-16

First proper public release aligned with the mainnet contract at `2woLsnG7zvKdyd7geH9GAFgKSt6NLrnLDDMmFBUdDjFU`. This drops the beta tag and addresses the production bug where settle/buyback failed because of a missing buyer ATA and UI-units `currentTokenValue` reaching the program.

### Added

- **Sensible defaults for `settleDeal` / `buybackDeal`.** Both now default `currentTokenValue` to `principalValueAtLock + expectedYield` read straight off the on-chain deal account (raw u64 BNs). Callers don't have to compute it. The signature is now `settleDeal(dealId, overrides?)` / `buybackDeal(dealId, overrides?)`; pass `overrides.currentTokenValue` if you need a different value.
- **Idempotent ATA pre-instructions** (`buildAtaPreInstructions`). Settle, buyback, buy, cancel and Meteora flows now prepend `createAssociatedTokenAccount` instructions for any ATAs that don't yet exist on-chain. Mirrors the parent project's `blockchain.service.ts`.
- **Pyth price update helper** (`getPythPriceUpdate`, `client.fetchPythPriceUpdate`). Fetches the latest update from Pyth Hermes, posts it via `@pythnetwork/pyth-solana-receiver`, and returns the `priceUpdate` PublicKey ready to pass to create / settle / buyback. Used internally to auto-resolve LST oracle accounts when `config.use_oracle` is true.
- **LST + Pyth constants** mirroring the on-chain `programs/payflow/src/constants.rs`:
  - `PYTH_HERMES_API`, `PYTH_PRICE_FEEDS`, `LST_MINT_TO_PYTH_FEED`
  - `isLSTToken(mint)`, `getPythFeedForMint(mint)`
  - `TOKEN_2022_PROGRAM_ID`, `ASSOCIATED_TOKEN_PROGRAM_ID`
- **`SettleMeteoraLpDealInput`** matching the new on-chain `settle_meteora_lp_deal` account list (auto-claims fees via CPI before returning the NFT, so requires the full Meteora account set).
- **`SettleOverrides`** type for explicit `currentTokenValue` / `priceUpdate` overrides on yield-deal settle and buyback.
- **`fetchPythPriceUpdate` shortcut** on `RFlowClient`.
- **Examples**: `examples/create-yield-deal.ts`, `examples/create-meteora-lp-deal.ts`, `examples/settle-deal.ts`. Each runs with `npx tsx examples/<name>.ts` and defaults to dry-run mode unless `RFLOW_LIVE=1` is set.

### Changed

- **`SourceProtocol` enum aligned with the on-chain IDL** — removed `MarginFi` and `Lido` (never existed on-chain) and added `Save`, `Blaze`, `Sanctum`, `RaydiumLp`, `OrcaLp`, `FeeStream` to match exactly. There are now 11 variants.
- **`createDeal` for LSTs auto-fetches the Pyth price update** when `config.use_oracle` is true and `priceUpdate` is not supplied. Set `fetchPythPriceUpdate: false` on the input to disable.
- **`MeteoraLpDealClient.settleDeal`** signature changed from `(dealId, nftTokenProgram?)` to `(input: SettleMeteoraLpDealInput)` to surface the full Meteora account list the contract now requires.
- **`MeteoraLpDealClient.claimFees`** now accepts optional `tokenAProgram` / `tokenBProgram` for Token-2022 pools.
- **`WithdrawMeteoraLiquidityInput`** gained an optional `nftTokenProgram` override (defaults to `tokenAProgram`).
- **Drop beta tag** — `0.2.0` is the first release intended for npm consumers.
- **Package metadata** — added `homepage`, `bugs`, `optionalDependencies`, `publishConfig.access: public`, `sideEffects: false`, `engines.node: >=18`. Refined `keywords` and exports map.

### Fixed

- **Production settle failure** when the buyer never opened the receipt-token ATA. The new idempotent ATA pre-instructions make this scenario succeed automatically.
- **`InvalidTokenValue` (Custom 6027) regressions** when callers passed UI-units (e.g. `632.81`) as `currentTokenValue`. The default behaviour now uses raw u64 from the on-chain account so this can't happen unless callers explicitly override.
- **Stale TypeScript IDL** brought in line with the deployed program: `priceUpdate` is now an optional account on `createDeal` / `settleDeal` / `buybackDeal`; `seller` account on settle (returns deal rent); new `settleMeteoraLpDeal` accounts; `WithdrawMeteoraLiquidity` and `SplitMeteoraPosition` parameters.
- **Test suite** updated to reflect the on-chain `SourceProtocol` variants (no MarginFi / Lido) and the additional `allowedPaymentMints` / `useOracle` config fields.
- **ESLint** now ignores generated `src/idl/**` (3000+ generated-formatting errors gone).

### Breaking changes

- `YieldDealClient.settleDeal` and `YieldDealClient.buybackDeal` now take an optional `SettleOverrides` object instead of `(dealId, currentTokenValue, priceUpdate?)`. Old call sites compile but the second argument is no longer a `BN` — wrap it in `{ currentTokenValue: BN }`.
- `MeteoraLpDealClient.settleDeal` now takes `SettleMeteoraLpDealInput` (the contract requires far more accounts than before).
- `SourceProtocol.MarginFi` and `SourceProtocol.Lido` are removed (they did not exist on-chain).

## [0.1.0] - 2026-01-26

### Changed

- **MAINNET DEPLOYMENT** — Updated to mainnet program ID: `2woLsnG7zvKdyd7geH9GAFgKSt6NLrnLDDMmFBUdDjFU`
- Regenerated IDL files for mainnet deployment
- Removed beta designation in metadata (still marked beta by version)
- Updated examples to use mainnet RPC endpoints

### Fixed

- Updated Solana Explorer links to point to mainnet

---

## [0.1.0-beta.1] - 2026-01-09

### Added

- Initial release of the rFlow SDK
- **RFlowClient** — Main entry point for interacting with the rFlow protocol
  - `RFlowClient.readOnly()` — Create a read-only client without wallet
  - `getConfig()` — Fetch protocol configuration
  - `isPaused()` — Check if protocol is paused
  - `getConfigPda()` — Get protocol config PDA
- **YieldDealClient** — Client for yield deal operations
  - Read operations: `getDeal()`, `getDealByPda()`, `getAllDeals()`, `getAvailableDeals()`, `getDealsBySeller()`, `getDealsByBuyer()`
  - Write operations: `createDeal()`, `buyDeal()`, `cancelDeal()`, `settleDeal()`, `buybackDeal()`
  - PDA helpers: `findDealPda()`, `findVaultPda()`
- **MeteoraLpDealClient** — Client for Meteora LP fee stream deals
  - Read operations: `getDeal()`, `getDealByPda()`, `getAllDeals()`, `getAvailableDeals()`, `getDealsBySeller()`, `getDealsByBuyer()`
  - Write operations: `createDeal()`, `buyDeal()`, `cancelDeal()`, `settleDeal()`, `claimFees()`
  - PDA helpers: `findDealPda()`, `findNftVaultPda()`
- Type definitions, error classes, utilities, constants
- Dual module output (ESM + CommonJS)

[0.2.0]: https://github.com/rFlowdapp/rflow-sdk/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/rFlowdapp/rflow-sdk/compare/v0.1.0-beta.1...v0.1.0
[0.1.0-beta.1]: https://github.com/rFlowdapp/rflow-sdk/releases/tag/v0.1.0-beta.1
