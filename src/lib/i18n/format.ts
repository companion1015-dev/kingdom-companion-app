// Locale-aware dates, numbers and money. Use these instead of toLocaleDateString() / toFixed().
import { languageOf, type LocaleCode } from './config'

export const formatDate = (locale: LocaleCode, value: Date | string | number, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) =>
  new Intl.DateTimeFormat(languageOf(locale).intl, options).format(new Date(value))

export const formatNumber = (locale: LocaleCode, value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(languageOf(locale).intl, options).format(value)

export const formatCurrency = (locale: LocaleCode, cents: number, currency = 'USD') =>
  formatNumber(locale, cents / 100, { style: 'currency', currency })
