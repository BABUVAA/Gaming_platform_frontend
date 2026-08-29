import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios-api.js";
import {
  API_ERROR_CODE,
  getApiErrorToast,
  normalizeApiError,
} from "../../api/apiError.js";
import { showToast, types } from "../slices/toastSlice.js";
import { requestSensitiveActionConfirmation } from "../slices/sensitiveActionSlice.js";

const SUPPORTED_METHODS = new Set(["get", "post", "put", "patch", "delete"]);

export const isStaffSensitiveActionState = (state) =>
  state?.player?.summary?.role === "staff";

const resolveOption = (option, context) =>
  typeof option === "function" ? option(context) : option;

const assertOptionalFunction = (value, optionName) => {
  if (value !== undefined && typeof value !== "function") {
    throw new TypeError(`createApiThunk "${optionName}" must be a function.`);
  }
};

const validateConfiguration = (typePrefix, configuration, thunkOptions) => {
  if (typeof typePrefix !== "string" || !typePrefix.trim()) {
    throw new TypeError("createApiThunk requires a non-empty action type.");
  }

  if (!configuration || typeof configuration !== "object") {
    throw new TypeError(
      `createApiThunk "${typePrefix}" requires a configuration object.`,
    );
  }

  const method = configuration.method?.toLowerCase() || "get";
  if (!SUPPORTED_METHODS.has(method)) {
    throw new TypeError(
      `createApiThunk "${typePrefix}" does not support method "${method}".`,
    );
  }

  if (
    !configuration.request &&
    typeof configuration.path !== "string" &&
    typeof configuration.path !== "function"
  ) {
    throw new TypeError(
      `createApiThunk "${typePrefix}" requires a path or custom request.`,
    );
  }

  if (typeof configuration.path === "string" && !configuration.path.trim()) {
    throw new TypeError(
      `createApiThunk "${typePrefix}" requires a non-empty request path.`,
    );
  }

  assertOptionalFunction(configuration.request, "request");
  assertOptionalFunction(configuration.getParams, "getParams");
  assertOptionalFunction(configuration.getBody, "getBody");
  assertOptionalFunction(configuration.getRequestConfig, "getRequestConfig");
  assertOptionalFunction(configuration.selectData, "selectData");
  assertOptionalFunction(configuration.onSuccess, "onSuccess");
  assertOptionalFunction(configuration.onError, "onError");

  if (
    configuration.errorMessage !== undefined &&
    typeof configuration.errorMessage !== "string" &&
    typeof configuration.errorMessage !== "function"
  ) {
    throw new TypeError(
      `createApiThunk "${typePrefix}" errorMessage must be text or a function.`,
    );
  }

  if (
    configuration.toast !== undefined &&
    (!configuration.toast ||
      typeof configuration.toast !== "object" ||
      Array.isArray(configuration.toast))
  ) {
    throw new TypeError(
      `createApiThunk "${typePrefix}" toast must be an object.`,
    );
  }

  ["success", "error"].forEach((toastName) => {
    const toastSetting = configuration.toast?.[toastName];
    const isValidSetting =
      toastSetting === undefined ||
      typeof toastSetting === "boolean" ||
      typeof toastSetting === "string" ||
      typeof toastSetting === "function";

    if (!isValidSetting) {
      throw new TypeError(
        `createApiThunk "${typePrefix}" toast.${toastName} must be boolean, text, or a function.`,
      );
    }
  });

  if (thunkOptions !== undefined && typeof thunkOptions !== "object") {
    throw new TypeError(
      `createApiThunk "${typePrefix}" options must be an object.`,
    );
  }
};

const dispatchConfiguredToast = async ({
  setting,
  defaultToast,
  context,
  thunkAPI,
  position,
}) => {
  // `false` or an omitted setting keeps background requests quiet.
  if (!setting) return;

  const configuredToast =
    setting === true ? defaultToast : await resolveOption(setting, context);
  if (!configuredToast) return;

  // A resolver may return a message string or a complete toast payload.
  // Normalizing here prevents React from receiving an object as text.
  const toast =
    typeof configuredToast === "string"
      ? { ...defaultToast, message: configuredToast }
      : configuredToast && typeof configuredToast === "object"
        ? { ...defaultToast, ...configuredToast }
        : null;
  if (!toast?.message) return;

  thunkAPI.dispatch(
    showToast({
      ...toast,
      position: toast.position || position,
    }),
  );
};

const runSideEffectSafely = async (sideEffect, label) => {
  try {
    await sideEffect();
  } catch (error) {
    // Transport success/failure is already known at this point. Diagnostics,
    // analytics, or toast failures must never reverse that request outcome.
    console.error(`createApiThunk ${label} side effect failed:`, error);
  }
};

