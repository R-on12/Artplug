export const CURRENCY_RATES: Record<string, { rate: number; symbol: string; name: string }> = {
  USD: { rate: 1.0, symbol: '$', name: 'Dollar' },
  GHS: { rate: 14.50, symbol: 'GH₵', name: 'Cedis' },
  EUR: { rate: 0.92, symbol: '€', name: 'Euro' },
  GBP: { rate: 0.79, symbol: '£', name: 'Pound' }
};

export function formatPrice(priceStr: string, currencyCode: string = 'USD') {
  const currency = CURRENCY_RATES[currencyCode] || CURRENCY_RATES.USD;
  const basePrice = parseFloat(String(priceStr).replace(/,/g, ''));
  if (isNaN(basePrice)) return `${currency.symbol}0`;
  
  const converted = basePrice * currency.rate;
  return `${currency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
