"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json() as { message?: string };

      if (!res.ok) {
        setError(data.message ?? "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error — is the API running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Sign in</h1>
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
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={styles.input}
              placeholder="Your password"
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={styles.footer}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={styles.link}>
            Create one
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
    maxWidth: "380px",
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
};
