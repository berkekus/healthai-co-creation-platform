import i18n from '../i18n'

/**
 * The locale for formatting dates and times: the interface language, so month and
 * weekday names follow the language switch instead of a hard-coded 'en-US' / 'en-GB'.
 */
export function uiLocale(): string {
  return i18n.language
}
