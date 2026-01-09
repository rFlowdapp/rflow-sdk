import { describe, it, expect, vi, beforeEach } from "vitest";
import { PublicKey, Keypair } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { transformYieldDeal } from "./yield-deal";
import { transformMeteoraLpDeal } from "./meteora-deal";
import { transformProtocolConfig } from "./config";
import { DealStatus, SourceProtocol } from "../types/enums";
import type {
  YieldDealAccount,
  MeteoraLpDealAccount,
  ProtocolConfigAccount,
} from "../types/accounts";

// Mock data generators
function createMockYieldDealAccount(overrides: Partial<YieldDealAccount> = {}): YieldDealAccount {
  return {
    dealId: new BN(1),
    bump: 255,
    seller: Keypair.generate().publicKey,
    buyer: PublicKey.default, // Not purchased yet
    receiptTokenMint: Keypair.generate().publicKey,
    receiptTokenVault: Keypair.generate().publicKey,
    receiptTokensAmount: new BN(1000000000),
    principalValueAtLock: new BN(1000000000),
    expectedYield: new BN(50000000),
    sellingPrice: new BN(40000000),
    paymentMint: Keypair.generate().publicKey,
    durationDays: 90,
    createdAt: new BN(Math.floor(Date.now() / 1000)),
    purchasedAt: new BN(0),
    endsAt: new BN(0),
    status: { created: {} },
    sourceProtocol: { kamino: {} },
    ...overrides,
  };
}

function createMockMeteoraLpDealAccount(
  overrides: Partial<MeteoraLpDealAccount> = {}
): MeteoraLpDealAccount {
  return {
    dealId: new BN(1),
    bump: 254,
    seller: Keypair.generate().publicKey,
    buyer: PublicKey.default,
    positionNftMint: Keypair.generate().publicKey,
    positionAccount: Keypair.generate().publicKey,
    positionNftVault: Keypair.generate().publicKey,
    pool: Keypair.generate().publicKey,
    tokenAMint: Keypair.generate().publicKey,
    tokenBMint: Keypair.generate().publicKey,
    feeAAtLock: new BN(100000),
    feeBAtLock: new BN(200000),
    expectedFeeA: new BN(500000),
    expectedFeeB: new BN(1000000),
    expectedFeeValueUsdc: new BN(75000000),
    sellingPrice: new BN(60000000),
    paymentMint: Keypair.generate().publicKey,
    durationDays: 60,
    createdAt: new BN(Math.floor(Date.now() / 1000)),
    purchasedAt: new BN(0),
    endsAt: new BN(0),
    status: { created: {} },
    ...overrides,
  };
}

function createMockProtocolConfigAccount(
  overrides: Partial<ProtocolConfigAccount> = {}
): ProtocolConfigAccount {
  return {
    authority: Keypair.generate().publicKey,
    treasury: Keypair.generate().publicKey,
    feeBps: 100, // 1%
    minDurationDays: 30,
    maxDurationDays: 365,
    basePenaltyBps: 500, // 5%
    minPenaltyBps: 100, // 1%
    isPaused: false,
    dealCounter: new BN(42),
    bump: 253,
    allowedMints: [Keypair.generate().publicKey, Keypair.generate().publicKey],
    ...overrides,
  };
}

