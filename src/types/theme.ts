/** What the user picked: follow the device, or one theme whatever it says. */
export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]

/** Where the settings live in the browser. The theme script reads it too. */
export const SETTINGS_STORAGE_KEY = 'skarbnyk-settings'

/**
 * Runs in the page head, before anything is painted: puts the saved theme on
 * the document so a dark page never opens with a flash of the light one.
 * "System" needs nothing set: the stylesheet follows the device by itself.
 * It is a string because it has to run before the app's own code loads.
 */
export const THEME_SCRIPT = `try{var s=JSON.parse(localStorage.getItem('${SETTINGS_STORAGE_KEY}')||'{}');var t=s.state&&s.state.theme;if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}}catch(e){}`
