import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Incident Intelligence Platform</h1>
      <p>
        Minimal Phase-1 dashboard. Go to the{" "}
        <Link href="/dashboard">incident dashboard</Link>.
      </p>
    </main>
  );
}