describe("transformYieldDeal", () => {
  const mockPda = Keypair.generate().publicKey;

  it("should transform account with Created status correctly", () => {
    const account = createMockYieldDealAccount();
    const deal = transformYieldDeal(account, mockPda);

    expect(deal.dealId).toBe(1);
    expect(deal.bump).toBe(255);
    expect(deal.pda.equals(mockPda)).toBe(true);
    expect(deal.seller.equals(account.seller)).toBe(true);
    expect(deal.buyer).toBeNull(); // Default buyer means not purchased
    expect(deal.receiptTokensAmount.eq(account.receiptTokensAmount)).toBe(true);
    expect(deal.status).toBe(DealStatus.Created);
    expect(deal.sourceProtocol).toBe(SourceProtocol.Kamino);
    expect(deal.isAvailable).toBe(true);
    expect(deal.durationDays).toBe(90);
  });

  it("should transform account with Active status correctly", () => {
    const buyer = Keypair.generate().publicKey;
    const purchasedAt = Math.floor(Date.now() / 1000);
    const endsAt = purchasedAt + 90 * 24 * 60 * 60; // 90 days later

    const account = createMockYieldDealAccount({
      buyer,
      status: { active: {} },
      purchasedAt: new BN(purchasedAt),
      endsAt: new BN(endsAt),
    });

    const deal = transformYieldDeal(account, mockPda);

    expect(deal.buyer).not.toBeNull();
    expect(deal.buyer!.equals(buyer)).toBe(true);
    expect(deal.status).toBe(DealStatus.Active);
    expect(deal.isAvailable).toBe(false);
    expect(deal.purchasedAt).not.toBeNull();
    expect(deal.endsAt).not.toBeNull();
  });

  it("should correctly identify expired deals", () => {
    const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const account = createMockYieldDealAccount({
      buyer: Keypair.generate().publicKey,
      status: { active: {} },
      purchasedAt: new BN(pastTime - 86400),
      endsAt: new BN(pastTime),
    });

    const deal = transformYieldDeal(account, mockPda);

    expect(deal.isExpired).toBe(true);
  });

  it("should correctly identify non-expired deals", () => {
    const futureTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
    const account = createMockYieldDealAccount({
      buyer: Keypair.generate().publicKey,
      status: { active: {} },
      purchasedAt: new BN(Math.floor(Date.now() / 1000)),
      endsAt: new BN(futureTime),
    });

    const deal = transformYieldDeal(account, mockPda);

    expect(deal.isExpired).toBe(false);
  });

  it("should handle all DealStatus values", () => {
    const statuses = [
      { anchor: { created: {} }, expected: DealStatus.Created },
      { anchor: { active: {} }, expected: DealStatus.Active },
      { anchor: { settled: {} }, expected: DealStatus.Settled },
      { anchor: { cancelled: {} }, expected: DealStatus.Cancelled },
      { anchor: { boughtBack: {} }, expected: DealStatus.BoughtBack },
    ];

    statuses.forEach(({ anchor, expected }) => {
      const account = createMockYieldDealAccount({ status: anchor as any });
      const deal = transformYieldDeal(account, mockPda);
      expect(deal.status).toBe(expected);
    });
  });

  it("should handle all SourceProtocol values", () => {
    const protocols = [
      { anchor: { kamino: {} }, expected: SourceProtocol.Kamino },
      { anchor: { marginFi: {} }, expected: SourceProtocol.MarginFi },
      { anchor: { solend: {} }, expected: SourceProtocol.Solend },
      { anchor: { marinade: {} }, expected: SourceProtocol.Marinade },
      { anchor: { jito: {} }, expected: SourceProtocol.Jito },
      { anchor: { meteoraLp: {} }, expected: SourceProtocol.MeteoraLp },
    ];

    protocols.forEach(({ anchor, expected }) => {
      const account = createMockYieldDealAccount({ sourceProtocol: anchor as any });
      const deal = transformYieldDeal(account, mockPda);
      expect(deal.sourceProtocol).toBe(expected);
    });
  });

  it("should preserve BN values correctly", () => {
    const account = createMockYieldDealAccount({
      receiptTokensAmount: new BN("9999999999999"),
      expectedYield: new BN("123456789"),
      sellingPrice: new BN("100000000"),
    });

    const deal = transformYieldDeal(account, mockPda);

    expect(deal.receiptTokensAmount.toString()).toBe("9999999999999");
    expect(deal.expectedYield.toString()).toBe("123456789");
    expect(deal.sellingPrice.toString()).toBe("100000000");
  });

  it("should handle null dates correctly for unpurchased deals", () => {
    const account = createMockYieldDealAccount({
      purchasedAt: new BN(0),
      endsAt: new BN(0),
    });

    const deal = transformYieldDeal(account, mockPda);

    expect(deal.purchasedAt).toBeNull();
    expect(deal.endsAt).toBeNull();
    expect(deal.isExpired).toBe(false);
  });
});

