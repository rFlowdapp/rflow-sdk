import { describe, it, expect } from "vitest";
import { BN } from "@coral-xyz/anchor";
import {
  toBN,
  toNumber,
  toNumberSafe,
  bnToDate,
  dateToBn,
  formatAmount,
  parseAmount,
  parseAmountSafe,
  BNOverflowError,
  InvalidAmountFormatError,
} from "./bn";

describe("toBN", () => {
  it("should convert number to BN", () => {
    const result = toBN(100);
    expect(result.toString()).toBe("100");
  });

  it("should return BN unchanged", () => {
    const bn = new BN(100);
    const result = toBN(bn);
    expect(result).toBe(bn);
  });

  it("should handle zero", () => {
    const result = toBN(0);
    expect(result.toString()).toBe("0");
  });

  it("should throw for negative numbers", () => {
    expect(() => toBN(-100)).toThrow("Cannot convert negative number to BN");
  });

  it("should handle large numbers", () => {
    const result = toBN(1_000_000_000);
    expect(result.toString()).toBe("1000000000");
  });
});

describe("toNumber", () => {
  it("should convert BN to number", () => {
    const bn = new BN(100);
    expect(toNumber(bn)).toBe(100);
  });

  it("should handle zero", () => {
    const bn = new BN(0);
    expect(toNumber(bn)).toBe(0);
  });

  it("should throw BNOverflowError for values exceeding MAX_SAFE_INTEGER", () => {
    const bn = new BN(Number.MAX_SAFE_INTEGER).add(new BN(1));
    expect(() => toNumber(bn)).toThrow(BNOverflowError);
  });

  it("should work at MAX_SAFE_INTEGER boundary", () => {
    const bn = new BN(Number.MAX_SAFE_INTEGER);
    expect(toNumber(bn)).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("toNumberSafe", () => {
  it("should convert BN to number", () => {
    const bn = new BN(100);
    expect(toNumberSafe(bn)).toBe(100);
  });

  it("should return null for values exceeding MAX_SAFE_INTEGER", () => {
    const bn = new BN(Number.MAX_SAFE_INTEGER).add(new BN(1));
    expect(toNumberSafe(bn)).toBeNull();
  });

  it("should work at MAX_SAFE_INTEGER boundary", () => {
    const bn = new BN(Number.MAX_SAFE_INTEGER);
    expect(toNumberSafe(bn)).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("bnToDate", () => {
  it("should convert BN timestamp to Date", () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const bn = new BN(timestamp);
    const date = bnToDate(bn);
    expect(date).toBeInstanceOf(Date);
    expect(date!.getTime()).toBe(timestamp * 1000);
  });

  it("should return null for zero timestamp", () => {
    const bn = new BN(0);
    expect(bnToDate(bn)).toBeNull();
  });

  it("should handle specific timestamp", () => {
    // 2024-01-01 00:00:00 UTC
    const bn = new BN(1704067200);
    const date = bnToDate(bn);
    expect(date!.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });
});

describe("dateToBn", () => {
  it("should convert Date to BN timestamp", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");
    const bn = dateToBn(date);
    expect(bn.toString()).toBe("1704067200");
  });

  it("should handle current date", () => {
    const now = new Date();
    const bn = dateToBn(now);
    const expectedTimestamp = Math.floor(now.getTime() / 1000);
    expect(bn.toNumber()).toBe(expectedTimestamp);
  });
});

describe("formatAmount", () => {
  it("should format amount with default 6 decimals", () => {
    const amount = new BN(1_500_000); // 1.5 USDC
    expect(formatAmount(amount)).toBe("1.500000");
  });

  it("should format amount with custom decimals", () => {
    const amount = new BN(1_500_000_000); // 1.5 SOL (9 decimals)
    expect(formatAmount(amount, 9)).toBe("1.500000000");
  });

  it("should handle zero", () => {
    expect(formatAmount(new BN(0))).toBe("0.000000");
  });

  it("should handle small amounts", () => {
    expect(formatAmount(new BN(1))).toBe("0.000001");
  });

  it("should handle large amounts", () => {
    const amount = new BN("1000000000000"); // 1,000,000 USDC
    expect(formatAmount(amount)).toBe("1000000.000000");
  });

  it("should handle fractional amounts correctly", () => {
    const amount = new BN(123456); // 0.123456 USDC
    expect(formatAmount(amount)).toBe("0.123456");
  });
});

describe("parseAmount", () => {
  it("should parse integer string", () => {
    const result = parseAmount("100");
    expect(result.toString()).toBe("100000000");
  });

  it("should parse decimal string", () => {
    const result = parseAmount("100.50");
    expect(result.toString()).toBe("100500000");
  });

  it("should parse with fewer decimals than specified", () => {
    const result = parseAmount("1.5");
    expect(result.toString()).toBe("1500000");
  });

  it("should truncate extra decimals", () => {
    const result = parseAmount("1.123456789");
    expect(result.toString()).toBe("1123456");
  });

  it("should handle custom decimals", () => {
    const result = parseAmount("1.5", 9);
    expect(result.toString()).toBe("1500000000");
  });

  it("should handle zero", () => {
    const result = parseAmount("0");
    expect(result.toString()).toBe("0");
  });

  it("should handle zero with decimals", () => {
    const result = parseAmount("0.000001");
    expect(result.toString()).toBe("1");
  });

  it("should trim whitespace", () => {
    const result = parseAmount("  100  ");
    expect(result.toString()).toBe("100000000");
  });

  it("should throw InvalidAmountFormatError for empty string", () => {
    expect(() => parseAmount("")).toThrow(InvalidAmountFormatError);
  });

  it("should throw InvalidAmountFormatError for whitespace only", () => {
    expect(() => parseAmount("   ")).toThrow(InvalidAmountFormatError);
  });

  it("should throw InvalidAmountFormatError for letters", () => {
    expect(() => parseAmount("abc")).toThrow(InvalidAmountFormatError);
  });

  it("should throw InvalidAmountFormatError for mixed content", () => {
    expect(() => parseAmount("100abc")).toThrow(InvalidAmountFormatError);
  });

  it("should throw InvalidAmountFormatError for negative numbers", () => {
    expect(() => parseAmount("-100")).toThrow(InvalidAmountFormatError);
  });

  it("should throw InvalidAmountFormatError for multiple dots", () => {
    expect(() => parseAmount("100.50.25")).toThrow(InvalidAmountFormatError);
  });

  it("should throw for negative decimals", () => {
    expect(() => parseAmount("100", -1)).toThrow("Invalid decimals");
  });

  it("should throw for non-integer decimals", () => {
    expect(() => parseAmount("100", 1.5)).toThrow("Invalid decimals");
  });
});

describe("parseAmountSafe", () => {
  it("should parse valid amount", () => {
    const result = parseAmountSafe("100.50");
    expect(result).not.toBeNull();
    expect(result!.toString()).toBe("100500000");
  });

  it("should return null for invalid format", () => {
    expect(parseAmountSafe("abc")).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(parseAmountSafe("")).toBeNull();
  });

  it("should return null for negative numbers", () => {
    expect(parseAmountSafe("-100")).toBeNull();
  });
});
