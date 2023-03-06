type ErrorInfo = {
  code: number;
  message: string;
  errors?: unknown[];
  status?: string;
};
export type FirebaseErrorResponse = {
  error: ErrorInfo;
};

export class FirebaseError extends Error {
  code: number;
  message: string;
  status?: string;

  constructor(info: ErrorInfo) {
    super(info.message);
    this.code = info.code;
    this.message = info.message;
    this.status = info.status;
  }

  static fromServerError(rawError: FirebaseErrorResponse): FirebaseError {
    return new FirebaseError({
      code: rawError.error.code,
      errors: rawError.error.errors,
      message: rawError.error.message,
      status: rawError.error.status,
    });
  }

  /** @returns The object representation of the error. */
  public toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
    };
  }

  static fromJSON(json: FirebaseErrorResponse | string): FirebaseError {
    if (typeof json === 'string') {
      return this.fromServerError(JSON.parse(json));
    }
    return this.fromServerError(json);
  }
}
