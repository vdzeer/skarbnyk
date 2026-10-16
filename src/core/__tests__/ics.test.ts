import { buildCalendar } from '..'

describe('buildCalendar', () => {
  const file = buildCalendar(
    'Скарбник',
    [
      {
        uid: '2026-q3-esv@skarbnyk.web.app',
        day: '2026-10-20',
        title: 'Сплатити ЄСВ за III квартал, 5 707,02 грн',
        description: 'Строк; сплата',
      },
    ],
    '20261014T090000Z',
  )

  it('is one calendar with one all-day event and a reminder', () => {
    expect(file.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(file.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(file).toContain('DTSTART;VALUE=DATE:20261020')
    expect(file).toContain('DTEND;VALUE=DATE:20261021')
    expect(file).toContain('TRIGGER:-P1D')
  })

  it('escapes commas and semicolons', () => {
    expect(file).toContain('DESCRIPTION:Строк\\; сплата')
    expect(file).toContain('за III квартал\\, 5')
  })

  it('escapes backslashes first and turns line breaks into \\n', () => {
    const escaped = buildCalendar(
      'C:\\Податки',
      [
        {
          uid: 'x',
          day: '2026-10-20',
          title: 'a\\;b',
          description: 'one\r\ntwo\nthree\rfour',
        },
      ],
      '20261014T090000Z',
    )
    expect(escaped).toContain('X-WR-CALNAME:C:\\\\Податки')
    expect(escaped).toContain('SUMMARY:a\\\\\\;b')
    expect(escaped).toContain('DESCRIPTION:one\\ntwo\\nthree\\nfour')
  })

  it('folds lines over 75 bytes', () => {
    const lines = file.split('\r\n')
    lines.forEach(line => {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    })
  })
})
