export interface IncidentCreatedEmailOptions {
  recipientName: string;
  incidentId: string;
  severity: string;
  summary: string;
  organizationName: string;
  projectId: string;
  createdAt: string;
  dashboardUrl: string;
}

export function buildIncidentCreatedEmail(opts: IncidentCreatedEmailOptions): {
  subject: string;
  html: string;
} {
  const subject = `[${opts.severity}] New incident detected — ${opts.organizationName}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e4e4e7; }
    .header { background: #dc2626; padding: 24px 32px; }
    .header h1 { margin: 0; color: #fff; font-size: 20px; font-weight: 600; }
    .header p { margin: 4px 0 0; color: #fecaca; font-size: 13px; }
    .body { padding: 32px; }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; margin-bottom: 4px; }
    .value { font-size: 15px; color: #18181b; margin-bottom: 20px; line-height: 1.5; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: #fee2e2; color: #b91c1c; }
    .btn { display: inline-block; margin-top: 8px; padding: 12px 24px; background: #18181b; color: #fff; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; }
    .footer { padding: 20px 32px; border-top: 1px solid #f4f4f5; font-size: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Incident Detected</h1>
      <p>${opts.organizationName}</p>
    </div>
    <div class="body">
      <p style="margin:0 0 24px;color:#3f3f46;">Hi ${opts.recipientName},</p>
      <p style="margin:0 0 24px;color:#3f3f46;">A new incident has been automatically detected and opened in your project.</p>

      <div class="label">Severity</div>
      <div class="value"><span class="badge">${opts.severity}</span></div>

      <div class="label">Summary</div>
      <div class="value">${opts.summary}</div>

      <div class="label">Incident ID</div>
      <div class="value" style="font-family:monospace;font-size:13px;">${opts.incidentId}</div>

      <div class="label">Project</div>
      <div class="value" style="font-family:monospace;font-size:13px;">${opts.projectId}</div>

      <div class="label">Detected at</div>
      <div class="value">${new Date(opts.createdAt).toUTCString()}</div>

      <a class="btn" href="${opts.dashboardUrl}">View Incident</a>
    </div>
    <div class="footer">
      You're receiving this because you're the owner of <strong>${opts.organizationName}</strong>.<br />
      Risk Engine · Automated Incident Detection
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}
