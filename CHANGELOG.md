# Changelog

All notable changes to `@rflowdapp/rflow` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-beta.1] - 2026-01-09

### Added

- Initial release of the rFlow SDK
- **RFlowClient** - Main entry point for interacting with the rFlow protocol
  - `RFlowClient.readOnly()` - Create a read-only client without wallet
  - `getConfig()` - Fetch protocol configuration
  - `isPaused()` - Check if protocol is paused
  - `getConfigPda()` - Get protocol config PDA

- **YieldDealClient** - Client for yield deal operations
  - Read operations: `getDeal()`, `getDealByPda()`, `getAllDeals()`, `getAvailableDeals()`, `getDealsBySeller()`, `getDealsByBuyer()`
  - Write operations: `createDeal()`, `buyDeal()`, `cancelDeal()`, `settleDeal()`, `buybackDeal()`
  - PDA helpers: `findDealPda()`, `findVaultPda()`

- **MeteoraLpDealClient** - Client for Meteora LP fee stream deals
  - Read operations: `getDeal()`, `getDealByPda()`, `getAllDeals()`, `getAvailableDeals()`, `getDealsBySeller()`, `getDealsByBuyer()`
  - Write operations: `createDeal()`, `buyDeal()`, `cancelDeal()`, `settleDeal()`, `claimFees()`
  - PDA helpers: `findDealPda()`, `findNftVaultPda()`

- **Type definitions**
  - `YieldDeal` - Yield deal entity
  - `MeteoraLpDeal` - Meteora LP deal entity
  - `ProtocolConfig` - Protocol configuration
  - `CreateYieldDealInput`, `CreateMeteoraLpDealInput` - Input types for deal creation
  - `DealFilters` - Filtering options for deal queries
  - `DealStatus` enum - Deal lifecycle states
  - `SourceProtocol` enum - Supported DeFi protocols (Kamino, MarginFi, Solend, Marinade, Jito, etc.)

- **Error handling**
  - `RFlowError` - Base error class
  - `FetchError`, `DealNotFoundError`, `InvalidInputError`, `ProtocolPausedError`, `InvalidDurationError`, `DealNotAvailableError`, `UnauthorizedError`
  - `parseAnchorError()` - Parse Anchor errors to SDK errors
  - `isAccountNotFoundError()` - Check if error is account not found
  - `ERROR_CODES` - All protocol error codes

- **Utilities**
  - `toBN()`, `toNumber()`, `toNumberSafe()` - BigNumber conversions
  - `bnToDate()`, `dateToBn()` - Timestamp conversions
  - `formatAmount()`, `parseAmount()`, `parseAmountSafe()` - Amount formatting with decimals
  - PDA helpers: `findProtocolConfigPDA()`, `findYieldDealPDA()`, `findVaultPDA()`, `findMeteoraLpDealPDA()`, `findMeteoraVaultPDA()`

- **Constants**
  - `PROGRAM_ID` - rFlow program ID
  - `KNOWN_MINTS` - Common token mints (USDC, mSOL, jitoSOL, bSOL, etc.)
  - `VALID_DURATIONS` - Allowed deal durations (30, 60, 90, 180, 365 days)

### Technical

- Dual module output (ESM + CommonJS)
- Full TypeScript support with strict mode
- Input validation on all write operations
- Business logic validation (e.g., selling price <= expected yield)

[Unreleased]: https://github.com/rFlowdapp/rflow-sdk/compare/v0.1.0-beta.1...HEAD
[0.1.0-beta.1]: https://github.com/rFlowdapp/rflow-sdk/releases/tag/v0.1.0-beta.1
