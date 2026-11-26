# Hineni · הִנֵּנִי

*"Here I am."* A Jewish clock that tells you where you stand in Hashem's time, with the ordinary clock alongside.

## What it shows

- **First visit: the journey.** It opens on a spiral of time rising slowly through the screen. Begin tilts it until you look down its axis; it closes into a circle and becomes the first ring, the 6th millennium. Tap the circle to step in, to the shemitah cycle, the year, the month, the week and Today, live, then into the hour. Each circle you came from stays around the current one as a thick outer ring. Replay it from Settings → The journey.
- **The parshah of the week** on the week circle, for Israel and the diaspora. Worked out from the calendar itself and checked Shabbos by Shabbos against Hebcal for 2000–2080 (8,348 readings, no differences).
- **A new hour** is marked gently: the center medallion turns to the next tribe and a small note slides up.
- **Gestures**: swipe left from the middle of the dial to step in one circle; swipe in from the edge of the screen to step out one.
- **The circles button** opens all seven circles nested one inside the other, each showing where you are; tap one to go there. **Today** is always one tap away.

The clock's job is orientation: where you stand in Jewish time and space. It is one dial you can climb into and out of.

- **Day** (the start): 24 *sha'os zmaniyos*, gold across the top from sunrise to sunset, blue underneath for the night. The regular clock sits inside, bent to fit. Each hour carries its month and tribe, shown as a band in the tribe's flag colors (Bamidbar Rabbah 2:7).
- **Inside an hour**: the ring is the hour itself, 60 zmani minutes filling as it passes. The tribe's emblem and name sit in the center; its month, letter, sense and mazal around it. Below: Yaakov's or Moshe's blessing, the tribe's story, flag, name, mother, stone, where it camped, the hour's planet, and the hour in Jewish and civil time.
- **Zoom out**: week (the days of Creation, Shabbos at the top), month (the moon's face day by day), year (the months with their tribes and flags), shemitah (the seven years and their tithes), and the 6,000 years (Sanhedrin 97a's three eras and the cosmic week).
- **The path** above the dial (and the scale under the dial) shows where you are; ‹ › walk sideways, and Back to now returns.
- **Space**: the dial becomes the camp around the Mishkan with the Beis Hamikdash at its center, the dot on the rim pointing to Yerushalayim, and the letter of each direction from Sefer Yetzirah 4:3 (פ north, ד east, ר south, כ west, ב above, ג below, ת the Holy Palace in the middle). Drag to turn it, face Yerushalayim, or connect it to the phone's compass.
- **Mosaic medallions** for the twelve tribes and the seven days, in the manner of an ancient synagogue floor: earthy stone grounds, ochre figures, fine tesserae, a tiled border, matched to the Midrash and to Bereishis 1.
- **The scale** under the dial shows every circle at once: millennium, shemitah, year, month, week, day, hour. Tap a row to turn the dial into that circle.
- **Zmanim** (in the day view): each in Jewish time ("3:00 of the day") and civil time, with Shabbos, Yom Tov and fast times.

## On your iPhone

**As an app icon:** open Hineni in Safari → Share → Add to Home Screen. Opens full screen once Hineni is on its own address.

**As a live widget:** `widget/hineni-widget.js` runs in the free [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) app.

1. Install Scriptable, open it, tap **+**, paste the whole file, and name it *Hineni*. Tap ▶ once and allow location.
2. Long-press the home screen → **+** → Scriptable → choose a size → **Add Widget**.
3. Long-press the new widget → **Edit Widget** → Script: **Hineni**.

It shows the day dial with the hand, the hour you're in and its tribe, the Hebrew date, minutes left in the hour and the next zman. Tapping it opens Hineni. iOS decides how often widgets refresh, so the hand can lag a few minutes.

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
- `js/parshah.js`: the weekly parshah
- `widget/hineni-widget.js`: the iPhone widget (Scriptable)
- `js/zmanim.js`: zmanim, the Jewish-day model, dial angles
- `js/hebrew.js`: Hebrew date (built-in browser calendar), gematria, month data
- `js/calendar.js`: holidays, Omer, molad, Kiddush Levanah, planetary hours
- `js/intro.js`: the opening spiral of time
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
