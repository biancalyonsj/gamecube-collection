# GameCube Collection — Interactive Scroll Experience

A scroll-driven 3D showcase of my favorite GameCube games, built with **Three.js**, **GSAP ScrollTrigger**, and **custom GLSL shaders**. Each disc is a custom Blender asset that glides and rotates as you scroll with a topographic shader background.

---
## Why did I make this?

The GameCube was my favorite console growing up. I remember as a kid trying to convince my older brother to buy the newest Dragon Ball Z game but he came home with Super Smash Bros instead. I was so disappointed, the title had me convinced it was some kind of wrestling game. Imagine my surprise when he popped in the disc and it turned out to be a Nintendo game with all my favorite characters! We played for hours until my mom forced us to go to bed.

Over a decade later and the GameCube is still my favorite console. So I built an interactive 3D website to showcase my favorite GameCube games.

Each disc is a fully custom 3D model I built in Blender. I've never used Blender before and I've always wanted to learn, so I'm super proud of how these turned out!

---

## Demo
https://github.com/user-attachments/assets/c0aba86f-c46f-4930-a6a0-c432c59e7dcc

---

## Check it out here!



---

## Overview

A fully responsive 3D scroll experience: custom-modeled GameCube discs sequenced along a scroll timeline, a live topographic background shader, and a resize-safe scene that stays correct on any viewport, from a split-screen dev setup to a large external monitor.

Rather than follow a tutorial, I started with the basics. Instead of importing my Blender models, I built the entire animation using torus meshes, basically colorful donuts, as stand-ins. No textures, no lighting, no imported models. I wanted to focus on just the mechanics.

When you're learning something new, trying to solve everything at once can be overwhelming and a guaranteed way of getting stuck. So I narrowed down the goal and decided to figure out the scroll animation first and worry about how it looks later. Separating the problem into smaller chunks made something that felt overwhelming actually feel manageable. 

When I was ready to move onto loading in the blender models and implementing some of the harder features, I debugged this project through the math and mechanics. It took a while to understand some of the concepts I've never worked with before; camera frustum geometry, GSAP's timeline/easing model, async model loading, GLSL. But it was import to understand *why* each fix worked, not just that it did.

---

## Tech Stack

| Layer | Tools |
|---|---|
| 3D rendering | Three.js, custom `.glb` models authored in Blender |
| Scroll animation | GSAP + ScrollTrigger, Lenis (smooth scrolling) |
| Shaders | Hand-written GLSL (vertex + fragment), Simplex/Perlin noise |
| Asset loading | `GLTFLoader`, `Promise.allSettled` for resilient parallel loading |
| Tooling | Vite / vanilla JS modules |

---

## Key Features

- **Scroll-scrubbed 3D sequence**: each disc slides in, pauses at center, spins, and exits, driven by a single GSAP timeline synced to scroll position via `scrub`.
- **Frustum-aware, resolution-independent layout**: disc spacing and background plane size are calculated live from camera FOV, aspect ratio, and depth, so nothing clips or drifts on resize.
- **Custom animated shader background**: a topographic contour effect written from scratch in GLSL using a 2D Perlin Noise: Simplex noise → thresholded contour bands → anti-aliased edges via `fwidth()`.
- **Dual-material disc faces**: the front (label) and back of each disc use different materials, isolated via Blender's exported material slots and swapped selectively in the Three.js scene graph.
- **Resilient async asset pipeline**: all 8 disc models load in parallel with `Promise.allSettled`, so a single failed asset can't block the rest of the experience.
- **Clean rebuild-on-resize architecture**: timelines, `ScrollTrigger` instances, and object transforms are fully reset and rebuilt on every resize, avoiding stale-state bugs and leaked instances.

---

## Technical Deep Dives

A few of the harder problems I solved while building this:

**1. Camera-frustum math for responsive 3D layout**
Instead of hardcoding how far a disc needed to travel to leave the viewport, I calculated it from the camera's actual field of view:

```js
function calculateDistance() {
    const fovRadians = (camera.fov / 2) * (Math.PI / 180);
    return camera.position.z * Math.tan(fovRadians) * camera.aspect;
}
```

This keeps every disc reliably off-screen (and the background plane reliably full-bleed) at *any* aspect ratio, recalculated on every resize.

**2. Diagnosing and eliminating stale GSAP/ScrollTrigger state**
Rebuilding the timeline on resize initially caused visual glitches and drift. Root cause: repeated calls were (a) compounding position offsets instead of resetting them, and (b) leaking duplicate `ScrollTrigger` instances that fought over the same properties. I fixed this by explicitly resetting object transforms to a known baseline and calling `tl.kill()` before constructing a fresh timeline each time.

**3. Matching easing curves across chained tweens**
Splitting a disc's motion into "arrive → pause → depart" stages introduced a velocity discontinuity at the seam, causing a visible jarring snap, especially when scrubbing backward. I solved this by pairing `power1.out` (arriving) with `power1.in` (departing) so the velocity is continuous through the seam in both scroll directions.

**4. Anti-aliased procedural shapes in GLSL**
A hard `step()` threshold on noise produced jagged edges that got worse at larger viewport sizes. I was replaced it with `smoothstep()` driven by `fwidth()`, so the blend width automatically adapts to the local rate of change per pixel. This created clean edges at any resolution.

**5. Resilient parallel model loading**
I originally loaded all 8 `.glb` files sequentially with `await` in a loop. Later I refactored to `discs.map(async disc => ...)` + `Promise.allSettled`, so all requests fire in parallel and a single failed load doesn't halt the rest with `.filter()` + `.map()` cleanly separating successful loads from failures.

---

## What I Learned

- The difference between scroll-triggered *events* and scroll-*scrubbed* animation, and how `scrub` (catch-up time) is a fundamentally different control from `ease` (curve shape).
- How CSS layout, `position: fixed`, and document flow interact with scroll-distance calculations and why "it looks right on my screen" isn't the same as "it's correct." This was a big lesson.
- Core async JavaScript patterns: the difference between `async` function return values, `.then()` chaining, `Promise.all()` vs `Promise.allSettled()`, and classic pitfalls like mutating an array mid-iteration.
- The basics of the GPU shader pipeline: vertex vs. fragment shaders, uniforms, UV space and how to build a fragment-shader-only visual effect from raw noise up to an animated, anti-aliased pattern.
- How to debug systematically: isolate variables, verify assumptions with `console.log` instead of guessing. It's important to understand *why* a fix works before trusting it. Just because it looks like it works, doesn't mean it actually works.

---

## Running Locally

```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
npm install
npm run dev
```

---

## Credits

GameCube disc models modeled and textured by me in Blender. Built with [Three.js](https://threejs.org/), [GSAP](https://gsap.com/), and [Lenis](https://lenis.darkroom.engineering/).
