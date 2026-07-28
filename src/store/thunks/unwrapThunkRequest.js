/**
 * Converts a dispatched async-thunk promise into normal Promise semantics.
 * Condition skips and cancellations are expected control flow; real rejected
 * requests throw their normalized payload so callers can handle failures.
 */
const unwrapThunkRequest = async (request) => {
  const action = await request;

  if (action.meta?.condition || action.meta?.aborted) {
    return undefined;
  }

  if (action.meta?.requestStatus === "rejected") {
    throw action.payload || action.error;
  }

  return action.payload;
};

export default unwrapThunkRequest;
