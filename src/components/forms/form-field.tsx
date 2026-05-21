"use client";

import type { FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FormError = FieldError | { message?: string };

type FormFieldProps = {
  label: string;
  error?: FormError;
  hint?: string;
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className,
  ...inputProps
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children ?? (
        <Input
          {...inputProps}
          aria-invalid={!!error}
          className={cn(error && "border-red-500 focus-visible:ring-red-500")}
        />
      )}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error.message}</p>}
      {!error && hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

type FormSelectProps = {
  label: string;
  error?: FieldError;
  required?: boolean;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

export function FormSelect({
  label,
  error,
  required,
  children,
  className,
  ...selectProps
}: FormSelectProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <select
        {...selectProps}
        className={cn(
          "flex h-10 w-full rounded-lg border border-border bg-[var(--input-bg)] px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
          error && "border-red-500",
          className
        )}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error.message}</p>}
    </div>
  );
}
