# Hineni · הִנֵּנִי

*"Here I am."* A Jewish clock that tells you where you stand in Hashem's time, with the ordinary clock alongside.

## What it shows

- **The dial.** 24 *sha'os zmaniyos*: 12 day hours (gold, across the top from sunrise on the left to sunset on the right) and 12 night hours (blue, underneath). The Jewish day starts on the right, at sunset. The sun or moon on the rim is the hand.
- **The civil clock, warped.** The inner ring shows ordinary hours placed where they fall on the Jewish dial, so you can see how the two line up.
- **Zmanim** as dots on the dial and as a list, with the next one counted down.
- **Hebrew date**, which rolls over at sunset, plus the weekday, moon and days until Shabbos.
- **The month**, with its tribe, mazal, letter, sense and choshen stone (Sefer Yetzirah and the Arizal).
- **Holidays and dates**: Yom Tov (one day in Israel, two outside), fasts with their postponements, Rosh Chodesh, Chanukah, Chabad dates, the Omer with its sefirah, and a "coming up" list.
- **Candle lighting and havdalah** for Shabbos and Yom Tov, including after-nightfall lighting on second days.
- **The moon**: the molad as announced in shul (Jerusalem time, with chalakim) and in your time, and the Kiddush Levanah window.
- **Tap any hour** for its exact times and its ruling planet (Shabbos 156a).
- **A live sky** behind the clock that follows the sun's real altitude where you are.
- **Where you are**: geolocation with a place name, search for any city, New York by default.

## Shitah

Alter Rebbe / Chabad, as chabad.org publishes it: hours run from netz to shkiah, alos is at 16.1° below the horizon, tzeis at 6°, and candle lighting is 18 minutes before shkiah. Times are for sea level.

## Run

Plain static files with no build step and no dependencies. Serve the folder:

```bash
npx serve .
```

Any static host works (GitHub Pages, Netlify, Cloudflare Pages). On HTTPS it installs as a home-screen app and works offline.

## Code

- `js/solar.js`: NOAA sun-position algorithm
- `js/zmanim.js`: zmanim, the Jewish-day model, dial angles
- `js/hebrew.js`: Hebrew date (built-in browser calendar), gematria, month data
- `js/calendar.js`: holidays, Omer, molad, Kiddush Levanah, planetary hours
- `js/sky.js`: the sky gradient from the sun's altitude
- `js/places.js`: geolocation, place names, city search
- `js/dial.js`: SVG dial
- `js/app.js`: UI, location, the once-a-second tick

Online services (optional, the clock works without them): Open-Meteo for city search, BigDataCloud for the place name of your coordinates.

## Next ideas

- Weekly parshah
- Elevation-adjusted sunrise/sunset
- Native home-screen widgets (iOS/Android) reusing `zmanim.js`
