export class MetaApiBaseError extends Error {
  public readonly code: number;
  public readonly subcode?: number;
  public readonly type?: string;
  public readonly fbtraceId?: string;

  constructor(message: string, code: number, subcode?: number, type?: string, fbtraceId?: string) {
    super(message);
    this.name = 'MetaApiBaseError';
    this.code = code;
    this.subcode = subcode;
    this.type = type;
    this.fbtraceId = fbtraceId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class MetaAuthenticationError extends MetaApiBaseError {
  constructor(message: string, code = 190, subcode?: number, type = 'OAuthException', fbtraceId?: string) {
    super(message, code, subcode, type, fbtraceId);
    this.name = 'MetaAuthenticationError';
  }
}

export class MetaPermissionError extends MetaApiBaseError {
  constructor(message: string, code = 200, subcode?: number, type = 'OAuthException', fbtraceId?: string) {
    super(message, code, subcode, type, fbtraceId);
    this.name = 'MetaPermissionError';
  }
}

export class MetaRateLimitError extends MetaApiBaseError {
  constructor(message: string, code = 4, subcode?: number, type = 'OAuthException', fbtraceId?: string) {
    super(message, code, subcode, type, fbtraceId);
    this.name = 'MetaRateLimitError';
  }
}

export class MetaTemporaryError extends MetaApiBaseError {
  constructor(message: string, code = 1, subcode?: number, type = 'OAuthException', fbtraceId?: string) {
    super(message, code, subcode, type, fbtraceId);
    this.name = 'MetaTemporaryError';
  }
}

export class MetaInvalidRequestError extends MetaApiBaseError {
  constructor(message: string, code = 100, subcode?: number, type = 'OAuthException', fbtraceId?: string) {
    super(message, code, subcode, type, fbtraceId);
    this.name = 'MetaInvalidRequestError';
  }
}

export class MetaUnknownError extends MetaApiBaseError {
  constructor(message: string, code = -1, subcode?: number, type = 'Unknown', fbtraceId?: string) {
    super(message, code, subcode, type, fbtraceId);
    this.name = 'MetaUnknownError';
  }
}

export function parseMetaError(errorPayload: any): MetaApiBaseError {
  const err = errorPayload?.error || errorPayload;
  const message = err?.message || 'An error occurred while communicating with Meta API';
  const code = typeof err?.code === 'number' ? err.code : -1;
  const subcode = typeof err?.error_subcode === 'number' ? err.error_subcode : undefined;
  const type = err?.type || 'OAuthException';
  const fbtraceId = err?.fbtrace_id;

  if (code === 190 || subcode === 458 || subcode === 460 || subcode === 463 || subcode === 467) {
    return new MetaAuthenticationError(message, code, subcode, type, fbtraceId);
  }

  if ((code >= 200 && code <= 299) || code === 10 || code === 190) {
    if (code === 200 || code === 283) {
      return new MetaPermissionError(message, code, subcode, type, fbtraceId);
    }
  }

  if (code === 4 || code === 17 || code === 32 || code === 613 || subcode === 2207001) {
    return new MetaRateLimitError(message, code, subcode, type, fbtraceId);
  }

  if (code === 1 || code === 2 || code === 341) {
    return new MetaTemporaryError(message, code, subcode, type, fbtraceId);
  }

  if (code === 100) {
    return new MetaInvalidRequestError(message, code, subcode, type, fbtraceId);
  }

  return new MetaUnknownError(message, code, subcode, type, fbtraceId);
}
