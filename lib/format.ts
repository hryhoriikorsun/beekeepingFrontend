const money = new Intl.NumberFormat('uk-UA', {
  style: 'currency',
  currency: 'UAH',
  minimumFractionDigits: 2,
});

/// The API sends money as a fixed-scale string. It becomes a number only
/// here, at the last possible moment, and only to be formatted.
export const formatMoney = (value: string): string => money.format(Number(value));

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
