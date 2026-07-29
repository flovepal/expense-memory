// Single source of truth for the CHECK-constrained "enum" columns that are
// stored as plain text in Postgres. Reused for Zod schemas and <Select>
// option lists so the allowed values are never duplicated.

export const WALLET_TYPES = [
  "cash",
  "bank",
  "credit_card",
  "e_wallet",
  "savings",
  "investment",
  "other",
] as const
export type WalletType = (typeof WALLET_TYPES)[number]

export const TRANSACTION_TYPES = ["income", "expense"] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export const ANSWER_TYPES = [
  "text",
  "number",
  "boolean",
  "single_select",
  "multi_select",
  "date",
] as const
export type AnswerType = (typeof ANSWER_TYPES)[number]

export const THEME_PREFERENCES = ["light", "dark", "system"] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  cash: "Cash",
  bank: "Bank Account",
  credit_card: "Credit Card",
  e_wallet: "E-Wallet",
  savings: "Savings",
  investment: "Investment",
  other: "Other",
}

export const ANSWER_TYPE_LABELS: Record<AnswerType, string> = {
  text: "Text",
  number: "Number",
  boolean: "Yes / No",
  single_select: "Single choice",
  multi_select: "Multiple choice",
  date: "Date",
}
