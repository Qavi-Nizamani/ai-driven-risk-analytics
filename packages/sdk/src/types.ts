export interface VigilryOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface CaptureCorrelation {
  user_id?: string;
  customer_id?: string;
  order_id?: string;
  [key: string]: string | undefined;
}

export interface CaptureOptions {
  type: string;
  severity: "info" | "warn" | "error" | "critical";
  message: string;
  correlation?: CaptureCorrelation;
}

export interface CaptureErrorContext {
  status_code?: number;
  path?: string;
  method?: string;
  correlation?: CaptureCorrelation;
}

export interface IngestResult {
  jobId: string;
  status: "queued";
}

// Internal wire types — not exported from index

export interface WireCorrelation {
  user_id?: string;
  customer_id?: string;
  order_id?: string;
  payment_provider?: string;
  plan?: string;
  deployment_id?: string;
}

export interface WireEventBody {
  type: string;
  source: string;
  severity: string;
  payload?: Record<string, unknown>;
  correlation?: WireCorrelation;
}

export interface WireServerErrorBody {
  status_code: number;
  path: string;
  method: string;
  error_message: string;
  stack?: string;
  correlation?: WireCorrelation;
}
