/**
 * Where "get the app" goes. One constant, because it was three.
 *
 * The site carried two different App Store ids: id6752625262 on the home page
 * and id6504672498 on the listing page and the download banner. At most one of
 * those can be the app, and the wrong one is a dead end at the exact moment
 * somebody has decided to book.
 *
 Sabię launched on the App Store on 2026-06-01, iOS only;
 * Android is still to come, so there is one link here and not two.
 *
 * 6752625262 is the real one. It is the `ascAppId` in
 * sabie-v53-main/eas.json:49, which is the id EAS submits builds to, so it is
 * the app that actually ships rather than the id somebody pasted once.
 */
/**
 * The App Store id on its own, because two things need it and one of them
 * cannot use a URL: Apple's Smart App Banner takes the bare number. The URL is
 * built from it rather than written out again, which is the mistake this file
 * exists to have stopped once already.
 */
export const APP_STORE_ID = "6752625262";

export const APP_STORE_URL = `https://apps.apple.com/gb/app/sabie/id${APP_STORE_ID}`;

/**
 * Where the app strip's dismissal is remembered.
 *
 * It lives here rather than inside the component because two places read it:
 * the component, and a blocking inline script in <head> that hides the strip
 * before the first paint. Before that script existed the strip started hidden
 * and appeared in an effect, which pushed the entire home page down a moment
 * after it drew. That is the load glitch.
 */
export const APP_STRIP_KEY = "sabie.appstrip.dismissed";
