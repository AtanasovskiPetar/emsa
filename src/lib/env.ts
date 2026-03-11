function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  PORT: parseInt(optional("PORT", "3000"), 10),
  ENV: optional("ENV", "development"),
  DB_HOST: optional("DB_HOST", "localhost"),
  DB_PORT: parseInt(optional("DB_PORT", "5432"), 10),
  DB_USER: optional("DB_USER", "postgres"),
  DB_NAME: required("DB_NAME"),
  DB_SCHEMA: required("DB_SCHEMA"),
  DB_PASS: required("DB_PASS"),
} as const;
