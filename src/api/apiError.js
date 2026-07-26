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

const normalizeFieldErrors = (errors) => {
  // Field errors are useful only as a key-value map. Ignore legacy strings
  // and arrays here; their first useful message is still handled below.
  if (!errors || Array.isArray(errors) || typeof errors !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors)
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([field, value]) => [field, value.trim()]),
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
  if (!error?.response) return API_ERROR_CODE.NETWORK;
  if (status >= 500) return API_ERROR_CODE.SERVER;

  return STATUS_CODE_MAP[status] || API_ERROR_CODE.UNKNOWN;
};

export const isApiError = (value) =>
  Boolean(
    value &&
      typeof value === "object" &&
      typeof value.message === "string" &&
      typeof value.code === "string" &&
      Object.hasOwn(value, "status"),
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
    (typeof responseData?.error === "string" && responseData.error) ||
    findFirstFieldMessage(fieldErrors) ||
    (!error?.isAxiosError && error?.message) ||
    fallbackMessage;
  const requestId =
    nestedError?.requestId ||
    responseData?.requestId ||
    error?.response?.headers?.["x-request-id"] ||
    null;

  return {
    status,
    code: inferErrorCode(error, status, responseData),
    message,
    fieldErrors,
    requestId,
    // Network, timeout, rate-limit, and server failures may succeed later.
    retryable:
      !status || status === 408 || status === 425 || status === 429 || status >= 500,
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
