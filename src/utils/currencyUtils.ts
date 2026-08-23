export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: "NGN", symbol: "₦", label: "NGN (₦) - Nigerian Naira" },
  { code: "USD", symbol: "$", label: "USD ($) - US Dollar" },
  { code: "GBP", symbol: "£", label: "GBP (£) - British Pound" },
  { code: "EUR", symbol: "€", label: "EUR (€) - Euro" },
];

export const DEFAULT_CURRENCY = "NGN (₦)";

export function getSystemCurrency(): string {
  try {
    const stored = localStorage.getItem("church_hr_system_currency");
    if (stored) return stored;
  } catch {}
  return DEFAULT_CURRENCY;
}

export function saveSystemCurrency(currencyStr: string): void {
  try {
    localStorage.setItem("church_hr_system_currency", currencyStr);
    window.dispatchEvent(new Event("system-currency-changed"));
  } catch {}
}

export function getCurrencySymbol(currencyStr?: string): string {
  const target = currencyStr || getSystemCurrency();
  if (target.includes("₦") || target.toUpperCase().includes("NGN")) return "₦";
  if (target.includes("$") || target.toUpperCase().includes("USD")) return "$";
  if (target.includes("£") || target.toUpperCase().includes("GBP")) return "£";
  if (target.includes("€") || target.toUpperCase().includes("EUR")) return "€";
  return "₦";
}

export function formatCurrency(amount: number, currencyStr?: string): string {
  const symbol = getCurrencySymbol(currencyStr);
  const formattedNumber = Number(amount || 0).toLocaleString();
  return `${symbol}${formattedNumber}`;
}
