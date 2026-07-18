/**
 * Utility to safely extract an error message from an unknown error.
 */
export function getErrorMessage(err: unknown, fallback = "An error occurred"): string {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: unknown }).response;
    if (response && typeof response === "object" && "data" in response) {
      const data = (response as { data?: unknown }).data;
      if (data && typeof data === "object" && "message" in data) {
        const message = (data as { message?: unknown }).message;
        if (typeof message === "string") return message;
        if (Array.isArray(message)) return message.join(", ");
      }
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}