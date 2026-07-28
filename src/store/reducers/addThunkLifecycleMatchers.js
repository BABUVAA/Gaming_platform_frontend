import { isAnyOf } from "@reduxjs/toolkit";

const lifecycleNames = ["pending", "fulfilled", "rejected"];

/**
 * Confirms that every supplied thunk exposes Redux Toolkit lifecycle actions.
 * Failing during store setup makes a misspelled or invalid thunk easy to find.
 */
const validateThunks = (thunks) => {
  if (!Array.isArray(thunks) || thunks.length === 0) {
    throw new TypeError(
      "addThunkLifecycleMatchers requires at least one async thunk.",
    );
  }

  thunks.forEach((thunk, thunkIndex) => {
    lifecycleNames.forEach((lifecycleName) => {
      if (typeof thunk?.[lifecycleName] !== "function") {
        throw new TypeError(
          `Thunk at index ${thunkIndex} is missing its ${lifecycleName} action creator.`,
        );
      }
    });
  });
};

/**
 * Returns the lifecycle reducers that the caller intentionally supplied.
 * A slice may share only errors, only loading, or the complete lifecycle.
 */
const validateHandlers = (handlers) => {
  if (!handlers || typeof handlers !== "object") {
    throw new TypeError(
      "addThunkLifecycleMatchers requires a lifecycle handlers object.",
    );
  }

  const configuredLifecycleNames = lifecycleNames.filter((lifecycleName) => {
    const handler = handlers[lifecycleName];

    if (handler !== undefined && typeof handler !== "function") {
      throw new TypeError(
        `The ${lifecycleName} lifecycle handler must be a reducer function.`,
      );
    }

    return typeof handler === "function";
  });

  if (configuredLifecycleNames.length === 0) {
    throw new TypeError(
      "At least one lifecycle reducer must be supplied to addThunkLifecycleMatchers.",
    );
  }

  return configuredLifecycleNames;
};

/**
 * Registers each supplied lifecycle reducer for a related group of thunks.
 *
 * Add endpoint-specific addCase reducers before calling this helper because
 * Redux Toolkit requires exact cases to be registered before matchers.
 */
const addThunkLifecycleMatchers = (builder, thunks, handlers) => {
  validateThunks(thunks);
  const configuredLifecycleNames = validateHandlers(handlers);

  const actionsFor = (lifecycleName) =>
    thunks.map((thunk) => thunk[lifecycleName]);

  configuredLifecycleNames.forEach((lifecycleName) => {
    builder.addMatcher(
      isAnyOf(...actionsFor(lifecycleName)),
      handlers[lifecycleName],
    );
  });

  return builder;
};

export default addThunkLifecycleMatchers;
