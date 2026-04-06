export interface TelemetryPayload {
  scope: string;
  message: string;
  meta?: Record<string, unknown>;
}

export function captureError(payload: TelemetryPayload): void {
  const body = {
    level: "error",
    ts: new Date().toISOString(),
    ...payload
  };
  console.error(JSON.stringify(body));
}

