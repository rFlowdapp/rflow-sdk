/**
 * Base error class for rFlow SDK
 */
export class RFlowError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly logs?: string[]
  ) {
    super(message);
    this.name = "RFlowError";
  }
}

/**
 * Error for RPC/network failures during account fetching
 */
export class FetchError extends RFlowError {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(`Failed to fetch account: ${message}`);
    this.name = "FetchError";
  }
}

/**
 * Check if an error indicates the account was not found (vs network/RPC error)
 */
export function isAccountNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Anchor's account not found error patterns
    return (
      message.includes("account does not exist") ||
      message.includes("could not find") ||
      message.includes("account not found") ||
      message.includes("accountnotfound")
    );
  }
  return false;
}

/**
 * Deal not found error
 */
export class DealNotFoundError extends RFlowError {
  constructor(dealId: number | string) {
    super(`Deal not found: ${dealId}`);
    this.name = "DealNotFoundError";
  }
}

/**
 * Invalid input error
 */
export class InvalidInputError extends RFlowError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

/**
 * Protocol paused error
 */
export class ProtocolPausedError extends RFlowError {
  constructor() {
    super("Protocol is currently paused", 6000);
    this.name = "ProtocolPausedError";
  }
}

/**
 * Invalid duration error
 */
export class InvalidDurationError extends RFlowError {
  constructor(duration: number) {
    super(`Invalid duration: ${duration}. Must be 30, 60, 90, 180, or 365 days`, 6001);
    this.name = "InvalidDurationError";
  }
}

/**
 * Deal not available error
 */
export class DealNotAvailableError extends RFlowError {
  constructor(dealId: number | string) {
    super(`Deal ${dealId} is not available for purchase`, 6004);
    this.name = "DealNotAvailableError";
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends RFlowError {
  constructor(message: string = "Unauthorized action") {
    super(message, 6012);
    this.name = "UnauthorizedError";
  }
}

/**
 * Context that can be passed to parseAnchorError for richer error messages
 */
export interface ErrorContext {
  dealId?: number | string;
  duration?: number;
  operation?: string;
}

/**
 * Extract a number from an error message (for context recovery)
 */
function extractNumberFromMessage(message: string): number | undefined {
  const match = message.match(/\d+/);
  return match ? parseInt(match[0], 10) : undefined;
}

/**
 * Parse Anchor error to rFlow error with optional context
 * @param error - The error to parse
 * @param context - Optional context to enrich error messages
 */
export function parseAnchorError(error: unknown, context?: ErrorContext): RFlowError {
  if (error instanceof RFlowError) {
    return error;
  }

  const errorObj = error as { code?: number; msg?: string; message?: string; logs?: string[] };

  // Extract error code if present
  const code = errorObj.code;
  const message = errorObj.msg || errorObj.message || "Unknown error";
  const logs = errorObj.logs;

  // Map known error codes with context preservation
  switch (code) {
    case 6000:
      return new ProtocolPausedError();
    case 6001: {
      // Try to extract duration from context or message
      const duration = context?.duration ?? extractNumberFromMessage(message) ?? 0;
      return new InvalidDurationError(duration);
    }
    case 6002:
      return new RFlowError(
        `Invalid price${context?.operation ? ` in ${context.operation}` : ""}`,
        code,
        logs
      );
    case 6003:
      return new RFlowError(
        `Invalid amount${context?.operation ? ` in ${context.operation}` : ""}`,
        code,
        logs
      );
    case 6004: {
      const dealId = context?.dealId ?? extractNumberFromMessage(message) ?? "unknown";
      return new DealNotAvailableError(dealId);
    }
    case 6005:
      return new RFlowError(
        `Deal is not active${context?.dealId ? ` (deal ${context.dealId})` : ""}`,
        code,
        logs
      );
    case 6006:
      return new RFlowError(
        `Deal has not ended yet${context?.dealId ? ` (deal ${context.dealId})` : ""}`,
        code,
        logs
      );
    case 6007:
      return new RFlowError(
        `Deal has already ended${context?.dealId ? ` (deal ${context.dealId})` : ""}`,
        code,
        logs
      );
    case 6008:
      return new RFlowError(
        `Deal is already active${context?.dealId ? ` (deal ${context.dealId})` : ""}`,
        code,
        logs
      );
    case 6009:
      return new UnauthorizedError("Only the seller can perform this action");
    case 6010:
      return new UnauthorizedError("Only the buyer can perform this action");
    case 6011:
      return new RFlowError("Insufficient funds", code, logs);
    case 6012:
      return new UnauthorizedError(message);
    case 6013:
      return new RFlowError("Math overflow - amount too large", code, logs);
    case 6014:
      return new RFlowError("Invalid or non-whitelisted mint", code, logs);
    case 6015:
      return new RFlowError("Whitelist is full", code, logs);
    case 6016:
      return new RFlowError("Mint is already whitelisted", code, logs);
    case 6017:
      return new RFlowError("Mint is not in whitelist", code, logs);
    case 6018:
      return new RFlowError("Invalid Meteora position", code, logs);
    case 6019:
      return new RFlowError("Position pool mismatch", code, logs);
    case 6020:
      return new RFlowError("Invalid position NFT", code, logs);
    case 6021:
      return new UnauthorizedError("Only the deal buyer can perform this action");
    default:
      return new RFlowError(message, code, logs);
  }
}

/**
 * rFlow error codes (from on-chain program)
 */
export const ERROR_CODES = {
  PROTOCOL_PAUSED: 6000,
  INVALID_DURATION: 6001,
  INVALID_PRICE: 6002,
  INVALID_AMOUNT: 6003,
  DEAL_NOT_AVAILABLE: 6004,
  DEAL_NOT_ACTIVE: 6005,
  DEAL_NOT_ENDED: 6006,
  DEAL_ENDED: 6007,
  DEAL_ALREADY_ACTIVE: 6008,
  NOT_SELLER: 6009,
  NOT_BUYER: 6010,
  INSUFFICIENT_FUNDS: 6011,
  UNAUTHORIZED: 6012,
  MATH_OVERFLOW: 6013,
  INVALID_MINT: 6014,
  WHITELIST_FULL: 6015,
  MINT_ALREADY_WHITELISTED: 6016,
  MINT_NOT_IN_WHITELIST: 6017,
  INVALID_METEORA_POSITION: 6018,
  POSITION_POOL_MISMATCH: 6019,
  INVALID_POSITION_NFT: 6020,
  NOT_DEAL_BUYER: 6021,
} as const;
