export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const MemberFieldType = {
  TEXT: "TEXT",
  NUMBER: "NUMBER",
} as const;
export type MemberFieldType = (typeof MemberFieldType)[keyof typeof MemberFieldType];
