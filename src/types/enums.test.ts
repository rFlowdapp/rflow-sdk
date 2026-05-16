import { describe, it, expect } from "vitest";
import {
  DealStatus,
  SourceProtocol,
  getProtocolCategory,
  toAnchorSourceProtocol,
  fromAnchorSourceProtocol,
  fromAnchorDealStatus,
  type AnchorSourceProtocol,
  type AnchorDealStatus,
} from "./enums";

describe("DealStatus enum", () => {
  it("should have all expected values", () => {
    expect(DealStatus.Created).toBe("created");
    expect(DealStatus.Active).toBe("active");
    expect(DealStatus.Settled).toBe("settled");
    expect(DealStatus.Cancelled).toBe("cancelled");
    expect(DealStatus.BoughtBack).toBe("bought_back");
  });

  it("should have exactly 5 statuses", () => {
    const values = Object.values(DealStatus);
    expect(values).toHaveLength(5);
  });
});

describe("SourceProtocol enum", () => {
  it("should have all lending protocols", () => {
    expect(SourceProtocol.Kamino).toBe("kamino");
    expect(SourceProtocol.Solend).toBe("solend");
    expect(SourceProtocol.Save).toBe("save");
  });

  it("should have all liquid staking protocols", () => {
    expect(SourceProtocol.Marinade).toBe("marinade");
    expect(SourceProtocol.Jito).toBe("jito");
    expect(SourceProtocol.Blaze).toBe("blaze");
    expect(SourceProtocol.Sanctum).toBe("sanctum");
  });

  it("should have all LP protocols", () => {
    expect(SourceProtocol.RaydiumLp).toBe("raydium_lp");
    expect(SourceProtocol.MeteoraLp).toBe("meteora_lp");
    expect(SourceProtocol.OrcaLp).toBe("orca_lp");
  });

  it("should have fee stream protocol", () => {
    expect(SourceProtocol.FeeStream).toBe("fee_stream");
  });

  it("should have exactly 11 protocols (matches on-chain IDL)", () => {
    const values = Object.values(SourceProtocol);
    expect(values).toHaveLength(11);
  });
});

describe("getProtocolCategory", () => {
  describe("lending protocols", () => {
    it.each([
      [SourceProtocol.Kamino],
      [SourceProtocol.Solend],
      [SourceProtocol.Save],
    ])("should return 'lending' for %s", (protocol) => {
      expect(getProtocolCategory(protocol)).toBe("lending");
    });
  });

  describe("staking protocols", () => {
    it.each([
      [SourceProtocol.Marinade],
      [SourceProtocol.Jito],
      [SourceProtocol.Blaze],
      [SourceProtocol.Sanctum],
    ])("should return 'staking' for %s", (protocol) => {
      expect(getProtocolCategory(protocol)).toBe("staking");
    });
  });

  describe("LP protocols", () => {
    it.each([[SourceProtocol.RaydiumLp], [SourceProtocol.MeteoraLp], [SourceProtocol.OrcaLp]])(
      "should return 'lp' for %s",
      (protocol) => {
        expect(getProtocolCategory(protocol)).toBe("lp");
      }
    );
  });

  describe("fee protocols", () => {
    it("should return 'fee' for FeeStream", () => {
      expect(getProtocolCategory(SourceProtocol.FeeStream)).toBe("fee");
    });
  });

  it("should categorize all protocols", () => {
    // Ensure every protocol has a category
    Object.values(SourceProtocol).forEach((protocol) => {
      const category = getProtocolCategory(protocol);
      expect(["lending", "staking", "lp", "fee"]).toContain(category);
    });
  });
});

