/**
 * CJS-interop-safe re-exports from `@coral-xyz/anchor`.
 *
 * `@coral-xyz/anchor` ships as CommonJS without an `exports` map. Node's
 * pure-ESM loader cannot statically bind its named exports, so
 * `import { BN } from "@coral-xyz/anchor"` raises
 * `Named export 'BN' not found`. Even `import * as anchor` only surfaces
 * the exports Node's static analyzer sees — `BN` is bound via
 * `Object.defineProperty` and gets dropped.
 *
 * The pattern that works under Node ESM, Node CJS, Vite, webpack, esbuild,
 * tsx and bun is to import the default export (which bundlers and Node's
 * CJS-ESM interop populate with the full CJS module object) and then read
 * the named members off whichever shape we end up with.
 */
import anchorDefault from "@coral-xyz/anchor";
// In Node CJS land `require("@coral-xyz/anchor")` returns the full module
// directly, so we also try the namespace import. Whichever has `BN` wins.
import * as anchorNs from "@coral-xyz/anchor";
import type {
  BN as BNType,
  Program as ProgramType,
  Wallet as WalletType,
  Idl as IdlType,
} from "@coral-xyz/anchor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pick(...candidates: any[]): any {
  for (const c of candidates) {
    if (c && typeof c === "object" && typeof c.BN === "function") {
      return c;
    }
  }
  // Last-ditch: return whatever the default import gave us. Will surface
  // a clear "BN is not a constructor" error if all options fail.
  return candidates[0];
}

const a = pick(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (anchorDefault as any)?.default,
  anchorDefault,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (anchorNs as any)?.default,
  anchorNs
);

export const BN: typeof BNType = a.BN;
export const AnchorProvider = a.AnchorProvider as typeof import("@coral-xyz/anchor").AnchorProvider;
export const Program = a.Program as typeof import("@coral-xyz/anchor").Program;
export const Wallet = a.Wallet as typeof import("@coral-xyz/anchor").Wallet;

// Type re-exports
export type BN = BNType;
export type Program<I extends IdlType = IdlType> = ProgramType<I>;
export type Wallet = WalletType;
export type Idl = IdlType;
