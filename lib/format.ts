const money = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * The API sends money as a fixed-scale string. It becomes a number only here,
 * at the last possible moment, and only to be formatted.
 *
 * The symbol is appended by hand rather than by `style: 'currency'`: Node and
 * the browser ship different ICU data for UAH ("₴" against "грн"), and the
 * difference showed up as a hydration mismatch on every price.
 */
export const formatMoney = (value: string): string => `${money.format(Number(value))} ₴`;

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
