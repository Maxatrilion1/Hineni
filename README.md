# Hineni · הִנֵּנִי

*"Here I am."* A Jewish clock that tells you where you stand in Hashem's time, with the ordinary clock alongside.

## What it shows

The clock's job is orientation: where you stand in Jewish time and space.

- **The dial.** 24 *sha'os zmaniyos*: 12 day hours (gold, across the top from sunrise on the left to sunset on the right) and 12 night hours (blue, underneath). The Jewish day starts on the right, at sunset. The regular clock sits inside, bent to fit.
- **Each hour has a month and a tribe.** Hour 1 is Nisan's and Yehudah's, hour 2 Iyar's and Yissachar's, and so on (Arizal: hours and months share the twelve permutations of the Name; the cycle repeats at night). A thin band shows each tribe's flag colors (Bamidbar Rabbah 2:7).
- **The center** shows the hour, its tribe and emblem, the Hebrew day and date.
- **Tap an hour** for its tribe (emblem, flag, Yaakov's and Moshe's blessings, name, mother, camp, stone), its month (letter, sense, mazal), its ruling planet (Shabbos 156a) and the zmanim in it, in Jewish and civil time.
- **Where you are in time**: a stack from hour to day to week to month to year to the shemitah cycle to the 6,000 years (Sanhedrin 97a), each tappable: the day's Creation, Shir shel Yom, sefirah and ushpiz; the month's molad and Kiddush Levanah; the 19-year cycle, shemitah and maaser.
- **Where you are in space**: distance and direction to Yerushalayim, with a live compass on phones, and the camp around the Mishkan with the tribes of the hour and month marked.
- **Zmanim** (folded): each in Jewish time ("3:00 of the day") and civil time, with Shabbos, Yom Tov and fast times.
- **Coming up** (folded): holidays, fasts, Chabad dates.

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
