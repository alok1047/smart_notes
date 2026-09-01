/**
 * Normalize an unknown error into a human-readable string.
 * Handles axios error responses (Express errorHandler shape:
 * { success:false, error:{ code, message, requestId, stack } }),
 * plain Error objects, and raw strings. NEVER returns an object.
 */
export const toErrorMessage = (err, fallback = 'Something went wrong.') => {
  if (!err) return fallback;

  if (typeof err === 'string') return err;

  if (err instanceof Error) {
    return err.message || fallback;
  }

  const data = err?.response?.data;
  if (data && typeof data === 'object') {
    const nested = data.error;
    if (nested && typeof nested === 'object') {
      if (typeof nested.message === 'string') return nested.message;
      if (typeof nested.code === 'string') return nested.code;
    }
    if (typeof data.message === 'string') return data.message;
  }

  if (typeof err?.message === 'string') return err.message;

  return fallback;
};

export const extractApiError = toErrorMessage;