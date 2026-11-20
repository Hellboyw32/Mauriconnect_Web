const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

// Mauritian Rupees, e.g. 1234.5 -> "Rs 1,234.50"
export const formatRs = (value: number | string | null | undefined): string =>
  `Rs ${formatter.format(Number(value) || 0)}`;

// Same grouping without the "Rs" prefix (for table columns whose header already says Rs).
export const formatAmount = (value: number | string | null | undefined): string =>
  formatter.format(Number(value) || 0);
