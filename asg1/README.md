# Assignment 1 - WebGL Paint & Shapes

A WebGL-based paint program that allows users to draw shapes interactively on an HTML canvas.

## Features

### Basic Features (Required)
- ✅ HTML canvas with WebGL rendering
- ✅ Click to draw shapes (points, triangles, circles)
- ✅ Click and drag to paint continuously
- ✅ Mode buttons to switch between Points, Triangles, and Circles
- ✅ RGB color sliders to control shape colors
- ✅ Size slider to adjust shape/brush size
- ✅ Circle segments slider (3-30 segments)
- ✅ Clear canvas button
- ✅ Organized code structure with dedicated functions:
  - `setupWebGL()` - Initialize WebGL context
  - `connectVariablesToGLSL()` - Link JavaScript variables to GLSL shaders
  - `renderAllShapes()` - Render all shapes from the shapes list
  - `handleMouseDown/Move/Up()` - Mouse event handlers
- ✅ Object-oriented shape classes (Point, Triangle, Circle) with `render()` methods
- ✅ Single `shapesList` array to store all shapes

### Custom Picture
- ✅ "Draw My Picture" button displays a custom design
- ✅ Features initials "EB" prominently in the design (you should update to your own initials)
- ✅ Uses 30+ triangles with multiple colors
- ✅ Includes decorative elements around the letters

### Awesome Features (Extra Credit)
1. **Smooth Stroke Interpolation** ✨
   - Automatically fills gaps during mouse drag by interpolating points between cursor positions
   - Creates smoother, more natural-looking strokes without disconnected shapes
   - Works seamlessly in the background for all drawing modes

## How to Run

1. Open a terminal in the `asg1` directory
2. Start a local web server:
   ```bash
   python3 -m http.server 8080
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:8080/asg1.html
   ```

## File Structure

```
asg1/
├── asg1.html          # Main HTML page with UI controls
├── asg1.js            # Main JavaScript with WebGL setup and logic
├── Point.js           # Point shape class
├── Triangle.js        # Triangle shape class
├── Circle.js          # Circle shape class
└── README.md          # This file
```

## Code Organization

The code follows a clean, modular structure:

- **Shaders**: VSHADER_SOURCE and FSHADER_SOURCE define vertex and fragment shaders
- **Global Variables**: WebGL context, GLSL variable references, and drawing settings
- **Initialization**: `main()` orchestrates setup and event registration
- **Shape Classes**: Each shape type is a class with a `render()` method
- **UI Controls**: Functions to handle sliders, buttons, and color updates
- **Mouse Handling**: Smooth drag-to-paint with optional interpolation

## Grading Checklist

| Feature | Points | Status |
|---------|--------|--------|
| HTML page with canvas | 0.5 | ✅ |
| Draw shape on click | 0.5 | ✅ |
| Organized code functions | 0.5 | ✅ |
| RGB color sliders | 0.5 | ✅ |
| Size slider | 0.5 | ✅ |
| Single shapesList with classes | 0.5 | ✅ |
| Clear canvas button | 0.5 | ✅ |
| Draw on mouse drag | 1.0 | ✅ |
| Triangle button/mode | 0.5 | ✅ |
| Circle button/mode | 1.0 | ✅ |
| Circle segments slider | 0.5 | ✅ |
| Draw custom picture | 1.5 | ✅ |
| Site link in submission | 0.5 | ⏳ |
| Awesomeness | 0-1.5 | ✅ |

## Author

Ethan - CSE 160 Assignment 1

## Notes for Grader

**Awesome Feature Implemented:**
**Smooth Stroke Interpolation** - The program automatically interpolates additional points between mouse positions during drag operations, creating smooth continuous lines instead of disconnected shapes during fast mouse movement. This makes the paint program feel much more natural and polished.

The custom picture features the initials "EB" created with 30+ colored triangles (pink/purple for letters, blue for decoration). (Note: Update these to your own initials before submission)

