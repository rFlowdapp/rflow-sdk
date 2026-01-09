import { describe, it, expect } from "vitest";
import {
  RFlowError,
  FetchError,
  DealNotFoundError,
  InvalidInputError,
  ProtocolPausedError,
  InvalidDurationError,
  DealNotAvailableError,
  UnauthorizedError,
  parseAnchorError,
  isAccountNotFoundError,
  ERROR_CODES,
} from "./errors";

describe("RFlowError", () => {
  it("should create error with message", () => {
    const error = new RFlowError("Test error");
    expect(error.message).toBe("Test error");
    expect(error.name).toBe("RFlowError");
  });

  it("should create error with code", () => {
    const error = new RFlowError("Test error", 6000);
    expect(error.code).toBe(6000);
  });

  it("should create error with logs", () => {
    const logs = ["log1", "log2"];
    const error = new RFlowError("Test error", 6000, logs);
    expect(error.logs).toEqual(logs);
  });

  it("should be instanceof Error", () => {
    const error = new RFlowError("Test error");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("FetchError", () => {
  it("should create error with message", () => {
    const error = new FetchError("YieldDeal 123");
    expect(error.message).toBe("Failed to fetch account: YieldDeal 123");
    expect(error.name).toBe("FetchError");
  });

  it("should include cause", () => {
    const cause = new Error("Network timeout");
    const error = new FetchError("YieldDeal 123", cause);
    expect(error.cause).toBe(cause);
  });

  it("should be instanceof RFlowError", () => {
    const error = new FetchError("Test");
    expect(error).toBeInstanceOf(RFlowError);
  });
});

describe("DealNotFoundError", () => {
  it("should create error with numeric dealId", () => {
    const error = new DealNotFoundError(123);
    expect(error.message).toBe("Deal not found: 123");
    expect(error.name).toBe("DealNotFoundError");
  });

  it("should create error with string dealId", () => {
    const error = new DealNotFoundError("abc123");
    expect(error.message).toBe("Deal not found: abc123");
  });
});

describe("InvalidInputError", () => {
  it("should create error with message", () => {
    const error = new InvalidInputError("Invalid amount");
    expect(error.message).toBe("Invalid amount");
    expect(error.name).toBe("InvalidInputError");
  });
});

describe("ProtocolPausedError", () => {
  it("should create error with default message", () => {
    const error = new ProtocolPausedError();
    expect(error.message).toBe("Protocol is currently paused");
    expect(error.code).toBe(6000);
    expect(error.name).toBe("ProtocolPausedError");
  });
});

describe("InvalidDurationError", () => {
  it("should create error with duration", () => {
    const error = new InvalidDurationError(45);
    expect(error.message).toBe("Invalid duration: 45. Must be 30, 60, 90, 180, or 365 days");
    expect(error.code).toBe(6001);
    expect(error.name).toBe("InvalidDurationError");
  });
});

describe("DealNotAvailableError", () => {
  it("should create error with dealId", () => {
    const error = new DealNotAvailableError(123);
    expect(error.message).toBe("Deal 123 is not available for purchase");
    expect(error.code).toBe(6004);
    expect(error.name).toBe("DealNotAvailableError");
  });
});

describe("UnauthorizedError", () => {
  it("should create error with default message", () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe("Unauthorized action");
    expect(error.code).toBe(6012);
    expect(error.name).toBe("UnauthorizedError");
  });

  it("should create error with custom message", () => {
    const error = new UnauthorizedError("Custom unauthorized message");
    expect(error.message).toBe("Custom unauthorized message");
  });
});

describe("isAccountNotFoundError", () => {
  it("should return true for 'Account does not exist'", () => {
    const error = new Error("Account does not exist or has no data");
    expect(isAccountNotFoundError(error)).toBe(true);
  });

  it("should return true for 'could not find'", () => {
    const error = new Error("Could not find account");
    expect(isAccountNotFoundError(error)).toBe(true);
  });

  it("should return true for 'account not found'", () => {
    const error = new Error("Account not found");
    expect(isAccountNotFoundError(error)).toBe(true);
  });

  it("should return true for 'AccountNotFound'", () => {
    const error = new Error("AccountNotFound");
    expect(isAccountNotFoundError(error)).toBe(true);
  });

  it("should return false for other errors", () => {
    const error = new Error("Network timeout");
    expect(isAccountNotFoundError(error)).toBe(false);
  });

  it("should return false for non-Error objects", () => {
    expect(isAccountNotFoundError("not an error")).toBe(false);
    expect(isAccountNotFoundError(null)).toBe(false);
    expect(isAccountNotFoundError(undefined)).toBe(false);
  });
});

describe("parseAnchorError", () => {
  it("should return RFlowError unchanged", () => {
    const original = new RFlowError("Test");
    const result = parseAnchorError(original);
    expect(result).toBe(original);
  });

  it("should parse error code 6000 to ProtocolPausedError", () => {
    const error = { code: 6000, msg: "Protocol paused" };
    const result = parseAnchorError(error);
    expect(result).toBeInstanceOf(ProtocolPausedError);
  });

  it("should parse error code 6001 to InvalidDurationError", () => {
    const error = { code: 6001, msg: "Invalid duration 45" };
    const result = parseAnchorError(error);
    expect(result).toBeInstanceOf(InvalidDurationError);
  });

  it("should use context for InvalidDurationError", () => {
    const error = { code: 6001, msg: "Invalid duration" };
    const result = parseAnchorError(error, { duration: 45 });
    expect(result.message).toContain("45");
  });

  it("should parse error code 6004 to DealNotAvailableError", () => {
    const error = { code: 6004, msg: "Deal not available" };
    const result = parseAnchorError(error);
    expect(result).toBeInstanceOf(DealNotAvailableError);
  });

  it("should use context for DealNotAvailableError", () => {
    const error = { code: 6004, msg: "Deal not available" };
    const result = parseAnchorError(error, { dealId: 123 });
    expect(result.message).toContain("123");
  });

  it("should parse error code 6012 to UnauthorizedError", () => {
    const error = { code: 6012, msg: "Not authorized" };
    const result = parseAnchorError(error);
    expect(result).toBeInstanceOf(UnauthorizedError);
  });

  it("should parse error code 6009 (NOT_SELLER)", () => {
    const error = { code: 6009, msg: "Not seller" };
    const result = parseAnchorError(error);
    expect(result).toBeInstanceOf(UnauthorizedError);
    expect(result.message).toContain("seller");
  });

  it("should parse error code 6010 (NOT_BUYER)", () => {
    const error = { code: 6010, msg: "Not buyer" };
    const result = parseAnchorError(error);
    expect(result).toBeInstanceOf(UnauthorizedError);
    expect(result.message).toContain("buyer");
  });

  it("should parse error code 6011 (INSUFFICIENT_FUNDS)", () => {
    const error = { code: 6011, msg: "Insufficient funds" };
    const result = parseAnchorError(error);
    expect(result.message).toBe("Insufficient funds");
  });

  it("should parse error code 6013 (MATH_OVERFLOW)", () => {
    const error = { code: 6013, msg: "Overflow" };
    const result = parseAnchorError(error);
    expect(result.message).toContain("overflow");
  });

  it("should handle unknown error codes", () => {
    const error = { code: 9999, msg: "Unknown error" };
    const result = parseAnchorError(error);
    expect(result.message).toBe("Unknown error");
    expect(result.code).toBe(9999);
  });

  it("should handle errors without code", () => {
    const error = { message: "Some error message" };
    const result = parseAnchorError(error);
    expect(result.message).toBe("Some error message");
  });

  it("should preserve logs", () => {
    const logs = ["Program log: Error"];
    const error = { code: 9999, msg: "Error", logs };
    const result = parseAnchorError(error);
    expect(result.logs).toEqual(logs);
  });

  it("should include operation context in price/amount errors", () => {
    const error = { code: 6002, msg: "Invalid price" };
    const result = parseAnchorError(error, { operation: "createDeal" });
    expect(result.message).toContain("createDeal");
  });

  it("should include deal context in status errors", () => {
    const error = { code: 6005, msg: "Deal not active" };
    const result = parseAnchorError(error, { dealId: 42 });
    expect(result.message).toContain("42");
  });
});

describe("ERROR_CODES", () => {
  it("should have all expected error codes", () => {
    expect(ERROR_CODES.PROTOCOL_PAUSED).toBe(6000);
    expect(ERROR_CODES.INVALID_DURATION).toBe(6001);
    expect(ERROR_CODES.INVALID_PRICE).toBe(6002);
    expect(ERROR_CODES.INVALID_AMOUNT).toBe(6003);
    expect(ERROR_CODES.DEAL_NOT_AVAILABLE).toBe(6004);
    expect(ERROR_CODES.DEAL_NOT_ACTIVE).toBe(6005);
    expect(ERROR_CODES.DEAL_NOT_ENDED).toBe(6006);
    expect(ERROR_CODES.DEAL_ENDED).toBe(6007);
    expect(ERROR_CODES.DEAL_ALREADY_ACTIVE).toBe(6008);
    expect(ERROR_CODES.NOT_SELLER).toBe(6009);
    expect(ERROR_CODES.NOT_BUYER).toBe(6010);
    expect(ERROR_CODES.INSUFFICIENT_FUNDS).toBe(6011);
    expect(ERROR_CODES.UNAUTHORIZED).toBe(6012);
    expect(ERROR_CODES.MATH_OVERFLOW).toBe(6013);
    expect(ERROR_CODES.INVALID_MINT).toBe(6014);
  });
});
