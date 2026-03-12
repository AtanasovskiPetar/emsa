export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Provider = {
  CREDENTIALS: "CREDENTIALS",
  GOOGLE: "GOOGLE",
} as const;
export type Provider = (typeof Provider)[keyof typeof Provider];
