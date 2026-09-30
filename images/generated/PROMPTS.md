# Generated game textures

Generated with the built-in Imagegen tool on 2026-09-30. Runtime albedos are 1024px WebP; the leaf and normal/roughness maps are 512px WebP. The leaf preserves alpha. Original PNGs remain in the Codex generated_images folder. Each material has its own image. Brick, rock and vine normal/roughness maps are approximate luminance-derived maps, not measured material scans.

`tools/prepare-textures.py` exports the four source PNGs in this order: brick, rock, leaf, vine. Do not replace the original well wall textures.

## brick

Use case: photorealistic-natural. Asset type: game material base-color/albedo texture for one old solid protruding stone brick in a damp Thai forest well. Generate a square 1024x1024 seamless tile filling the entire frame with warm gray sandstone surface, small pits, subtle mineral grain and weathered hairline cracks, sparse moss green damp stains mostly at the margins. Face-on orthographic macro material scan, uniform neutral diffuse light, no directional lighting or shadows. NO masonry layout, NO multiple bricks, NO mortar, NO visible outer brick shape or bevel, NO perspective, NO objects, NO text. This texture wraps one rounded rectangular climbing brick, visually distinct from the surrounding wall. Detailed realistic stone, moderate contrast.

Source PNG: C:\Users\aspir\.codex\generated_images\01a0f296-702e-7880-aaaf-a9c1a600a899\exec-68dae1f5-eabf-475f-803b-2cb077d2d2b5.png

## rock

Use case: photorealistic-natural. Asset type: square 1024x1024 seamless game albedo surface texture for irregular limestone rocks in a damp abandoned tropical well. Entire image is gray brown rough limestone with moss growing in fine cracks, lichen speckles, naturally varied mineral grains. Flat orthographic face-on scan with diffuse neutral light, no baked shadows. NO masonry arrangement, NO mortar, NO individual rock silhouette or background, NO text, NO perspective. Subtle moss patches, realistic fine surface details, all four edges tile.

Source PNG: C:\Users\aspir\.codex\generated_images\01a0f296-702e-7880-aaaf-a9c1a600a899\exec-daf046b2-813f-4a12-8811-8e8af372d8ab.png

## leaf

Use case: photorealistic-natural. Asset type: game foliage cutout RGBA texture. Generate a single tropical ivy heart-shaped green leaf with pointed tip facing UP and a short slim petiole pointing DOWN, centered, occupying 85 percent of a square 1024x1024 canvas. Realistic rich green botanical leaf, crisp fine branching veins, slightly irregular organic edge, subtle yellow-green vein midrib and small natural blemishes. Straight-on orthographic front view, flat neutral diffuse lighting, no perspective or shadow, no glow. True transparent background with clean alpha around entire leaf and stem, no white matte, no checkerboard artwork, no text, no extra leaves or objects. Suitable for a double-sided textured curved mesh in a semi-realistic game.

Source PNG: C:\Users\aspir\.codex\generated_images\01a0f296-702e-7880-aaaf-a9c1a600a899\exec-b9ca7503-831c-443d-a43f-4bd0908ae279.png

## vine

Use case: photorealistic-natural. Asset type: square 1024x1024 seamless bark albedo surface texture for slender hanging jungle vines and woody climbing lianas. Full-frame dark umber olive-brown fibrous bark with narrow longitudinal ridges running vertically, tiny cracks, occasional sparse moss flecks. Uniform neutral diffuse light, realistic detailed surface scan, no directional shadows. NOT an isolated branch, no silhouette, no scene, no leaves, no rope or manufactured weaving, no text, no perspective. Tile seamlessly at all four edges, especially top-bottom for long curved tube meshes.

Source PNG: C:\Users\aspir\.codex\generated_images\01a0f296-702e-7880-aaaf-a9c1a600a899\exec-74f62936-ebe8-44e0-949a-a0f0b7ee9a67.png
