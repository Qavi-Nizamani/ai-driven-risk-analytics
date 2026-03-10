import * as Brevo from "@getbrevo/brevo";

let _client: Brevo.TransactionalEmailsApi | null = null;

export function getEmailClient(): Brevo.TransactionalEmailsApi {
  if (_client) return _client;
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY env var is not set");
  _client = new Brevo.TransactionalEmailsApi();
  _client.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  return _client;
}
