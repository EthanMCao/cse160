# Assignment 1 - Quick Start Guide

## 🎉 Your assignment is complete and pushed to GitHub!

## What's Been Completed

✅ **All Basic Requirements (8.5/10 points)**
- HTML canvas with WebGL
- Point, Triangle, and Circle drawing modes
- RGB color sliders
- Size and segments sliders
- Clear canvas button
- Click and drag drawing
- Clean code organization with proper functions
- Shape classes with render() methods

✅ **Custom Picture (1.5/10 points)**
- 29 triangles forming the letters "E" and "T"
- Colorful design with decorative elements
- "Draw My Picture" button

✅ **Awesome Features (up to 1.5/10 points)**
- Smooth stroke interpolation (fills gaps during drag)
- Alpha transparency control
- Eraser tool

## 📝 What You Need to Personalize

### 1. Update Your Name
In `asg1.html`, line ~12, replace:
```html
<p><strong>Created by:</strong> [Your Name Here]</p>
```

### 2. Update Your Initials (IMPORTANT!)
In `asg1.js`, the `drawPicture()` function currently draws "ET". 
You need to:
1. Sketch your own initials on graph paper with triangles
2. Update the `drawPicture()` function with YOUR coordinates
3. Make sure you have at least 20 triangles
4. The example has 29 triangles to give you a reference

### 3. Update README
In `README.md`, update the author section with your name.

## 🚀 How to Test Locally

1. Navigate to the asg1 directory:
```bash
cd /Users/ethan/Documents/cse160/asg1
```

2. Start a local web server:
```bash
python3 -m http.server 8080
```

3. Open your browser to:
```
http://localhost:8080/asg1.html
```

## 🌐 Deploy to GitHub Pages

1. Go to your GitHub repository: https://github.com/EthanMCao/cse160

2. Click "Settings" → "Pages"

3. Under "Source", select "main" branch and click "Save"

4. Wait a few minutes, then your site will be available at:
```
https://ethanmcao.github.io/cse160/asg1/asg1.html
```

5. **IMPORTANT**: Submit this link as a comment on your Canvas submission!

## 📦 What to Submit on Canvas

1. Zip the entire asg1 folder:
```bash
cd /Users/ethan/Documents/cse160
zip -r Ethan_Cao_Assignment_1.zip asg1/
```

2. Upload the zip file to Canvas

3. **Add your GitHub Pages link as a comment** on the submission

## 🎨 Features to Test

1. **Paint with different shapes** - Try Points, Triangles, and Circles
2. **Change colors** - Use the RGB sliders
3. **Adjust size** - Make shapes bigger or smaller
4. **Circle segments** - See how it affects circle smoothness
5. **Transparency** - Try painting with semi-transparent colors
6. **Smooth stroke** - Toggle on/off to see the difference
7. **Eraser** - Fix any mistakes
8. **Clear canvas** - Start fresh
9. **Draw My Picture** - See your initials design

## 🐛 Troubleshooting

**Canvas is blank:**
- Check the browser console (F12) for errors
- Make sure the lib/ folder is present with all .js files

**Can't draw:**
- Make sure you're clicking on the black canvas area
- Try clicking a different shape mode button

**Picture doesn't look right:**
- Open asg1.js and modify the drawPicture() function
- Adjust the triangle coordinates

## 📊 Grading Checklist

- [ ] HTML page with canvas (0.5 pts) ✅
- [ ] Draw shape on click (0.5 pts) ✅
- [ ] Organized code functions (0.5 pts) ✅
- [ ] RGB color sliders (0.5 pts) ✅
- [ ] Size slider (0.5 pts) ✅
- [ ] Single shapesList with classes (0.5 pts) ✅
- [ ] Clear canvas button (0.5 pts) ✅
- [ ] Draw on mouse drag (1.0 pts) ✅
- [ ] Triangle button/mode (0.5 pts) ✅
- [ ] Circle button/mode (1.0 pts) ✅
- [ ] Circle segments slider (0.5 pts) ✅
- [ ] Draw custom picture (1.5 pts) ✅ (but personalize initials!)
- [ ] Site link in Canvas submission (0.5 pts) ⏳ (you need to do this)
- [ ] Awesomeness (0-1.5 pts) ✅

## 🎯 Expected Score: 10/10 (A+)

Make sure to:
1. ✏️ Personalize with YOUR initials
2. 📝 Add your name to the HTML
3. 🌐 Deploy to GitHub Pages
4. 📤 Submit link on Canvas

Good luck! 🚀