describe("toAnchorSourceProtocol", () => {
  it("should convert Kamino to Anchor format", () => {
    const result = toAnchorSourceProtocol(SourceProtocol.Kamino);
    expect(result).toEqual({ kamino: {} });
  });

  it("should convert Sanctum to Anchor format", () => {
    const result = toAnchorSourceProtocol(SourceProtocol.Sanctum);
    expect(result).toEqual({ sanctum: {} });
  });

  it("should convert all protocols correctly", () => {
    const expectedMappings: [SourceProtocol, AnchorSourceProtocol][] = [
      [SourceProtocol.Kamino, { kamino: {} }],
      [SourceProtocol.Solend, { solend: {} }],
      [SourceProtocol.Save, { save: {} }],
      [SourceProtocol.Marinade, { marinade: {} }],
      [SourceProtocol.Jito, { jito: {} }],
      [SourceProtocol.Blaze, { blaze: {} }],
      [SourceProtocol.Sanctum, { sanctum: {} }],
      [SourceProtocol.RaydiumLp, { raydiumLp: {} }],
      [SourceProtocol.MeteoraLp, { meteoraLp: {} }],
      [SourceProtocol.OrcaLp, { orcaLp: {} }],
      [SourceProtocol.FeeStream, { feeStream: {} }],
    ];

    expectedMappings.forEach(([protocol, expected]) => {
      expect(toAnchorSourceProtocol(protocol)).toEqual(expected);
    });
  });
});

describe("fromAnchorSourceProtocol", () => {
  it("should convert Anchor Kamino to SDK format", () => {
    const result = fromAnchorSourceProtocol({ kamino: {} });
    expect(result).toBe(SourceProtocol.Kamino);
  });

  it("should convert Anchor Sanctum to SDK format", () => {
    const result = fromAnchorSourceProtocol({ sanctum: {} });
    expect(result).toBe(SourceProtocol.Sanctum);
  });

  it("should convert all Anchor protocols correctly", () => {
    const mappings: [AnchorSourceProtocol, SourceProtocol][] = [
      [{ kamino: {} }, SourceProtocol.Kamino],
      [{ solend: {} }, SourceProtocol.Solend],
      [{ save: {} }, SourceProtocol.Save],
      [{ marinade: {} }, SourceProtocol.Marinade],
      [{ jito: {} }, SourceProtocol.Jito],
      [{ blaze: {} }, SourceProtocol.Blaze],
      [{ sanctum: {} }, SourceProtocol.Sanctum],
      [{ raydiumLp: {} }, SourceProtocol.RaydiumLp],
      [{ meteoraLp: {} }, SourceProtocol.MeteoraLp],
      [{ orcaLp: {} }, SourceProtocol.OrcaLp],
      [{ feeStream: {} }, SourceProtocol.FeeStream],
    ];

    mappings.forEach(([anchor, expected]) => {
      expect(fromAnchorSourceProtocol(anchor)).toBe(expected);
    });
  });

  it("should be reversible with toAnchorSourceProtocol", () => {
    Object.values(SourceProtocol).forEach((protocol) => {
      const anchor = toAnchorSourceProtocol(protocol);
      const result = fromAnchorSourceProtocol(anchor);
      expect(result).toBe(protocol);
    });
  });

  it("should throw for unknown protocol", () => {
    // @ts-expect-error - Testing invalid input
    expect(() => fromAnchorSourceProtocol({ unknown: {} })).toThrow("Unknown source protocol");
  });
});

describe("fromAnchorDealStatus", () => {
  it("should convert Anchor Created to SDK format", () => {
    const result = fromAnchorDealStatus({ created: {} });
    expect(result).toBe(DealStatus.Created);
  });

  it("should convert Anchor Active to SDK format", () => {
    const result = fromAnchorDealStatus({ active: {} });
    expect(result).toBe(DealStatus.Active);
  });

  it("should convert all Anchor statuses correctly", () => {
    const mappings: [AnchorDealStatus, DealStatus][] = [
      [{ created: {} }, DealStatus.Created],
      [{ active: {} }, DealStatus.Active],
      [{ settled: {} }, DealStatus.Settled],
      [{ cancelled: {} }, DealStatus.Cancelled],
      [{ boughtBack: {} }, DealStatus.BoughtBack],
    ];

    mappings.forEach(([anchor, expected]) => {
      expect(fromAnchorDealStatus(anchor)).toBe(expected);
    });
  });

  it("should throw for unknown status", () => {
    // @ts-expect-error - Testing invalid input
    expect(() => fromAnchorDealStatus({ unknown: {} })).toThrow("Unknown deal status");
  });
});
