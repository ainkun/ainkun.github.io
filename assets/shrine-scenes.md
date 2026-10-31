# Yorimichi Shrine: the same hilltop shrine, three times of day

The Side Quests backgrounds (`side-quests.html`, `manga.html`, `review.html`, `travel.html`). The owner generated them with **Gemini** on 2026-10-31 from the prompts below: the morning first, with `assets/morning-street.png` attached as a style reference, then evening and night as edits of the chosen morning image, so all three keep the same composition. A ChatGPT set (morning and evening only) was also made and is not used. Both sets stay outside the repository, in `D:\portfolio\quest2` (Gemini, used) and `D:\portfolio\quest1` (ChatGPT).

| Scene | File | Gemini source | Local time |
| --- | --- | --- | --- |
| Morning / 朝 | `morning-shrine.webp` | `Gemini_Generated_Image_tqj6ostqj6ostqj6.jpg` | 05:00–16:59 |
| Evening / 夕暮れ | `evening-shrine.webp` | `Gemini_Generated_Image_co15o8co15o8co15.jpg` | 17:00–19:59 |
| Night / 夜 | `night-shrine.webp` | `Gemini_Generated_Image_dgqe2ndgqe2ndgqe.jpg` | 20:00–04:59 |

The 2752×1536 JPEGs were converted to WebP at quality 86 with Pillow (`method=6`), keeping their size: 444, 387 and 307 KB instead of about 2.5 MB each, with no visible difference at 100%. Gemini's small mark in the bottom-right corner is left as generated. Composition: the torii stands in the right third (its centre about 68% across), the left side stays open sky over the town for the title, and the sacred tree with its shimenawa frames the right edge. Wide screens show the whole painting; tall screens draw it at 115% height aligned to the bottom, so the torii's beams arch over the top (`side-quests.css`).

To replace a scene, keep the file name. To try the ChatGPT set, convert its files the same way under the same names (it has no night image yet).

## Morning prompt (attach `morning-street.png`)

Use the attached image only as a style reference. Match its hand-painted Japanese anime background style, soft brushwork, level of detail and calm, warm colors. Do not copy its street or its composition.

Create a wide 16:9 landscape background painting: a small, peaceful neighborhood shrine on a wooded hilltop above a quiet Japanese town, on a clear morning.

Composition:
- We stand on the shrine grounds at the top of the hill, looking out through the shrine gate toward the town below.
- In the right third of the image (its center about two-thirds of the way across) stands a weathered vermilion torii gate with a black top beam. It is the main focal point. A thick straw shimenawa rope with white zigzag paper streamers (shide) hangs across it. Just beyond the torii, mossy stone steps go down the hillside toward the town. Leave open sky above the torii: its top beam sits about a quarter of the way down from the top edge.
- A pair of old stone lanterns (ishidoro) stands beside the top of the steps. Smaller ones continue down beside the steps.
- At the far right edge: part of a huge old sacred tree, wrapped with a shimenawa rope and white paper streamers. Its leafy branches hang over the top-right corner.
- The left 40% of the image stays calm, open and uncluttered, because large website text will sit over it: soft sky, and far below the hill a small residential town of low two-story houses with tiled roofs, narrow streets and utility poles, then green hills and soft mountains on the horizon. No tall buildings.
- Foreground: worn stone paving and gravel with patches of moss and a few fallen leaves. Keep the bottom edge simple.

Light: fresh, clear morning sunlight with soft clouds. Light morning mist drifts over the town below and between the trees, gentle sunbeams come through the leaves, and dew shines on the moss.

Mood: the same warm, wholesome world as the reference street, but a little quieter and more sacred. Deeper greens of old trees, with the torii's vermilion as the one strong accent color.

No people, animals or insects. No text or writing anywhere: the torii has no plaque, or a blank one. No signs, logos, watermark, neon or cyberpunk. Highest resolution available.

## Evening prompt (attach the morning shrine image)

Edit this exact image. Keep the same aspect ratio, viewpoint and composition. The torii, rope and paper streamers, stone steps, stone lanterns, sacred tree, paving, town, hills and mountains stay in exactly the same positions. Do not redesign, move, add or remove anything. Keep the same hand-painted Japanese anime background style.

Only change the sky, the light and shadows, and the glow of the lanterns and windows. Turn the morning into a peaceful golden-hour sunset. The sky is soft peach, apricot and rose with gently glowing clouds, and the low sun sits near the horizon, seen through the torii. Warm golden rim light touches the torii, the trees and the lanterns, with long soft shadows across the steps and paving. The stone lanterns have just been lit with a small warm glow, and a few windows in the town below begin to light up. The morning mist is gone. Calm and nostalgic; avoid an intense orange filter.

No people, animals or insects. No text, logos or neon.

## Night prompt (attach the morning shrine image)

Edit this exact image. Keep the same aspect ratio, viewpoint and composition. The torii, rope and paper streamers, stone steps, stone lanterns, sacred tree, paving, town, hills and mountains stay in exactly the same positions. Do not redesign, move, add or remove anything. Keep the same hand-painted Japanese anime background style.

Only change the sky, the light and shadows, and the glow of the lanterns and windows. Turn the morning into a peaceful clear night. The sky is a deep, muted indigo with a few small stars and a bright moon high in the sky to the right of center, not in the left part of the image. Cool blue moonlight falls on the torii, the rooftops and the tree edges. The stone lanterns glow warm amber, casting soft pools of light on the steps and moss. The town below twinkles with scattered warm window lights and a few street lamps. The torii stays a deep vermilion in the moonlight. Restrained navy, sage and amber palette; quiet and safe. The morning mist is gone.

No people, animals or insects (no fireflies). No text, logos or neon. No added lanterns or buildings.

## Sample art (見本)

The placeholder manga cover and pages, review covers and screenshots, and travel photos in `assets/manga/`, `assets/reviews/` and `assets/travel/` were drawn with Pillow for the preview and are marked 見本 / SAMPLE. Replace them with real content; the steps are in the README's Side Quests section.
