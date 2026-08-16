import { z } from "zod";

import { MemberFieldType } from "@/constants/enums";
import { customFieldValuesSchema } from "@/constants/schemas";
import type { CustomFieldValues, MemberFieldDefinition } from "@/constants/types";

export function isEmptyFieldValue(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return !Number.isFinite(value);
}

export function buildCustomFieldsSchema(
  defs: Pick<MemberFieldDefinition, "key" | "label" | "type" | "required">[],
  options: { enforceRequired: boolean }
) {
  return customFieldValuesSchema.superRefine((values, ctx) => {
    for (const def of defs) {
      const value = values[def.key];
      if (isEmptyFieldValue(value)) {
        if (options.enforceRequired && def.required) {
          ctx.addIssue({ code: "custom", path: [def.key], message: `${def.label} is required` });
        }
        continue;
      }
      if (def.type === MemberFieldType.NUMBER && typeof value !== "number") {
        ctx.addIssue({ code: "custom", path: [def.key], message: `${def.label} must be a number` });
      }
      if (def.type === MemberFieldType.TEXT && typeof value !== "string") {
        ctx.addIssue({ code: "custom", path: [def.key], message: `${def.label} must be text` });
      }
    }
  });
}

export function cleanCustomFieldValues(
  defs: Pick<MemberFieldDefinition, "key">[],
  values: CustomFieldValues
): Record<string, string | number> {
  const cleaned: Record<string, string | number> = {};
  for (const def of defs) {
    const value = values[def.key];
    if (isEmptyFieldValue(value)) continue;
    cleaned[def.key] = typeof value === "string" ? value.trim() : (value as number);
  }
  return cleaned;
}

export function computeProfileCompleted(
  defs: Pick<MemberFieldDefinition, "key" | "required">[],
  values: CustomFieldValues
): boolean {
  return defs.every((def) => !def.required || !isEmptyFieldValue(values[def.key]));
}

export function slugifyFieldKey(label: string): string {
  const words = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ")
    .filter(Boolean);
  if (words.length === 0) return "";
  const key =
    words[0] +
    words
      .slice(1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("");
  return /^[a-z]/.test(key) ? key.slice(0, 64) : "";
}

export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid custom field values";
}