describe("transformMeteoraLpDeal", () => {
  const mockPda = Keypair.generate().publicKey;

  it("should transform account correctly", () => {
    const account = createMockMeteoraLpDealAccount();
    const deal = transformMeteoraLpDeal(account, mockPda);

    expect(deal.dealId).toBe(1);
    expect(deal.bump).toBe(254);
    expect(deal.pda.equals(mockPda)).toBe(true);
    expect(deal.seller.equals(account.seller)).toBe(true);
    expect(deal.buyer).toBeNull();
    expect(deal.positionNftMint.equals(account.positionNftMint)).toBe(true);
    expect(deal.pool.equals(account.pool)).toBe(true);
    expect(deal.tokenAMint.equals(account.tokenAMint)).toBe(true);
    expect(deal.tokenBMint.equals(account.tokenBMint)).toBe(true);
    expect(deal.status).toBe(DealStatus.Created);
    expect(deal.isAvailable).toBe(true);
    expect(deal.durationDays).toBe(60);
  });

  it("should transform fee values correctly", () => {
    const account = createMockMeteoraLpDealAccount({
      feeAAtLock: new BN(100000),
      feeBAtLock: new BN(200000),
      expectedFeeA: new BN(500000),
      expectedFeeB: new BN(1000000),
      expectedFeeValueUsdc: new BN(75000000),
    });

    const deal = transformMeteoraLpDeal(account, mockPda);

    expect(deal.feeAAtLock.toString()).toBe("100000");
    expect(deal.feeBAtLock.toString()).toBe("200000");
    expect(deal.expectedFeeA.toString()).toBe("500000");
    expect(deal.expectedFeeB.toString()).toBe("1000000");
    expect(deal.expectedFeeValueUsdc.toString()).toBe("75000000");
  });

  it("should handle purchased deals", () => {
    const buyer = Keypair.generate().publicKey;
    const account = createMockMeteoraLpDealAccount({
      buyer,
      status: { active: {} },
      purchasedAt: new BN(Math.floor(Date.now() / 1000)),
      endsAt: new BN(Math.floor(Date.now() / 1000) + 86400 * 60),
    });

    const deal = transformMeteoraLpDeal(account, mockPda);

    expect(deal.buyer).not.toBeNull();
    expect(deal.buyer!.equals(buyer)).toBe(true);
    expect(deal.status).toBe(DealStatus.Active);
    expect(deal.isAvailable).toBe(false);
  });
});

describe("transformProtocolConfig", () => {
  it("should transform config correctly", () => {
    const account = createMockProtocolConfigAccount();
    const config = transformProtocolConfig(account);

    expect(config.authority.equals(account.authority)).toBe(true);
    expect(config.treasury.equals(account.treasury)).toBe(true);
    expect(config.feeBps).toBe(100);
    expect(config.minDurationDays).toBe(30);
    expect(config.maxDurationDays).toBe(365);
    expect(config.basePenaltyBps).toBe(500);
    expect(config.minPenaltyBps).toBe(100);
    expect(config.isPaused).toBe(false);
    expect(config.dealCounter).toBe(42);
    expect(config.allowedMints).toHaveLength(2);
  });

  it("should handle paused protocol", () => {
    const account = createMockProtocolConfigAccount({ isPaused: true });
    const config = transformProtocolConfig(account);

    expect(config.isPaused).toBe(true);
  });

  it("should handle empty allowed mints", () => {
    const account = createMockProtocolConfigAccount({ allowedMints: [] });
    const config = transformProtocolConfig(account);

    expect(config.allowedMints).toHaveLength(0);
  });

  it("should handle large deal counter", () => {
    const account = createMockProtocolConfigAccount({ dealCounter: new BN(999999) });
    const config = transformProtocolConfig(account);

    expect(config.dealCounter).toBe(999999);
  });
});
