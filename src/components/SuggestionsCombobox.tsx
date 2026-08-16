import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { queryKeys } from "@/constants/query-keys";
import { ApiRoutes } from "@/constants/routes";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface SuggestionsComboboxProps {
  fieldKey: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SuggestionsCombobox({
  fieldKey,
  value,
  onChange,
  placeholder = "Search or enter a value...",
  disabled,
}: SuggestionsComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value ?? "");
  }, [value]);

  const { data: suggestions = [] } = useQuery({
    queryKey: queryKeys.memberFieldSuggestions(fieldKey),
    queryFn: () =>
      apiClient.get<string[]>(ApiRoutes.MEMBER_FIELD_SUGGESTIONS.replace(":key", fieldKey)),
    staleTime: Infinity,
  });

  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(inputValue.toLowerCase().trim())
  );

  const showSuggestions = open && (filtered.length > 0 || inputValue.trim().length > 0);

  function handleSelect(suggestion: string) {
    setInputValue(suggestion);
    onChange(suggestion);
    setOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    onChange(val.trim() || null);
    if (!open) setOpen(true);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <Popover open={showSuggestions} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            tabIndex={-1}
            disabled={disabled}
            className="absolute right-0 top-0 h-full w-8 shrink-0 opacity-50"
            onClick={() => {
              setOpen((v) => !v);
              inputRef.current?.focus();
            }}
          >
            <ChevronsUpDown className="size-3.5" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        align="start"
      >
        <div className="max-h-60 overflow-y-auto py-1">
          {filtered.length === 0 && inputValue.trim() && (
            <div
              className="flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-accent"
              onClick={() => handleSelect(inputValue.trim())}
            >
              <span className="text-muted-foreground">Add&nbsp;</span>
              <span className="font-medium">&ldquo;{inputValue.trim()}&rdquo;</span>
            </div>
          )}
          {filtered.map((s) => (
            <div
              key={s}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              onClick={() => handleSelect(s)}
            >
              <Check
                className={cn("size-3.5 shrink-0", value === s ? "opacity-100" : "opacity-0")}
              />
              {s}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
