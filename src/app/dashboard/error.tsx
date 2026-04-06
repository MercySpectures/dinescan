"use client";

import { useEffect } from "react";
import { captureError } from "@/lib/telemetry";

interface DashboardErrorProps {
  error: Error;
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    captureError({
      scope: "dashboard-error-boundary",
      message: error.message,
      meta: { stack: error.stack }
    });
  }, [error]);

  return (
    <div className="card p-6">
      <h2 className="font-display text-xl font-semibold text-navy-900">Dashboard failed to load</h2>
      <p className="mt-2 text-sm text-gray-500">Try again. If this persists, check Supabase connectivity.</p>
      <button type="button" className="btn-primary mt-4" onClick={reset}>
        Retry
      </button>
    </div>
  );
}

