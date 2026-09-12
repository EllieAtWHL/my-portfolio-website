# Mobile Photo Upload - Plain-English Overview

## The problem this solves

Right now, adding a match photo album means: get home, plug into a laptop,
run some command-line tools to shrink the photos, copy them into a separate
folder on GitHub, and manually tell the database which match they belong to.
That's a lot of steps, and it means photos usually don't go up until well
after a match - sometimes days later - even though they're most exciting
right when the final whistle blows.

The goal is to be able to do this from a phone, on the way home from a
match: pick the photos taken that day, tap upload, and have the site handle
the rest - shrinking them down and putting them in the right place
automatically.

## Where things stand today

**The tricky, risky part has been tested and works.** A single photo taken
on a phone can be sent to the website, automatically shrunk down to a
sensible file size, and land in the right place, all without touching a
laptop. That was genuinely uncertain going in - phone photos are much
higher resolution than what a website needs, and the tool used to shrink
them (called `sharp`) is finicky about the kind of servers this site runs
on. Both of those are now confirmed to work.

**The full feature - actually using this day-to-day - isn't built yet.**
What's been tested so far only proves the plumbing works for one photo at a
time, driven through a throwaway test page that no longer exists. It
doesn't yet:

- let you pick and upload a whole album of photos at once
- tell the site which match those photos belong to
- give you a proper screen to do this from, in the admin area

That's the next piece of work (tracked as WEB-149 in Jira), and it'll build
on what's already been proven here rather than starting from scratch.

## Things worth knowing about, in plain terms

- **Uploading big photos over mobile signal takes a moment**, and if your
  phone's screen locks itself while that's happening, the upload can get
  cut off. The eventual feature should shrink photos *before* sending them
  from your phone, not after, to make this less likely - and probably
  upload one photo at a time rather than a whole album in one go, so a
  hiccup on one photo doesn't ruin the rest.
- **The photo storage system (a separate GitHub repository) automatically
  regenerates its listing whenever new photos are added** - this is already
  how the desktop process works, and testing confirmed it will keep working
  the same way for phone uploads too.
- Signing in to test this on a preview version of the site (before it's
  live) needed a small one-off setting change; day-to-day use of the real,
  live site is unaffected by this.

## Where to look for more detail

- Technical write-up of exactly what was tested and fixed: see the "Mobile
  upload pipeline" section further up in this same folder's `README.md`.
- Full findings and testing log: WEB-148 on Jira.
- The feature that will actually be usable day-to-day: WEB-149 on Jira.
