// These codes let UI and middleware react to an error category without
// comparing user-facing message text or depending on backend wording.
export const API_ERROR_CODE = Object.freeze({
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  RECENT_AUTHENTICATION_REQUIRED: "RECENT_AUTHENTICATION_REQUIRED",
  AUTH_COOKIE_BLOCKED: "AUTH_COOKIE_BLOCKED",
  SERVER: "SERVER_ERROR",
  NETWORK: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  UNKNOWN: "UNKNOWN_ERROR",
});

const STATUS_CODE_MAP = {
  400: API_ERROR_CODE.BAD_REQUEST,
  401: API_ERROR_CODE.UNAUTHENTICATED,
  403: API_ERROR_CODE.FORBIDDEN,
  404: API_ERROR_CODE.NOT_FOUND,
  409: API_ERROR_CODE.CONFLICT,
  422: API_ERROR_CODE.VALIDATION,
  429: API_ERROR_CODE.RATE_LIMITED,
};

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

const getErrorText = (value) => {
  if (typeof value === "string" && value.trim()) {
    const text = value.trim();
    // Reverse proxies and unmatched Express routes may return an HTML page.
    // Markup and oversized transport bodies are diagnostics, not safe toast text.
    if (/<(?:!doctype|html|head|body|pre)\b/i.test(text) || text.length > 500) {
      return null;
    }
    return text;
  }
  if (Array.isArray(value)) {
    return value.map(getErrorText).find(Boolean);
  }
  if (value && typeof value === "object") {
    return getErrorText(value.message || value.msg || value.error);
  }
  return null;
};

const normalizeFieldErrors = (errors) => {
  // Field errors are useful only as a key-value map. Legacy APIs may place a
  // message inside an array or `{ message }`, so normalize those values too.
  if (!errors || Array.isArray(errors) || typeof errors !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors)
      .map(([field, value]) => [field, getErrorText(value)])
      .filter(([, value]) => Boolean(value)),
  );
};

const findFirstFieldMessage = (fieldErrors) =>
  Object.values(fieldErrors).find(Boolean);

const inferErrorCode = (error, status, responseData) => {
  // Prefer a stable backend code when one exists so frontend behavior can be
  // extended without changing this mapping.
  const backendCode =
    responseData?.code ||
    (typeof responseData?.error === "object" && responseData.error?.code);
  if (backendCode) return backendCode;

  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    return API_ERROR_CODE.TIMEOUT;
  }
  // Only Axios transport failures are network errors. Local response
  // validation and programming errors have no response too, but are unknown
  // application errors rather than connectivity failures.
  if (!error?.response) {
    return error?.isAxiosError
      ? API_ERROR_CODE.NETWORK
      : API_ERROR_CODE.UNKNOWN;
  }
  if (status >= 500) return API_ERROR_CODE.SERVER;

  return STATUS_CODE_MAP[status] || API_ERROR_CODE.UNKNOWN;
};

export const isApiError = (value) =>
  Boolean(
    value &&
      typeof value === "object" &&
      // Axios errors also expose message, code, and status. They must continue
      // through normalization so we can read the backend response envelope.
      !value.isAxiosError &&
      typeof value.message === "string" &&
      typeof value.code === "string" &&
      Object.hasOwn(value, "status") &&
      typeof value.retryable === "boolean" &&
      value.fieldErrors &&
      typeof value.fieldErrors === "object" &&
      !Array.isArray(value.fieldErrors),
  );

export const normalizeApiError = (
  error,
  fallbackMessage = DEFAULT_ERROR_MESSAGE,
) => {
  // Reusing an existing normalized value prevents interceptors and thunks from
  // repeatedly rebuilding the same error contract.
  if (isApiError(error)) return error;
  if (isApiError(error?.appError)) {
    const interceptorMessage = error.appError.message;
    const shouldUseFeatureFallback =
      fallbackMessage !== DEFAULT_ERROR_MESSAGE &&
      (interceptorMessage === DEFAULT_ERROR_MESSAGE ||
        interceptorMessage === "Network Error" ||
        interceptorMessage.startsWith("Request failed with status code"));

    return shouldUseFeatureFallback
      ? { ...error.appError, message: fallbackMessage }
      : error.appError;
  }

  const responseData = error?.response?.data;
  const nestedError =
    responseData?.error && typeof responseData.error === "object"
      ? responseData.error
      : null;
  const fieldErrors = normalizeFieldErrors(
    nestedError?.fields || responseData?.fields || responseData?.errors,
  );
  const status = error?.response?.status || null;
  const message =
    nestedError?.message ||
    responseData?.message ||
    getErrorText(responseData?.error) ||
    findFirstFieldMessage(fieldErrors) ||
    getErrorText(responseData?.errors) ||
    getErrorText(responseData) ||
    (!error?.isAxiosError && error?.message) ||
    fallbackMessage;
  const requestId =
    nestedError?.requestId ||
    responseData?.requestId ||
    error?.response?.headers?.["x-request-id"] ||
    null;

  const code = inferErrorCode(error, status, responseData);
  const retryableCodes = new Set([
    API_ERROR_CODE.NETWORK,
    API_ERROR_CODE.TIMEOUT,
    API_ERROR_CODE.RATE_LIMITED,
    API_ERROR_CODE.SERVER,
  ]);

  return {
    status,
    code,
    message,
    fieldErrors,
    requestId,
    // Network, timeout, rate-limit, and server failures may succeed later.
    retryable:
      retryableCodes.has(code) ||
      status === 429 ||
      status >= 500 ||
      status === 408 ||
      status === 425,
  };
};

export const getApiErrorToast = (error) => {
  const normalizedError = isApiError(error)
    ? error
    : normalizeApiError(error);
  const status = normalizedError.status;

  if (normalizedError.code === API_ERROR_CODE.AUTH_COOKIE_BLOCKED) {
    return {
      duration: 10000,
      message: normalizedError.message,
      title: "Cookies blocked",
      type: "warning",
    };
  }

  if (normalizedError.code === API_ERROR_CODE.RATE_LIMITED || status === 429) {
    return {
      duration: 7000,
      message: normalizedError.message,
      title: "Try again later",
      type: "warning",
    };
  }

  if (
    normalizedError.code === API_ERROR_CODE.VALIDATION ||
    status === 409 ||
    status === 422
  ) {
    return {
      message: normalizedError.message,
      title: status === 409 ? "Already exists" : "Check your details",
      type: "warning",
    };
  }

  if (normalizedError.code === "EMAIL_VERIFICATION_REQUIRED") {
    return {
      duration: 7000,
      message: normalizedError.message,
      title: "Verification required",
      type: "warning",
    };
  }

  if (normalizedError.code === API_ERROR_CODE.NETWORK) {
    return {
      duration: 7000,
      message: normalizedError.message,
      title: "Connection issue",
      type: "danger",
    };
  }

  return {
    message: normalizedError.message,
    title: status >= 500 ? "Server issue" : "Request failed",
    type: "danger",
  };
};

export const getApiErrorMessage = (error, fallbackMessage) =>
  normalizeApiError(error, fallbackMessage).message;

export const getStoredErrorMessage = (error) => {
  // Existing UI generally needs only display text, while the slice keeps the
  // full object for diagnostics and status-specific behavior.
  if (!error) return null;
  if (typeof error === "string") return error;
  return error.message || DEFAULT_ERROR_MESSAGE;
};

export const rejectApiError = (thunkAPI, error, fallbackMessage) =>
  // Redux receives plain serializable data instead of an Axios Error instance.
  thunkAPI.rejectWithValue(normalizeApiError(error, fallbackMessage));
