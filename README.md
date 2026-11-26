# Hineni · הִנֵּנִי

*"Here I am."* A Jewish clock for orienting yourself in Jewish time and space: where you stand in the hour, the day, the week, the month, the year, the shemitah cycle and the six thousand years.

**Open it:** https://maxatrilion1.github.io/hineni/

Created by [Maxatrilion1](https://github.com/Maxatrilion1).

## What it is

- **One dial you can climb into and out of.** The day is home: 24 *sha'os zmaniyos*, gold across the top from sunrise to sunset, blue beneath for the night, with the ordinary clock bent to fit inside. Tap the gold to step in (into the hour); tap outside the circle to step out (to the week, the month, the year, the shemitah cycle, the 6,000 years).
- **Each hour has its month and tribe**, shown in the tribe's flag colors (Bamidbar Rabbah 2:7), with its energy, focus, pasuk, the tribe's story and where it camped.
- **Each page** opens with a box about the circle you are in, then **Here I am**: the ladder of circles from 5,787 of 6,000 down to this hour. Tap any rung to go there.
- **Sourced.** Text with a faint dotted underline has a source: tap it to see it.
- **The journey.** The first visit begins with a spiral of time that lands as the nested circles of time, and walks you in from the outside, step by step. Replay it from Settings.
- **Space.** The dial becomes the camp around the Mishkan with the Beis Hamikdash at its center, pointing to Yerushalayim, with the Hebrew directions, the angels of the bedtime Shema, and the six directions sealed in Sefer Yetzirah. Turn it by hand or with the phone's compass.
- **Zmanim** for where you are.

## Shitah

Alter Rebbe (Chabad): hours from sunrise to sunset, dawn at 16.1°, nightfall at 6°, Israel locations keep one day of Yom Tov. Candle lighting 18 minutes before sunset (40 in Jerusalem, 30 in Haifa). Times are for sea level and may differ from your shul's luach by a minute or two; don't rely on them to the last minute.

## Privacy

Your location is used only on your device to work out the times. Nothing about you is sent anywhere.

## Install

- **iPhone:** open the link in Safari → Share → Add to Home Screen.
- **Android:** open the link in Chrome → ⋮ → Add to Home screen (or Install app).
- **Computer:** in Chrome or Edge, click the install icon in the address bar.
- **iPhone widget:** install the free [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) app, paste in [`widget/hineni-widget.js`](widget/hineni-widget.js), name it Hineni, and add a Scriptable widget (home screen or lock screen) set to that script.

## How it's built

Plain HTML, CSS and JavaScript, no build step and no dependencies: open `index.html` from any static host. The sun's position follows NOAA's algorithm; the Hebrew date uses the browser's Hebrew calendar; the parshah is worked out from the calendar and was checked Shabbos by Shabbos against Hebcal for 2000–2080 (8,348 readings, Israel and the diaspora, no differences).
