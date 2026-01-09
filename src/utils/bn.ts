import { BN } from "@coral-xyz/anchor";

/** Maximum safe integer as BN for overflow checks */
const MAX_SAFE_INTEGER_BN = new BN(Number.MAX_SAFE_INTEGER);

/**
 * Error thrown when a numeric conversion would lose precision
 */
export class BNOverflowError extends Error {
  constructor(value: BN) {
    super(
      `Value ${value.toString()} exceeds Number.MAX_SAFE_INTEGER (${Number.MAX_SAFE_INTEGER}). Use toString() or keep as BN to preserve precision.`
    );
    this.name = "BNOverflowError";
  }
}

/**
 * Error thrown when parsing an invalid amount string
 */
export class InvalidAmountFormatError extends Error {
  constructor(value: string) {
    super(
      `Invalid amount format: "${value}". Expected a valid decimal number (e.g., "100.50" or "100").`
    );
    this.name = "InvalidAmountFormatError";
  }
}

/**
 * Convert a number or BN to BN
 * @throws {Error} If value is negative
 */
export function toBN(value: number | BN): BN {
  if (typeof value === "number") {
    if (value < 0) {
      throw new Error(`Cannot convert negative number to BN: ${value}`);
    }
    return new BN(value);
  }
  return value;
}

/**
 * Convert a BN to number with overflow protection
 * @throws {BNOverflowError} If value exceeds Number.MAX_SAFE_INTEGER
 */
export function toNumber(value: BN): number {
  if (value.gt(MAX_SAFE_INTEGER_BN)) {
    throw new BNOverflowError(value);
  }
  return value.toNumber();
}

/**
 * Safely convert a BN to number, returning null if overflow would occur
 */
export function toNumberSafe(value: BN): number | null {
  if (value.gt(MAX_SAFE_INTEGER_BN)) {
    return null;
  }
  return value.toNumber();
}

/**
 * Convert a BN timestamp to Date
 */
export function bnToDate(timestamp: BN): Date | null {
  const ts = timestamp.toNumber();
  return ts === 0 ? null : new Date(ts * 1000);
}

/**
 * Convert a Date to BN timestamp
 */
export function dateToBn(date: Date): BN {
  return new BN(Math.floor(date.getTime() / 1000));
}

/**
 * Format a BN amount with decimals
 * @param amount - The amount in smallest units
 * @param decimals - Number of decimals (default: 6 for USDC)
 */
export function formatAmount(amount: BN, decimals: number = 6): string {
  const divisor = new BN(10).pow(new BN(decimals));
  const integerPart = amount.div(divisor);
  const fractionalPart = amount.mod(divisor);

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  return `${integerPart.toString()}.${fractionalStr}`;
}

/** Regex pattern for valid decimal amount strings */
const AMOUNT_PATTERN = /^(\d+)(?:\.(\d+))?$/;

/**
 * Parse a decimal string to BN amount with validation
 * @param value - The decimal string (e.g., "100.50")
 * @param decimals - Number of decimals (default: 6 for USDC)
 * @throws {InvalidAmountFormatError} If value is not a valid decimal number
 */
export function parseAmount(value: string, decimals: number = 6): BN {
  // Trim whitespace
  const trimmed = value.trim();

  // Empty string check
  if (trimmed === "") {
    throw new InvalidAmountFormatError(value);
  }

  // Validate format
  const match = trimmed.match(AMOUNT_PATTERN);
  if (!match) {
    throw new InvalidAmountFormatError(value);
  }

  const [, integerPart, fractionalPart = ""] = match;

  // Validate decimals parameter
  if (decimals < 0 || !Number.isInteger(decimals)) {
    throw new Error(`Invalid decimals: ${decimals}. Must be a non-negative integer.`);
  }

  // Pad or truncate fractional part to match decimals
  const paddedFractional = fractionalPart.padEnd(decimals, "0").slice(0, decimals);

  return new BN(integerPart + paddedFractional);
}

/**
 * Safely parse a decimal string to BN amount, returning null on invalid input
 * @param value - The decimal string (e.g., "100.50")
 * @param decimals - Number of decimals (default: 6 for USDC)
 */
export function parseAmountSafe(value: string, decimals: number = 6): BN | null {
  try {
    return parseAmount(value, decimals);
  } catch {
    return null;
  }
}
