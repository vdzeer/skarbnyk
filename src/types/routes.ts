/** Every screen the app has. Navigation goes through these, never raw paths. */
export enum ROUTES {
  Overview = '/',
  Incomes = '/incomes',
  Deadlines = '/deadlines',
  Settings = '/settings',
}

/**
 * The side menu of a wide screen and the bottom bar of a phone, in order:
 * what to pay, what came in, when, how it is counted. Four labels fit a phone.
 */
export const TAB_ROUTES = [
  ROUTES.Overview,
  ROUTES.Incomes,
  ROUTES.Deadlines,
  ROUTES.Settings,
] as const

export type TabRoute = (typeof TAB_ROUTES)[number]

const isUnder = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`)

/** Which tab a path belongs to; anything unknown is the overview. */
export const activeTab = (pathname: string): TabRoute =>
  TAB_ROUTES.find(
    route => route !== ROUTES.Overview && isUnder(pathname, route),
  ) ?? ROUTES.Overview
