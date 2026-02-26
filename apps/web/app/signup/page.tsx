"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface SignupResult {
  apiKey: string;
  organization: { id: string; name: string };
  project: { id: string; name: string };
}

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SignupResult | null>(null);
  const [copied, setCopied] = useState(false);
  const keyRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
    const orgName = (form.elements.namedItem("orgName") as HTMLInputElement).value.trim();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, orgName }),
      });

      const data = await res.json() as { message?: string; apiKey?: string; organization?: { id: string; name: string }; project?: { id: string; name: string } };

      if (!res.ok) {
        setError(data.message ?? "Signup failed");
        return;
      }

      setResult({
        apiKey: data.apiKey!,
        organization: data.organization!,
        project: data.project!,
      });
    } catch {
      setError("Network error — is the API running?");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    void navigator.clipboard.writeText(result.apiKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (result) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, maxWidth: "520px" }}>
          <h1 style={styles.title}>Account created!</h1>
          <p style={{ ...styles.subtitle, marginBottom: "1.5rem" }}>Save your API key — it won&apos;t be shown again</p>

          <div style={styles.keyBox}>
            <p style={styles.keyLabel}>API Key (ingestion service)</p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                ref={keyRef}
                readOnly
                value={result.apiKey}
                style={styles.keyInput}
                onClick={() => keyRef.current?.select()}
              />
              <button onClick={handleCopy} style={styles.copyButton}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p style={styles.keyHint}>
              Use as <code style={{ color: "#a5b4fc" }}>X-Api-Key</code> header when calling the ingestion service at port 4100.
            </p>
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Organization ID</span>
              <span style={styles.infoValue}>{result.organization.id}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Project ID</span>
              <span style={styles.infoValue}>{result.project.id}</span>
            </div>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            style={{ ...styles.button, marginTop: "1.5rem", width: "100%" }}
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>Incident Intelligence Platform</p>

        <form onSubmit={(e) => void handleSubmit(e)} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              style={styles.input}
              placeholder="you@example.com"
            />
          </label>

          <label style={styles.label}>
            Full name
            <input
              name="name"
              type="text"
              required
              autoComplete="name"
              style={styles.input}
              placeholder="Jane Smith"
            />
          </label>

          <label style={styles.label}>
            Organization name
            <input
              name="orgName"
              type="text"
              required
              style={styles.input}
              placeholder="Acme Corp"
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              style={styles.input}
              placeholder="At least 8 characters"
            />
          </label>

          <label style={styles.label}>
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              style={styles.input}
              placeholder="Repeat password"
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link href="/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f1117",
    fontFamily: "monospace",
    padding: "1rem",
  },
  card: {
    background: "#1a1d27",
    border: "1px solid #2a2d3a",
    borderRadius: "8px",
    padding: "2.5rem 2rem",
    width: "100%",
    maxWidth: "420px",
  },
  title: {
    margin: "0 0 0.25rem",
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#e2e8f0",
  },
  subtitle: {
    margin: "0 0 2rem",
    fontSize: "0.8rem",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    fontSize: "0.8rem",
    color: "#94a3b8",
    fontWeight: 600,
    letterSpacing: "0.04em",
  },
  input: {
    padding: "0.6rem 0.75rem",
    background: "#0f1117",
    border: "1px solid #2a2d3a",
    borderRadius: "4px",
    color: "#e2e8f0",
    fontSize: "0.9rem",
    fontFamily: "monospace",
    outline: "none",
  },
  error: {
    margin: 0,
    padding: "0.6rem 0.75rem",
    background: "#3b1818",
    border: "1px solid #7f1d1d",
    borderRadius: "4px",
    color: "#fca5a5",
    fontSize: "0.85rem",
  },
  button: {
    marginTop: "0.5rem",
    padding: "0.7rem 1rem",
    background: "#6366f1",
    border: "none",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "0.9rem",
    fontFamily: "monospace",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.04em",
  },
  footer: {
    marginTop: "1.5rem",
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#64748b",
  },
  link: {
    color: "#818cf8",
    textDecoration: "none",
  },
  keyBox: {
    background: "#0f1117",
    border: "1px solid #4f46e5",
    borderRadius: "6px",
    padding: "1rem",
    marginBottom: "1.25rem",
  },
  keyLabel: {
    margin: "0 0 0.5rem",
    fontSize: "0.75rem",
    color: "#818cf8",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  keyInput: {
    flex: 1,
    padding: "0.5rem 0.6rem",
    background: "#1a1d27",
    border: "1px solid #2a2d3a",
    borderRadius: "4px",
    color: "#e2e8f0",
    fontSize: "0.75rem",
    fontFamily: "monospace",
    outline: "none",
    minWidth: 0,
  },
  copyButton: {
    padding: "0.5rem 0.8rem",
    background: "#312e81",
    border: "none",
    borderRadius: "4px",
    color: "#c7d2fe",
    fontSize: "0.8rem",
    fontFamily: "monospace",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  keyHint: {
    margin: "0.6rem 0 0",
    fontSize: "0.75rem",
    color: "#4b5563",
    lineHeight: 1.5,
  },
  infoGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    padding: "0.5rem 0.75rem",
    background: "#0f1117",
    border: "1px solid #2a2d3a",
    borderRadius: "4px",
  },
  infoLabel: {
    fontSize: "0.7rem",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  infoValue: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    wordBreak: "break-all",
  },
};
