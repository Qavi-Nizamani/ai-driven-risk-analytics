export const config = {
  apiGatewayUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? "https://api.vigilry.com",
  ingestionUrl: process.env.NEXT_PUBLIC_INGESTION_URL ?? "https://ingest.vigilry.com",
  websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? "https://ws.vigilry.com",
  dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "https://vigilry.com",
} as const;
