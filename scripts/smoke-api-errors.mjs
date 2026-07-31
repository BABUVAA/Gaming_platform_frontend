import assert from "node:assert/strict";
import {
  getApiErrorToast,
  normalizeApiError,
} from "../src/api/apiError.js";
import toastSlice, {
  showToast,
} from "../src/store/slices/toastSlice.js";

const createAxiosError = (status, data) => ({
  // Real Axios errors carry these top-level properties. Their presence must
  // not make the raw transport error look like our normalized API contract.
  code: "ERR_BAD_REQUEST",
  isAxiosError: true,
  message: `Request failed with status code ${status}`,
  response: {
    data,
    headers: {},
    status,
  },
  status,
});

const validationError = normalizeApiError(
  createAxiosError(422, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      fields: {
        email: ["Invalid email address."],
        password: { message: "Password is required." },
      },
      message: "Review the highlighted fields.",
    },
  }),
);
assert.equal(validationError.code, "VALIDATION_ERROR");
assert.deepEqual(validationError.fieldErrors, {
  email: "Invalid email address.",
  password: "Password is required.",
});
assert.equal(getApiErrorToast(validationError).type, "warning");

const plainTextError = normalizeApiError(
  createAxiosError(502, "Gateway temporarily unavailable."),
);
assert.equal(plainTextError.message, "Gateway temporarily unavailable.");
assert.equal(plainTextError.retryable, true);

const rateLimitError = normalizeApiError(
  createAxiosError(429, {
    error: {
      code: "CUSTOM_RATE_LIMIT",
      message: "Please wait before trying again.",
    },
  }),
);
assert.equal(rateLimitError.retryable, true);
assert.equal(getApiErrorToast(rateLimitError).title, "Try again later");

const verificationError = normalizeApiError(
  createAxiosError(403, {
    success: false,
    error: {
      code: "EMAIL_VERIFICATION_REQUIRED",
      fields: {},
      message: "Email verification is required for this operation.",
    },
  }),
);
const verificationToast = getApiErrorToast(verificationError);
assert.equal(verificationError.code, "EMAIL_VERIFICATION_REQUIRED");
assert.equal(
  verificationToast.message,
  "Email verification is required for this operation.",
);
assert.equal(verificationToast.title, "Verification required");
assert.equal(verificationToast.type, "warning");

const toastState = toastSlice.reducer(
  undefined,
  showToast({
    message: { message: "Nested toast message." },
    type: "danger",
  }),
);
assert.equal(toastState.toasts[0].message, "Nested toast message.");

console.log("API error and toast smoke check passed.");
