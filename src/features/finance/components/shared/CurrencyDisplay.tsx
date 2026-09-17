import React from "react";

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  locale?: string;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency = "USD",
  locale = "en-US",
  className = "",
}) => {
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(Math.abs(amount));

  const isNegative = amount < 0;

  return (
    <span
      className={`font-medium ${isNegative ? "text-[var(--danger)]" : "text-green-600"} ${className}`}
    >
      {isNegative ? "-" : ""}
      {formatted}
    </span>
  );
};
