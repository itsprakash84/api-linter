# Visual Content Guide for Medium Article

This guide will help you create all the visual assets for your Medium article, even if you're not a designer.

---

## 📋 Overview

You'll need:

1. **Cover Image** (REQUIRED) - Hero image for the article
2. **Architecture Diagram** (Recommended) - Shows system design
3. **Terminal Screenshots** (Recommended) - Shows CLI in action
4. **Web UI Screenshots** (Recommended) - Shows web interface
5. **Impact Metrics Chart** (Optional) - Visualizes results

**Time needed:** 30-60 minutes for all images

---

## 1. Cover Image (REQUIRED)

### Dimensions & Specs

- **Size:** 1500 x 840 pixels (Medium recommended)
- **Aspect ratio:** 16:9
- **Format:** PNG or JPG
- **File size:** Under 5MB

### Option A: Use Canva (Easiest) ⭐ RECOMMENDED

**Step-by-step:**

1. Go to [canva.com](https://canva.com) (free account)
2. Click **"Create a design"** → **"Custom size"**
3. Enter: **1500 x 840** pixels
4. Click **"Create"**

**Design suggestions:**

**Template 1: Simple Text + Icon**
```
Background: Dark gradient (dark blue → purple)
Main text: "Building an AI-Powered API Linter"
Subtext: "Taming 50+ Microservices"
Icon: API/code icon (search "API" in Canva)
```

**Template 2: Screenshot + Overlay**
```
Background: Screenshot of your CLI output (blurred)
Overlay: Semi-transparent dark layer
Text: Article title in white, bold
```

**Template 3: Minimalist**
```
Background: Solid color (e.g., #1a1a1a)
Text: Article title
Simple geometric shapes as decoration
```

**Tips:**
- Use readable fonts (Montserrat, Inter, Roboto)
- Font size: 80-120px for title
- Keep it simple (less is more)
- High contrast (white text on dark background)

**Export:**
1. Click **"Share"** → **"Download"**
2. Format: **PNG**
3. Quality: **High**

### Option B: Use Figma (For designers)

1. Create 1500 x 840 frame
2. Design your cover
3. Export as PNG

### Option C: Use Screenshot + Photo Editor

1. Take screenshot of terminal output
2. Open in Preview (Mac) or Paint (Windows)
3. Add text overlay with title
4. Resize to 1500 x 840
5. Export as PNG

### Option D: Use Free Stock Images

**Websites:**
- [Unsplash](https://unsplash.com) - Search "code" or "technology"
- [Pexels](https://pexels.com) - Search "programming"

**Add text overlay:**
1. Download image (1920 x 1080 or larger)
2. Use Canva to add text
3. Resize to 1500 x 840

---

## 2. Architecture Diagram (Recommended)

Shows how your API Linter works.

### Option A: Use Draw.io (Free, Easy) ⭐ RECOMMENDED

1. Go to [app.diagrams.net](https://app.diagrams.net)
2. Click **"Create New Diagram"**
3. Choose **"Blank Diagram"**

**Suggested layout:**

```
┌─────────────────┐
│  OpenAPI Spec   │ (YAML file)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   YAML Parser   │ (js-yaml)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  11 Validators (Parallel)   │
│  • Description               │
│  • Naming                    │
│  • Error Response            │
│  • ... (8 more)              │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│  Issues Found   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    ┌──────────────┐
│ AI Enhancement  │───▶│ Gemini API   │
│   (Optional)    │◀───│              │
└────────┬────────┘    └──────────────┘
         │
         ▼
┌─────────────────────────────┐
│        Output               │
│  • CLI (Terminal)           │
│  • Web UI (Browser)         │
│  • JSON (CI/CD)             │
└─────────────────────────────┘
```

**Draw.io steps:**
1. Drag **"Rectangle"** shapes for each component
2. Use **"Arrow"** to connect them
3. Add text labels
4. Color code:
   - Input/Output: Blue
   - Core logic: Green
   - Optional features: Orange

**Export:**
1. File → Export as → **PNG**
2. Zoom: **200%**
3. Border width: **10** pixels
4. Transparent background: **OFF**

### Option B: Use Excalidraw (Hand-drawn style)

1. Go to [excalidraw.com](https://excalidraw.com)
2. Draw the same flow
3. Export as PNG

### Option C: Use ASCII Art (Simplest)

Just use text in a code block:

```
OpenAPI Spec → Parser → Validators → Issues → AI Enhancement → Output
```

Include this directly in your Medium article (no separate image needed).

---

## 3. Terminal Screenshots (Recommended)

Shows your CLI in action.

### Step 1: Run the Linter

```bash
cd /Users/sathyaprakash/code/serko-api-linter
node bin/api-linter.js examples/flights-bad.yaml
```

### Step 2: Capture Screenshot

**Mac:**
- Cmd + Shift + 4 → Select terminal window
- Or Cmd + Shift + 3 → Full screen

**Windows:**
- Snipping Tool or Win + Shift + S

**Linux:**
- gnome-screenshot or flameshot

### Step 3: Make It Pretty with Carbon

1. Go to [carbon.now.sh](https://carbon.now.sh)
2. Paste your terminal output
3. Settings:
   - Theme: **Dracula** or **Night Owl**
   - Font: **Fira Code** or **Hack**
   - Background: **Gradient** (enabled)
   - Padding: **32px**
   - Drop shadow: **ON**
4. Click **"Export"** → **PNG**

**Example terminal output to capture:**

```bash
$ node bin/api-linter.js examples/flights-bad.yaml

╔══════════════════════════════════════════════════════════╗
║                  API Linter Results                      ║
╚══════════════════════════════════════════════════════════╝

File: examples/flights-bad.yaml

❌ ERRORS: 8
⚠️  WARNINGS: 15
✓  PASSED: 42

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ERRORS:

1. Schema 'Flight' missing description
   Location: components.schemas.Flight
   Suggestion: Add a description explaining what this schema represents

2. Field 'userid' should be 'userId' (camelCase)
   Location: components.schemas.Booking.properties.userid
   AI Suggestion: Rename to 'userId' for consistency with your other APIs
```

---

## 4. Web UI Screenshots (Recommended)

Shows the web interface.

### Step 1: Start Web Server

```bash
cd /Users/sathyaprakash/code/serko-api-linter/web
npm start
# Opens at http://localhost:3000
```

### Step 2: Prepare the UI

1. Upload a YAML file (use `examples/flights-bad.yaml`)
2. Wait for validation to complete
3. Results should show errors/warnings

### Step 3: Take Screenshots

**Screenshot 1: Before (Upload page)**
- Clean interface
- Drag & drop area
- "Analyze" button

**Screenshot 2: After (Results page)**
- Errors and warnings displayed
- Color-coded severity
- AI suggestions visible

### Step 4: Annotate (Optional)

Use Preview (Mac) or Paint (Windows):
1. Add arrows pointing to key features
2. Add text labels: "AI Suggestions", "Severity Levels", etc.
3. Add red circles around important parts

---

## 5. Impact Metrics Chart (Optional)

Visualizes before/after results.

### Option A: Use Canva Charts

1. Go to [canva.com](https://canva.com)
2. Search template: **"Comparison Chart"** or **"Before After"**
3. Enter your data:

```
Before:
• 12 incidents/month
• 6 hours/week code review
• 3 days onboarding

After:
• 2 incidents/month (83% ↓)
• 1 hour/week code review (83% ↓)
• 4 hours onboarding (92% ↓)
```

4. Export as PNG

### Option B: Use Google Sheets

1. Create a spreadsheet:

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Incidents/month | 12 | 2 | -83% |
| Code review hrs/week | 6 | 1 | -83% |
| Onboarding time | 3 days | 4 hours | -92% |

2. Select data → Insert → Chart
3. Choose **Bar Chart** or **Column Chart**
4. Download as PNG

### Option C: Use Text Table (No image needed)

Just include a formatted table in your Medium article:

```
📊 Impact Metrics

Before Linter:
• 12 incidents/month
• 6 hours/week in code review
• 3 days to onboard new devs

After Linter:
• 2 incidents/month (83% reduction)
• 1 hour/week in code review (83% reduction)
• 4 hours to onboard (92% reduction)
```

---

## 6. Code Snippet Images (Optional)

If you want pretty code examples instead of plain text.

### Use Carbon.now.sh

1. Go to [carbon.now.sh](https://carbon.now.sh)
2. Paste your code
3. Configure:
   - Theme: **Dracula**, **Monokai**, or **Night Owl**
   - Language: **JavaScript**, **YAML**, **Bash** (auto-detected)
   - Font size: **16px**
   - Line numbers: **ON** (if helpful)
   - Background: **Gradient** or solid color
   - Padding: **32px**
4. Export → PNG

**Example code to prettify:**

```javascript
// Validator example
class DescriptionValidator {
  validate(spec) {
    const issues = [];
    // Check schemas
    for (const [name, schema] of Object.entries(spec.components?.schemas || {})) {
      if (!schema.description) {
        issues.push({
          severity: 'error',
          message: `Schema '${name}' missing description`,
          path: `components.schemas.${name}`
        });
      }
    }
    return issues;
  }
}
```

---

## 7. Animated GIFs (Advanced, Optional)

Shows your tool in action.

### Option A: Use Gifox (Mac) - Paid

1. Download [Gifox](https://gifox.io)
2. Record screen while using CLI or web UI
3. Export as GIF

### Option B: Use LICEcap (Free, Windows/Mac)

1. Download [LICEcap](https://www.cockos.com/licecap/)
2. Position window over terminal
3. Record
4. Save as GIF

### Option C: Use asciinema (Terminal recordings)

1. Install: `brew install asciinema` (Mac)
2. Record: `asciinema rec demo.cast`
3. Upload: `asciinema upload demo.cast`
4. Get shareable link

**Include link in article instead of GIF**

---

## 📊 Summary: What You Actually Need

### Minimum (Can publish with this)

✅ **Cover image** (1500 x 840) - Use Canva template

### Good (Recommended)

✅ Cover image
✅ 1-2 terminal screenshots (Carbon.now.sh)
✅ Architecture diagram (Draw.io)

### Excellent (If you have time)

✅ Cover image
✅ Terminal screenshots (before/after)
✅ Architecture diagram
✅ Web UI screenshots
✅ Metrics chart

---

## 🎨 Design Tips

### Colors

Use a consistent palette:
- **Dark background:** #1a1a1a, #0f172a
- **Accent color:** #3b82f6 (blue), #10b981 (green)
- **Text:** White (#ffffff) or light gray (#e5e7eb)
- **Error:** #ef4444 (red)
- **Warning:** #f59e0b (orange)
- **Success:** #10b981 (green)

### Fonts

- **Headings:** Montserrat, Inter, Poppins (bold)
- **Body:** Open Sans, Roboto, System UI
- **Code:** Fira Code, JetBrains Mono, Source Code Pro

### Layout

- **Keep it simple:** Don't overcrowd
- **High contrast:** Easy to read
- **Consistent style:** All images match theme
- **White space:** Don't fill every pixel

---

## 🚀 Quick Start (30 minutes)

**If you're short on time, do this:**

1. **Cover image (10 min):**
   - Canva → Template → Add title → Export

2. **Terminal screenshot (10 min):**
   - Run linter → Screenshot → Carbon.now.sh → Export

3. **Architecture diagram (10 min):**
   - Draw.io → Basic flowchart → Export

**That's enough for a great first article!**

---

## 📁 File Organization

Save your images in this structure:

```
docs/
  images/
    cover-image.png           (1500x840)
    architecture-diagram.png  (800x600)
    terminal-screenshot-1.png (1200x800)
    terminal-screenshot-2.png (1200x800)
    web-ui-upload.png        (1200x800)
    web-ui-results.png       (1200x800)
    metrics-chart.png        (800x600)
```

---

## ✅ Image Checklist

Before uploading to Medium:

- [ ] All images are PNG or JPG
- [ ] Cover image is 1500 x 840 pixels
- [ ] All images are under 5MB each
- [ ] Images are clear (not blurry)
- [ ] Text in images is readable
- [ ] Colors are consistent across images
- [ ] No sensitive data in screenshots (API keys, emails, etc.)

---

## 🎯 You're Ready!

With these images, your article will be **professional**, **engaging**, and **shareable**.

**Remember:**
- Start with minimum (cover image)
- Add more as you have time
- You can edit article and add images later
- Done is better than perfect!

---

## 📚 Tools Summary

**Free Tools:**
- [Canva](https://canva.com) - Cover image, charts
- [Draw.io](https://app.diagrams.net) - Diagrams
- [Carbon.now.sh](https://carbon.now.sh) - Code screenshots
- [Excalidraw](https://excalidraw.com) - Hand-drawn diagrams
- [Unsplash](https://unsplash.com) - Stock photos

**Screenshot Tools:**
- Mac: Cmd + Shift + 4
- Windows: Snipping Tool, Win + Shift + S
- Linux: gnome-screenshot, flameshot

**Optional:**
- Figma (advanced design)
- Photoshop (advanced editing)
- Gifox/LICEcap (animated GIFs)

Good luck creating your visuals! 🎨
