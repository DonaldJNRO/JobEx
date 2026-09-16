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
export const APP_STORE_URL = "https://apps.apple.com/gb/app/sabie/id6752625262";
