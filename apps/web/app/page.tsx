import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Customer Risk Engine</h1>
      <p>
        Minimal Phase-1 dashboard. Go to the{" "}
        <Link href="/dashboard">risk dashboard</Link>.
      </p>
    </main>
  );
}

