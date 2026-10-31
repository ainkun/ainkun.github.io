# Yorimichi Shrine: the same hilltop shrine, three times of day

The Side Quests backgrounds (`side-quests.html`, `manga.html`, `review.html`, `travel.html`). The owner generated them with **Gemini** on 2026-10-31 from the prompts below: the morning first, with `assets/morning-street.png` attached as a style reference, then evening and night as edits of the chosen morning image, so all three keep the same composition. A ChatGPT set (morning and evening only) was also made and is not used. Both sets stay outside the repository, in `D:\portfolio\quest2` (Gemini, used) and `D:\portfolio\quest1` (ChatGPT).

Since 2026-11-01 the paintings in use have a small ema rack painted in beside the torii; see [The ema rack](#the-ema-rack-2026-11-01) below. The first paintings, without the rack, are kept as the `*-shrine-bare.webp` files: they show behind the quest board when it opens.

| Scene | File (without the rack) | Gemini source | Local time |
| --- | --- | --- | --- |
| Morning / 朝 | `morning-shrine-bare.webp` | `Gemini_Generated_Image_tqj6ostqj6ostqj6.jpg` | 05:00–16:59 |
| Evening / 夕暮れ | `evening-shrine-bare.webp` | `Gemini_Generated_Image_co15o8co15o8co15.jpg` | 17:00–19:59 |
| Night / 夜 | `night-shrine-bare.webp` | `Gemini_Generated_Image_dgqe2ndgqe2ndgqe.jpg` | 20:00–04:59 |

The 2752×1536 JPEGs were converted to WebP at quality 86 with Pillow (`method=6`), keeping their size: 444, 387 and 307 KB instead of about 2.5 MB each, with no visible difference at 100%. Gemini's small mark in the bottom-right corner is left as generated. Composition: the torii stands in the right third (its centre about 68% across), the left side stays open sky over the town for the title, and the sacred tree with its shimenawa frames the right edge. Wide screens show the whole painting. On the shrine grounds, tall screens draw it 115% high, aligned to the bottom and centred on the ema rack (`side-quests.css`).

To replace a scene, see [Replacing a painting or a video](#replacing-a-painting-or-a-video): the rack's clip, band, mask and first frame are made from each painting. To try the ChatGPT set, it would need the rack painted in the same way (and a night image).

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

## The ema rack (2026-11-01)

The quest board became a small ema rack (絵馬掛所) standing in the painting, just left of the torii: the owner asked for the board to blend into the background rather than crowd the scene. Clicking it walks up to the rack up close, and its three ema swing on their cords.

| Scene | File (in use) | Gemini source in `D:\portfolio\quest3` | Swinging-ema video in `D:\portfolio\quest3` |
| --- | --- | --- | --- |
| Morning | `morning-shrine.webp` | `morning_Gemini_Generated_Image_3dwojh3dwojh3dwo.jpg` | `morning_1080_Animating_shrine_image_gently_in…_0011f9ca_1080p.mp4` |
| Evening | `evening-shrine.webp` | `evening_Gemini_Generated_Image_sa2p54sa2p54sa2p.jpg` | `evening_1080_Wooden_ema_swaying_in_breeze_fd7f8176_1080p.mp4` |
| Night | `night-shrine.webp` | `night_Gemini_Generated_Image_gew58lgew58lgew5.jpg` | `night_1080_Wooden_ema_swinging_in_breeze_2405ff86_1080p.mp4` |

Gemini's first morning video, at 720p, was not used: it was soft and re-drew the rack.

### The rack up close (ChatGPT)

`ema-rack.webp` (the rack, empty) and `ema.webp` (one blank ema, used for each quest) come from the owner's ChatGPT pictures `D:\portfolio\Weathered Wooden Ema Rack with Mossy Stone Bases.png` and `Blank Wooden Ema Plaque with Red-White Cord.png`. ChatGPT was used because it makes transparent backgrounds. Both prompts had the Gemini morning scene (`quest2\Gemini_Generated_Image_tqj6ostqj6ostqj6.jpg`) attached as the style reference.

> Use the attached image only as a style reference. Match its hand-painted Japanese anime background style, soft brushwork, warm colors and level of detail. Do not copy its scene.
>
> Create a single object on a fully transparent background: a small freestanding ema rack (絵馬掛け) from a Japanese shrine.
> - Two square wooden posts standing on low, mossy stone footings.
> - A horizontal wooden rail between the posts, about two thirds of the way up, with five small hooks spaced evenly along it. The hooks are empty: no ema or plaques hang on the rack.
> - A small gabled roof on top, made of dark weathered wood with a thin copper-green edge.
> - Natural wood, slightly faded by sun and rain.
>
> Seen straight from the front at eye level, centered, with the whole object visible and empty space around it. Soft, even daylight. No ground, floor, cast shadow or background. No text, letters, symbols or logos. Landscape format.

> Use the attached image only as a style reference. Match its hand-painted Japanese anime background style, soft brushwork, warm colors and level of detail. Do not copy its scene.
>
> Create a single object on a fully transparent background: one blank ema, the small wooden prayer plaque from a Japanese shrine.
> - A flat plaque a little wider than it is tall, with a pointed, roof-shaped top edge, like a small house.
> - Light natural wood with soft grain and slightly rounded edges.
> - A red-and-white twisted cord goes through a small hole near the top and forms a short loop above the plaque.
> - The face is completely blank: no writing, drawings or symbols.
>
> Seen straight from the front, flat and not tilted, centered, with empty space around it. Soft, even daylight. No shadow and no background. Square format.

### The rack painted into the scenes (Gemini)

The ChatGPT rack, laid on the painting, looked pasted on, so Gemini painted it into each scene.

**Morning:** attach the morning scene (`quest2\Gemini_Generated_Image_tqj6ostqj6ostqj6.jpg`) first, then the rack picture.

> Edit the first image. Keep its aspect ratio, viewpoint, composition and hand-painted Japanese anime background style exactly as they are. Do not move, redesign or remove anything.
>
> Add one object: a small ema rack (絵馬掛け), designed like the one in the second image (two vermilion posts on mossy stone footings, a small dark wooden roof with a copper-green edge, and one horizontal rail with hooks), but painted in the first image's style, as if it had always been part of this painting.
> - Place it on the stone ground just to the left of the torii's left post, in front of the row of small stone lanterns at the edge of the terrace.
> - It stands upright on the ground, facing the viewer, about as tall as a person: a little taller than the small stone lanterns beside it, much smaller than the torii.
> - Three blank wooden ema hang from its rail, on the left, middle and right hooks, each on a red-and-white cord. No writing or drawings on them.
> - Light it like the rest of the scene: the same morning sunlight from the same direction, the rack's soft shadow on the ground, and a little moss and grass around its footings.
>
> Change nothing else. No people, animals or text.

**Evening:** attach the evening scene (`quest2\Gemini_Generated_Image_co15o8co15o8co15.jpg`) first, then the new morning picture.

> Edit the first image. Keep everything in it exactly as it is: aspect ratio, viewpoint, composition, colors and style.
>
> Add the small ema rack with its three blank ema exactly as it appears in the second image: the same design, the same place left of the torii, the same size. Paint it in the first image's light: warm golden sunset light from the low sun, a warm rim light on its posts and ema, and a long soft shadow on the ground.
>
> Change nothing else. No people, animals or text.

**Night:** attach the night scene (`quest2\Gemini_Generated_Image_dgqe2ndgqe2ndgqe.jpg`) first, then the new morning picture.

> Edit the first image. Keep everything in it exactly as it is: aspect ratio, viewpoint, composition, colors and style.
>
> Add the small ema rack with its three blank ema exactly as it appears in the second image: the same design, the same place left of the torii, the same size. Paint it in the first image's night light: cool moonlight on the roof and posts, and the warm glow of the nearby stone lanterns falling on its three ema so they are softly lit.
>
> Change nothing else. No people, animals, fireflies or text.

### The swinging ema (Gemini video, 1080p, 16:9, sound off)

Each video starts from that time's painting with the rack.

**Morning:**

> Animate this image into a short, calm background loop. The camera is locked: no zoom, pan, tilt, shake or change of framing. Every object stays exactly where it is and keeps its exact shape and colors.
>
> Only small, gentle, back-and-forth motion, as in a light breeze:
> - the three ema on the small ema rack sway slowly on their cords;
> - the leaves of the trees rustle softly;
> - the white paper streamers on the torii's rope flutter a little.
>
> Nothing falls, flies or enters the frame. No people, animals, insects or text. The last moment should look like the first, so it can repeat without a jump.
>
> Keep the ema rack and its three ema exactly as drawn; they only swing gently on their cords.

(The last line was added for the 1080p version.)

**Evening:**

> Animate this image into a short, calm 16:9 background loop at 1080p. The camera is completely locked: no zoom, pan, tilt, shake or change of framing. Keep the image exactly as it is: every object stays in the same place with the same shape, colors and painted style, and the warm sunset light stays exactly the same, with no flicker or change in brightness.
>
> The only motion: the three blank wooden ema hanging on the small ema rack left of the torii swing slowly and smoothly back and forth on their cords, as in a gentle evening breeze, each slightly out of step with the others. They stay blank, keep their exact shape and color, and stay attached to their hooks. The ema rack itself does not move.
>
> Nothing else moves, falls or enters the frame: no people, animals, birds, insects, falling leaves or text. The last moment looks like the first, so the clip can repeat without a jump. No sound.

**Night:**

> Animate this image into a short, calm 16:9 background loop at 1080p. The camera is completely locked: no zoom, pan, tilt, shake or change of framing. Keep the image exactly as it is: every object stays in the same place with the same shape, colors and painted style. The moonlight and the lantern light stay exactly the same: the stone lanterns glow steadily, with no flicker or change in brightness.
>
> The only motion: the three blank wooden ema hanging on the small ema rack left of the torii swing slowly and smoothly back and forth on their cords, as in a gentle night breeze, each slightly out of step with the others. They stay blank, keep their exact shape and color, and stay attached to their hooks. The ema rack itself does not move.
>
> Nothing else moves, falls or enters the frame: no people, animals, birds, insects, fireflies, falling leaves or text. The last moment looks like the first, so the clip can repeat without a jump. No sound.

### How the clips, bands and masks were made

The videos keep their paintings' framing: video = painting × 0.703125, with 8 px trimmed on the left. Each clip is the video's 452×516 box at (700, 466), placed on the painting by `.scene-clip` in `side-quests.css`. AI video trembles by a pixel or two from frame to frame, even in parts that should be still, so every clip is smoothed over a few frames, and only the ema move.

- **Morning** (`morning-rack.mp4`, 4.8 s, 149 KB): only a soft band around the ema keeps the video's motion; the rest of the box is the clip's still first frame. Colours are matched to the painting. The painting holds that first frame across the clip's box, fading out around it.
- **Evening and night** (`evening-rack.mp4`, 6.3 s, 175 KB; `night-rack.mp4`, 6.6 s, 150 KB): Gemini re-lit these scenes (the evening lost its golden glow on the rack), so only the band where the ema, their cords and the rings on the rail move comes from the video, found from the measured motion. The rest stays the painting, at full sharpness. The band's colours are matched to the painting, and the painting's own light is carried in around its edge. These ema swung about 2.5× (evening) and 1.6× (night) as fast as the morning's, so they play at half speed. Each loop crossfades into its own start and begins with the ema hanging still. `*-rack-band.webp` is the band's soft mask, and the painting holds the clip's first frame inside it. So the evening and night paintings show Gemini's rings and straps where the ema hang (the first paintings had metal clips).
- **Masks** (`*-rack-mask.webp`): the painting with the rack minus the bare painting, rebuilt from the rack's parts (posts, rail, roof, the three ema and cords, footings). White, with the shape in the alpha channel, 284×334 over the rack's button grown by 3% (the painting's box from (1043, 695) to (1612, 1363)). They give the hover light and the gust's glint the rack's own shape.

### Replacing a painting or a video

The scripts that made these are kept outside the repository in `D:\portfolio\tools\shrine-clips\`, with notes. Each rebuilds its painting from the Gemini original, so it can be rerun. A new painting must keep the rack where it is (38.5–58% across, 46.5–87.5% down), or the button, masks and clips move with it.

## Sample art (見本)

The placeholder manga cover and pages, review covers and screenshots, and travel photos in `assets/manga/sample-manga/`, `assets/reviews/` and `assets/travel/` were drawn with Pillow for the preview and are marked 見本 / SAMPLE. Replace them with real content; the steps are in the README's Side Quests section. `assets/manga/a-date-with-prime-numbers/` is real: the owner's one-shot, converted from its page images.
