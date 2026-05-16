import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  shims: true,
  // ESM consumers of @coral-xyz/anchor (a CJS-only package without an
  // `exports` field) otherwise hit "Named export 'BN' not found" on Node ESM.
  // `cjsInterop: true` makes tsup emit interop helpers so named imports of
  // CJS deps resolve correctly in the ESM build.
  cjsInterop: true,
  external: ["@coral-xyz/anchor", "@solana/web3.js", "@solana/spl-token"],
});
