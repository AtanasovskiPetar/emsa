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
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN", "7d"),
  GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: required("GOOGLE_CLIENT_SECRET"),
  GOOGLE_REDIRECT_URI: required("GOOGLE_REDIRECT_URI"),
  AWS_ACCESS_KEY_ID: required("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: required("AWS_SECRET_ACCESS_KEY"),
  AWS_REGION: required("AWS_REGION"),
  AWS_S3_BUCKET: required("AWS_S3_BUCKET"),
  RESEND_API_KEY: required("RESEND_API_KEY"),
  FROM_EMAIL: required("FROM_EMAIL"),
  APP_URL: required("APP_URL"),
} as const;
