# Tests

`e2e.js` uses Hineni from beginning to end the way a new visitor does, on an iPhone-sized screen at full sharpness:
the spiral, Begin, every step of the journey with real taps, the end of the journey, then the app itself (stepping in
and out, every rung of the ladder, three quick taps in a row, Today, Space, Settings with Copy the widget, Location,
Clean view) and a minute of waiting. At each step it checks where you are, takes a screenshot, and adds up the
graphics memory the dial's layers need: the measure that matters on iPhones, where too much makes Safari close the page.

    npm i -g playwright && npx playwright install chromium   # once
    node tests/e2e.js [folder-for-screenshots]

It ends with `ALL PASSED` or a list of what failed, any page errors, and the peak memory. Run it before every push.
