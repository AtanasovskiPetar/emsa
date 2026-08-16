import type { Control, FieldValues, Path } from "react-hook-form";

import { SuggestionsCombobox } from "@/components/SuggestionsCombobox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MemberFieldType } from "@/constants/enums";
import { type MemberFieldDefinition } from "@/constants/types";

interface CustomFieldInputProps<T extends FieldValues> {
  def: MemberFieldDefinition;
  control: Control<T>;
  showRequired?: boolean;
}

export function CustomFieldInput<T extends FieldValues>({
  def,
  control,
  showRequired,
}: CustomFieldInputProps<T>) {
  return (
    <FormField
      control={control}
      name={`customFields.${def.key}` as Path<T>}
      render={({ field }) => {
        const value = field.value as string | number | null | undefined;
        return (
          <FormItem>
            <FormLabel>
              {def.label} {showRequired && <span className="text-amber-500">*</span>}
            </FormLabel>
            <FormControl>
              {def.type === MemberFieldType.NUMBER ? (
                <Input
                  type="number"
                  {...field}
                  value={value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber
                    )
                  }
                />
              ) : def.suggestions ? (
                <SuggestionsCombobox
                  fieldKey={def.key}
                  value={value as string | null | undefined}
                  onChange={field.onChange}
                />
              ) : (
                <Input {...field} value={value ?? ""} />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
