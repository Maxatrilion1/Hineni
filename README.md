# Hineni · הִנֵּנִי

*"Here I am."* A Jewish clock that tells you where you stand in Hashem's time, with the ordinary clock alongside.

## What it shows

- **First visit: a journey from the outside in.** The 6th millennium, then the shemitah cycle, the year, the month, the week, and finally Today, live, ending with an invitation to enter the hour you're in. It can be replayed from Settings.
- **The circles button** opens all seven circles nested one inside the other, each showing where you are; tap one to go there. **Today** is always one tap away.

The clock's job is orientation: where you stand in Jewish time and space. It is one dial you can climb into and out of.

- **Day** (the start): 24 *sha'os zmaniyos*, gold across the top from sunrise to sunset, blue underneath for the night. The regular clock sits inside, bent to fit. Each hour carries its month and tribe, shown as a band in the tribe's flag colors (Bamidbar Rabbah 2:7).
- **Inside an hour**: the ring is the hour itself, 60 zmani minutes filling as it passes. The tribe's emblem and name sit in the center; its month, letter, sense and mazal around it. Below: Yaakov's or Moshe's blessing, the tribe's story, flag, name, mother, stone, where it camped, the hour's planet, and the hour in Jewish and civil time.
- **Zoom out**: week (the days of Creation, Shabbos at the top), month (the moon's face day by day), year (the months with their tribes and flags), shemitah (the seven years and their tithes), and the 6,000 years (Sanhedrin 97a's three eras and the cosmic week).
- **The path** above the dial (and the scale under the dial) shows where you are; ‹ › walk sideways, and Back to now returns.
- **Space**: the dial becomes the camp around the Mishkan, oriented to north (or turning with your phone), with the dot on the rim pointing to Yerushalayim and the tribes of this hour and month marked.
- **Medallions** for the twelve tribes and the seven days: deep grounds, gold silhouettes, a fine rim, matched to the Midrash and to Bereishis 1.
- **The scale** under the dial shows every circle at once: millennium, shemitah, year, month, week, day, hour. Tap a row to turn the dial into that circle.
- **Zmanim** (in the day view): each in Jewish time ("3:00 of the day") and civil time, with Shabbos, Yom Tov and fast times.

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
- `js/levels.js`: the zoom levels, their rings and panels
- `js/art.js`: the illustrated badges
- `js/lore.js`: tribes, days, direction to Yerushalayim
- `js/sky.js`: the sky gradient from the sun's altitude
- `js/places.js`: geolocation, place names, city search
- `js/dial.js`: SVG dial
- `js/app.js`: UI, location, the once-a-second tick

Online services (optional, the clock works without them): Open-Meteo for city search, BigDataCloud for the place name of your coordinates.

## Next ideas

- Weekly parshah
- Elevation-adjusted sunrise/sunset
- Native home-screen widgets (iOS/Android) reusing `zmanim.js`