const executeConfiguredRequest = async ({
  arg,
  configuration,
  method,
  path,
  thunkAPI,
}) => {
  const requestContext = {
    api,
    arg,
    path,
    signal: thunkAPI.signal,
    thunkAPI,
  };

  // A custom request is the escape hatch for multipart requests, multiple API
  // calls, or any endpoint that does not fit normal HTTP method conventions.
  if (configuration.request) {
    return configuration.request(requestContext);
  }

  const configuredRequestOptions = configuration.getRequestConfig
    ? await configuration.getRequestConfig(arg, thunkAPI)
    : {};
  if (
    configuredRequestOptions === null ||
    typeof configuredRequestOptions !== "object" ||
    Array.isArray(configuredRequestOptions)
  ) {
    throw new TypeError(
      "createApiThunk request config must resolve to an object.",
    );
  }
  const requestOptions = {
    ...configuredRequestOptions,
    // Redux cancellation always owns the final signal so route changes and
    // explicit thunk aborts stop the underlying Axios request as well.
    signal: thunkAPI.signal,
  };

  if (method === "get") {
    if (configuration.getParams) {
      requestOptions.params = await configuration.getParams(arg, thunkAPI);
    }
    return api.get(path, requestOptions);
  }

  const requestBody = configuration.getBody
    ? await configuration.getBody(arg, thunkAPI)
    : arg;

  if (method === "delete") {
    // Axios sends DELETE bodies through its config object rather than as the
    // second positional argument used by POST, PUT, and PATCH.
    return api.delete(path, {
      ...requestOptions,
      ...(requestBody === undefined ? {} : { data: requestBody }),
    });
  }

  return api[method](path, requestBody, requestOptions);
};

/**
 * Creates a Redux Toolkit async thunk for a standard API operation.
 *
 * The factory owns transport concerns: request execution, cancellation,
 * normalized rejection payloads, and optional notifications. The slice still
 * owns endpoint-specific response validation and business behavior.
 */
export const createApiThunk = (
  typePrefix,
  configuration,
  thunkOptions = {},
) => {
  validateConfiguration(typePrefix, configuration, thunkOptions);

  const method = configuration.method?.toLowerCase() || "get";
  const selectData =
    configuration.selectData || ((response) => response.data);
  const toastConfiguration = configuration.toast || {};
  const toastPosition = toastConfiguration.position || "bottom-right";

  return createAsyncThunk(
    typePrefix,
    async (arg, thunkAPI) => {
      let response;
      let data;

      let recentAuthenticationRetried = false;

      while (true) try {
        const path = await resolveOption(configuration.path, {
          arg,
          thunkAPI,
        });

        if (
          !configuration.request &&
          (typeof path !== "string" || !path.trim())
        ) {
          throw new TypeError(
            `createApiThunk "${typePrefix}" resolved an invalid request path.`,
          );
        }

        response = await executeConfiguredRequest({
          arg,
          configuration,
          method,
          path,
          thunkAPI,
        });
        data = await selectData(response, arg, thunkAPI);
        break;
      } catch (error) {
        // Let Redux Toolkit preserve its native aborted metadata. Turning an
        // intentional cancellation into an API error would create false UI.
        if (thunkAPI.signal.aborted || axios.isCancel(error)) {
          throw error;
        }

        let errorMessage;
        await runSideEffectSafely(async () => {
          errorMessage = await resolveOption(configuration.errorMessage, {
            arg,
            error,
            thunkAPI,
          });
        }, "error-message");
        const normalizedError = normalizeApiError(error, errorMessage);

        if (
          normalizedError.code === API_ERROR_CODE.RECENT_AUTHENTICATION_REQUIRED &&
          isStaffSensitiveActionState(thunkAPI.getState()) &&
          !recentAuthenticationRetried
        ) {
          const confirmed = await requestSensitiveActionConfirmation(
            thunkAPI.dispatch,
            thunkAPI.signal,
          );

          if (confirmed && !thunkAPI.signal.aborted) {
            recentAuthenticationRetried = true;
            continue;
          }

          return thunkAPI.rejectWithValue({
            ...normalizedError,
            code: "SENSITIVE_ACTION_CANCELLED",
            message: "Action cancelled.",
            retryable: false,
          });
        }

        const errorContext = {
          arg,
          error,
          normalizedError,
          thunkAPI,
        };

        if (configuration.onError) {
          await runSideEffectSafely(
            () => configuration.onError(errorContext),
            "onError",
          );
        }

        await runSideEffectSafely(
          () =>
            dispatchConfiguredToast({
              setting: toastConfiguration.error,
              defaultToast: {
                ...getApiErrorToast(normalizedError),
                ...(toastConfiguration.errorType
                  ? { type: toastConfiguration.errorType }
                  : {}),
              },
              context: errorContext,
              thunkAPI,
              position: toastPosition,
            }),
          "error-toast",
        );

        // Rejected actions always carry the same serializable API error shape.
        return thunkAPI.rejectWithValue(normalizedError);
      }

      const successContext = { arg, data, response, thunkAPI };

      if (configuration.onSuccess) {
        await runSideEffectSafely(
          () => configuration.onSuccess(successContext),
          "onSuccess",
        );
      }

      await runSideEffectSafely(
        () =>
            dispatchConfiguredToast({
              setting: toastConfiguration.success,
              defaultToast: {
                message:
                  response.data?.message || "Request completed successfully.",
                title: "Success",
                type: toastConfiguration.successType || types.SUCCESS,
              },
              context: successContext,
            thunkAPI,
            position: toastPosition,
          }),
        "success-toast",
      );

      return data;
    },
    thunkOptions,
  );
};

export default createApiThunk;
