import { addDays, type DayKey } from './dates'

/**
 * A calendar file (RFC 5545) with one all-day event per deadline and a
 * reminder the day before. The text comes in from the caller, already in the
 * user's language; this file only knows the format.
 */

export type CalendarEvent = {
  /** Stable, so importing the file again updates instead of duplicating. */
  uid: string
  day: DayKey
  title: string
  description: string
}

const compact = (day: DayKey) => day.replace(/-/g, '')

/**
 * RFC 5545 TEXT: backslash, semicolon and comma get a backslash in front, a
 * line break becomes `\n`. The backslash goes first, or it would be doubled.
 */
const escapeText = (text: string) =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')

/** Lines longer than 75 octets are folded with a leading space. */
const fold = (line: string) => {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const chars = [...line]
  const parts: string[] = []
  let current = ''
  chars.forEach(char => {
    const limit = parts.length === 0 ? 75 : 74
    if (new TextEncoder().encode(current + char).length > limit) {
      parts.push(current)
      current = char
    } else {
      current += char
    }
  })
  parts.push(current)
  return parts.join('\r\n ')
}

/** `stamp` is the moment the file is made, `YYYYMMDDTHHMMSSZ`. */
export const buildCalendar = (
  name: string,
  events: CalendarEvent[],
  stamp: string,
) =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Skarbnyk//UK',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(name)}`,
    ...events.flatMap(event => [
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(event.day)}`,
      `DTEND;VALUE=DATE:${compact(addDays(event.day, 1))}`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(event.title)}`,
      'TRIGGER:-P1D',
      'END:VALARM',
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n')
    .concat('\r\n')
