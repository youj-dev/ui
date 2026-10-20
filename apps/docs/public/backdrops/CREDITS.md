# Backdrop photographs

The photographic backdrops behind the docs' block previews (the Seaglass and Heather backdrops on `/docs/backdrops`). Each file is a 2400 × 1500 WebP, cropped to 16:10, softened (a gaussian blur, slightly longer in one direction so it streaks like a pan), and colour-graded toward the Wada combination of its preset. The grain is added in CSS, not baked in. They are docs assets only: the packages don't ship them.

All four are used under the [Unsplash License](https://unsplash.com/license): free to use, including commercially, with no permission needed. Credit isn't required, but it's given here. None of them is an Unsplash+ image, and none shows a person or a brand.

| File | Photograph | Photographer | Source |
| --- | --- | --- | --- |
| `seaglass-light.webp` | Calm sea under golden clouds: a long exposure at dawn | [Jonathan Bean](https://unsplash.com/@jonathanbean) | [unsplash.com/photos/ywnnwzcdR5o](https://unsplash.com/photos/calm-sea-under-golden-clouds-ywnnwzcdR5o) |
| `seaglass-dark.webp` | Body of water: a long exposure of a dark blue wave | [Regine Tholen](https://unsplash.com/@designbytholen) | [unsplash.com/photos/OSKCUpGVXv4](https://unsplash.com/photos/body-of-water-OSKCUpGVXv4) |
| `heather-light.webp` | A field of heather with the sun shining behind it | [Jisca Lucia](https://unsplash.com/@wanderlandjournal) | [unsplash.com/photos/_YIhjRB16aU](https://unsplash.com/photos/a-field-full-of-purple-flowers-with-the-sun-shining-in-the-background-_YIhjRB16aU) |
| `heather-dark.webp` | A field of heather at dusk | [Chiara Wolf](https://unsplash.com/@wanderwolves) | [unsplash.com/photos/p_RHVffaclk](https://unsplash.com/photos/a-field-of-purple-flowers-p_RHVffaclk) |

The palettes they're graded toward come from Sanzo Wada's *A Dictionary of Color Combinations* (1933–34): combination 302 for Seaglass and 162 for Heather. Only the colour data was used, by way of the community dataset [mattdesl/dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations).

To replace one, keep the file name and the size, keep each WebP under 300 KB, and update this table.
