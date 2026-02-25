export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

export function getOptionalEnv(name: string, defaultValue?: string): string | undefined {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  return value;
}

export function getNumberEnv(name: string, defaultValue?: number): number {
  const raw = process.env[name];

  if (raw === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(`Missing required numeric env var: ${name}`);
  }

  const parsed = Number(raw);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric env var ${name}: ${raw}`);
  }

  return parsed;
}

