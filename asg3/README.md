# Assignment 3 - First-Person World Explorer

**Ethan Cao - CSE 160**


run by
```bash
python3 -m http.server 8888
```

open `http://localhost:8888/asg3.html`

Controls

- **W/A/S/D** - Move
- **Q/E** - Turn
- **Mouse** - Look around (click canvas first)
- **Left Click** - Place block
- **Right Click** - Remove block
- **Keys 1-6** - Select block type


objective:
find and collect all the Lucky Blocks to win!

## Features

- 32×32 textured voxel world
- First-person camera with mouse/keyboard controls
- 6 block types (Lucky, Grass, Dirt, Stone, Wood, Pumpkin)
- Block building/removing
- Lucky block collection game
- Chunk-based rendering for 60 FPS

## Files

- `asg3.html` - Main page
- `asg3.js` - Game logic
- `Camera.js` - Camera system
- `Chunk.js` - Rendering system
- `texture_atlas.png` - Textures
- `lib/` - WebGL libraries
