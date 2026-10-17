export interface ErrorMonitor {
  captureException(error: unknown, context?: Record<string, string>): void;
}

/** Stays quiet until SENTRY_DSN is set. No vendor SDK is loaded before then. */
export function createMonitor(
  dsn: string | undefined,
  write: (line: string) => void = (line) => {
    console.error(line);
  },
): ErrorMonitor {
  if (!dsn) {
    return { captureException() {} };
  }
  return {
    captureException(error, context) {
      const message = error instanceof Error ? error.message : String(error);
      write(JSON.stringify({ level: "error", message, context: context ?? {} }));
    },
  };
}

export const monitor = createMonitor(process.env.SENTRY_DSN);
