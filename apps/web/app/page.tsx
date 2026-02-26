import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "monospace", padding: "24px", maxWidth: "480px", margin: "80px auto" }}>
      <h1 style={{ marginBottom: "8px" }}>Incident Intelligence Platform</h1>
      <p style={{ color: "#6b7280", marginBottom: "32px" }}>
        Real-time incident detection and risk analytics.
      </p>
      <div style={{ display: "flex", gap: "12px" }}>
        <Link
          href="/signup"
          style={{
            padding: "10px 20px",
            background: "#6366f1",
            color: "#fff",
            borderRadius: "4px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          Create account
        </Link>
        <Link
          href="/login"
          style={{
            padding: "10px 20px",
            border: "1px solid #374151",
            color: "#9ca3af",
            borderRadius: "4px",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          style={{
            padding: "10px 20px",
            color: "#6b7280",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          Dashboard →
        </Link>
      </div>
    </main>
  );
}
