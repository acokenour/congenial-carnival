# Webcam ASCII Spotlight

A live webcam filter using `@basementstudio/shader-lab`. Move your mouse over the video — inside a circular "spotlight" the image becomes live ASCII art, outside is your normal feed.

## Setup (first time)

You'll need **Node.js 18+** installed. If you don't have it:

```bash
# macOS — install via Homebrew (recommended)
brew install node
```

If you don't have Homebrew, get it from https://brew.sh first, or download the installer at https://nodejs.org.

Verify it's installed:

```bash
node --version    # should print v18.x.x or higher
```

## Run the project

From inside this folder:

```bash
# 1. Install dependencies (one time, takes a minute or two)
npm install

# 2. Start the dev server
npm run dev
```

Open **http://localhost:3000** in **Chrome**. Grant camera permission when prompted.

## What you should see

- Your webcam feed.
- A circular spotlight that follows your mouse.
- Inside the circle: green-on-black ASCII characters that respond to brightness.
- Outside: the raw webcam.

## Tweaking it

Open `app/components/WebcamShader.tsx`. The interesting bits in the shader code:

- `radius` — size of the spotlight (try `0.4` for a bigger circle).
- `cellSize` — ASCII character size (smaller = more detail, more GPU work).
- `vec3(0.2, 1.0, 0.4)` — the green color. Try `vec3(1.0, 0.4, 0.1)` for orange or `vec3(0.5, 0.7, 1.0)` for blue.
- The `softness` value controls how blurry the circle edge is.

## If something breaks

- **"Could not access webcam"** — Check System Settings → Privacy & Security → Camera, make sure Chrome is allowed.
- **Black screen** — Open DevTools (Cmd+Opt+I) and check the console. If you see a WebGPU error, make sure you're on Chrome 113+ and that `chrome://gpu` shows WebGPU as enabled.
- **Shader compile error in console** — The `code` string in the custom shader might have a typo. The error message tells you which line.
