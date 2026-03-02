# Assignment 4 - Lighting

**Ethan Cao - CSE 160**

run by
```bash
python3 -m http.server 8888
```

open `http://localhost:8888/asg4.html`

## Features

- Phong shading (ambient + diffuse + specular)
- Point light with orbit animation and slider control
- Spotlight with on/off toggle
- Normal visualization mode
- Sphere with proper normals
- OBJ model loading
- Light color slider (RGB)
- 32x32 textured voxel world from asg3

## Controls

- **W/A/S/D** - Move
- **Q/E** - Turn
- **Mouse** - Look around (click canvas first)
- **Left Click** - Place block
- **Right Click** - Remove block
- **Keys 1-6** - Select block type
- **ESC** - Release mouse

## Files

- `asg4.html` - Main page
- `asg4.js` - Game logic + lighting
- `Camera.js` - Camera system
- `Chunk.js` - Chunk rendering with normals
- `texture_atlas.png` - Block textures
- `model.obj` - OBJ model (optional)
- `lib/` - WebGL libraries
