/**
 * Helper function to create authenticated server actions
 * This must be used in a non-server file to avoid Next.js errors
 */
export function createAuthenticatedAction(actionFn) {
  return async function (...args) {
    try {
      // Add a timeout to detect stalled requests
      const timeoutPromise = new Promise((_, reject) => {
        const timeout = setTimeout(() => {
          clearTimeout(timeout);
          reject(
            new Error(
              "La solicitud ha tomado demasiado tiempo. Podría estar interrumpida por un cambio de pestaña."
            )
          );
        }, 30000); // 30 second timeout
      });

      // Race the actual request against the timeout
      const response = await Promise.race([actionFn(...args), timeoutPromise]);

      if (response.error) {
        throw new Error(response.error);
      }

      return response;
    } catch (error) {
      console.error("Error executing action:", error);

      // Handle tab switching specific errors
      if (
        error.name === "AbortError" ||
        error.message.includes("interrumpida") ||
        error.message.includes("timeout")
      ) {
        throw new Error("La solicitud fue interrumpida. Intente nuevamente.");
      }

      throw error;
    }
  };
}

/**
 * Creates a request with retry capability for handling tab switching issues
 */
export function createRetryableRequest() {
  const MAX_RETRIES = 3;

  return async function executeWithRetry(requestFn, ...args) {
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Add a small delay between retries
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt)));
          console.log(`Retry attempt ${attempt}`);
        }

        return await requestFn(...args);
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        lastError = error;

        // If not tab-switching related, don't retry
        if (
          !error.message.includes("interrumpida") &&
          !error.message.includes("timeout") &&
          error.name !== "AbortError"
        ) {
          throw error;
        }
      }
    }

    throw lastError;
  };
}
