import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string): string {
  const numericValue = parseFloat(value.replace(/[^\d.-]/g, ""));
  if (isNaN(numericValue)) return "Rs. 0";
  return `Rs. ${numericValue.toLocaleString("en-PK")}`;
}