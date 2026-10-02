# KAMUNATI — Next.js + Tailwind Opening Animation

A lightweight app-opening animation for the KAMUNATI movie streaming web app.

## Animation sequence

1. Black screen.
2. The **K** appears first with a cinematic scale/blur reveal.
3. **A M U N A T I** build outward from the K with staggered timing.
4. The completed **KAMUNATI** logo settles.
5. A subtle white light sweep crosses the logo.
6. The intro ends at about 5 seconds, or immediately with **SKIP**.
7. `prefers-reduced-motion` disables the motion automatically.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Add your WILD WORLD font

Copy your font file into:

`public/fonts/WILD-WORLD.otf`

The CSS already references that file. If it is not present, the browser will fall back to Impact/Arial Narrow.

## Main files

- `app/page.js` — demo streaming homepage + intro integration
- `app/components.js` — opening animation component
- `app/globals.css` — Tailwind + custom animation keyframes
- `public/fonts/WILD-WORLD.otf` — place your font here

## Reusing the intro

```jsx
<Intro onComplete={() => setIntroDone(true)} />
```

The component is intentionally dependency-free beyond Next.js/React and Tailwind.
