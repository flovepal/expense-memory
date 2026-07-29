/** Formats a numeric amount using a currency's ISO code and decimal digits. */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  decimalDigits = 2
): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits,
    }).format(amount)
  } catch {
    // Intl throws on currency codes it doesn't recognize (shouldn't happen
    // for our seeded ISO codes, but fall back gracefully rather than crash).
    return `${currencyCode} ${amount.toFixed(decimalDigits)}`
  }
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export function formatMonth(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
  }).format(date)
}
