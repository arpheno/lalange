# **Maspalomas Magma: A Place-Based Aesthetics System for AI-Assisted Frontend Architecture**

## **1\. Architectural Thesis: The "Gran Canaria" Simulation**

This document defines a place-based design system titled **"Maspalomas Magma."** It refines the previous "Volcanic Psychedelia" concept by anchoring it in the specific sensory reality of Gran Canaria. The visual language bridges the ancient, dormant power of the **Caldera de Bandama** (Volcanic) with the shifting, hypnotic fluidity of the **Dunes of Maspalomas** (Sand/Flow) and the hyper-saturated, inclusive energy of the **Yumbo Centre nightlife** (LSD/Psychedelic).  
As a foundational instruction set for coding LLMs (GitHub Copilot, Gemini 3 Pro), this document uses "Semantic Geotagging." We define colors and animations not just by their physics, but by their local reference points (e.g., "Calima Haze" for blur effects, "Atlantic Swell" for fluid motion). This contextual grounding allows the AI to "hallucinate" consistent design decisions by drawing on the semantic web's knowledge of the island's geography.

## **2\. Chromatic Dynamics: From Dunes to Deep Ocean**

The color system is organized into four distinct environments found on the island: The Dunes (Day), The Volcanic Interior (Night/Grayscale), The Atlantic (Contrast), and The Nightlife (Psychedelic).

### **2.1. Daymode: The "Dunes of Maspalomas" Palette**

The Daymode is not a generic "light theme"; it is a simulation of the Maspalomas Dunes at high noon and golden hour. It captures the undulating warmth of the sand against the stark blue of the Canarian sky.

| Local Reference | Color Name | Hex Code | Visual Physics | Usage in System |
| :---- | :---- | :---- | :---- | :---- |
| **Midday Sand** | Dune Gold | \#E0D058 | High-reflectivity silica sand. Blinding warmth. | Primary backgrounds, solar highlights. |
| **Shadowed Sand** | Copper Red | \#C8703F | The lee side of a dune during sunset. Oxidized iron. | Secondary gradients, borders, depth maps. |
| **Canarian Sky** | Flag Blue | \#3399FF | Intense zenith blue, specific to the Gran Canaria flag. | Action buttons, links, "Cooling" accents. |
| **Calima Haze** | Dark Vanilla | \#DCBCA3 | Airborne dust suspension (Calima). Low contrast. | Atmospheric washes, "frosted" glass backgrounds. |

**Context for AI:** The "Calima" color is crucial for reducing contrast in large areas, simulating the dust storms that roll in from the Sahara, creating a "soft box" lighting effect.

### **2.2. Nightmode: The "Roque Nublo" Volcanic Palette**

Nightmode mimics the ancient volcanic interior of the island. It replaces generic dark grays with "Basalt" and "Oxidized Magma," drawing from the geology of landmarks like Roque Nublo and Pico de las Nieves.

| Local Reference | Color Name | Hex Code | Visual Physics | Usage in System |
| :---- | :---- | :---- | :---- | :---- |
| **Cooled Lava** | Basalt Black | \#111111 | Volcanic rock. High density, light absorption. | Global background (OLED optimized). 1 |
| **Active Vent** | Teneguía Red | \#CF1020 | Sub-surface magma flow. Warning heat. | Primary interactions, "Heartbeat" pulses. 2 |
| **Oxidized Rock** | Puce Oxide | \#692F2E | Ancient, weathered volcanic stone. | Shadows, card backgrounds, "Grayscale" tint. 3 |
| **Native Flora** | Canarian Pine | \#01796F | *Pinus canariensis*. Deep, resilient green. | Success states, organic balance to the red/orange. |

### **2.3. The "Yumbo" Flux: Psychedelic Bioluminescence**

This layer represents the "LSD" vibe requested, contextualized through the lens of Maspalomas' famous nightlife and LGBTQ+ culture (Yumbo Centre) and the rare bioluminescent phenomena of the Atlantic. These colors are "unnatural" and used to cut through the organic earth tones.

* **Neon Pride (\#FF01D7)**: A hyper-saturated magenta referencing the neon lights of Playa del Inglés. Used for "glitch" effects and high-frequency highlights. 4  
* **Atlantic Phosphor (\#00EDF5)**: The electric cyan of bioluminescent plankton. Used for text shadows and chromatic aberration. 4  
* **Mojo Lime (\#F7F002)**: A violent, acidic yellow-green, referencing the local *Mojo Verde* sauce but amplified to neon levels. 4

### **2.4. Contrast: The "Gold Speck" Physics**

The "Gold Specks" in this system are not generic glitter; they are **Mica**, a mineral often found in the volcanic sands that glitters in the sun.

* **The Mica Gradient:** linear-gradient(135deg, \#C47610, \#E0D058, \#A5663A, \#FFF)  
* This gradient simulates the metallic reflection of minerals embedded in the dark volcanic rock.

### **2.5. Grayscale: The "Ash Layer"**

For the grayscale/muted mode, we simulate the **Ash Fields (Lapilli)** found in the Canary Islands.

* **Ash Gray:** \#2F3742 \- A cool, dark gray that feels like slate/stone rather than digital gray. 1  
* **White Wash:** \#E7E7E7 \- The color of the Maspalomas Lighthouse masonry (Blue-Grey/White).

## **3\. Atmospheric Physics: Calima, Glass, and Ocean Swell**

### **3.1. Glassmorphism: The "Calima" Frost**

In Gran Canaria, visibility is often softened by the *Calima* (sand dust from the Sahara). We model our Glassmorphism on this phenomenon.

* **Effect:** Instead of a clear "Apple" glass, we use a "Dusty" glass.  
* **Implementation:** High blur (25px) with a "Dark Vanilla" (\#DCBCA3) tint at 10% opacity. This creates a warm, hazy window rather than a cold, blue one.

### **3.2. Animations: The "Atlantic Swell" & "Dune Shift"**

Movement in this system mimics the island's natural forces.

1. **Dune Shift (Parallax):** Background textures (the Gold Specks) move slowly and horizontally, mimicking sand drifting in the trade winds (*Alisios*).  
2. **Atlantic Swell (Breathing):** The "Breathing" animation follows the rhythm of ocean waves—a long intake (swell) and a crashing release (breaking wave).

## **4\. The Foundational Aesthetics Document (HTML Artifact)**

This artifact is designed to be dropped into VS Code. It uses "Context-Injection" comments to explain the *Gran Canaria* logic to the AI.

HTML

\<\!DOCTYPE html\>  
\<html lang="en"\>  
\<head\>  
    \<meta charset="UTF-8"\>  
    \<meta name="viewport" content="width=device-width, initial-scale=1.0"\>  
    \<meta name="description" content="Maspalomas Magma: A Place-Based Design System for AI Agents"\>  
    \<title\>Maspalomas Magma: Gran Canaria Aesthetic System\</title\>

    \<style\>  
        /\*   
           \=========================================================================  
           1\. DESIGN TOKENS: THE GEOLOGY OF GRAN CANARIA  
           AI INSTRUCTION: These variables map to physical locations on the island.  
           Use 'Dune' colors for warmth/light, 'Volcanic' for structure/darkness,  
           and 'Yumbo' colors for energy/interaction.  
           \=========================================================================   
        \*/  
        :root {  
            /\* \--- BIOME: THE MASPALOMAS DUNES (Daymode) \---  
               Source: Dune Hexes, Copper Red  
               Physics: High-reflectivity silica, warm oxidation. \*/  
            \--color-dune-gold: \#E0D058;         /\* Midday Sun on Sand \*/  
            \--color-dune-shadow: \#C47610;       /\* Sunset Dune Ridge \*/  
            \--color-calima-haze: \#DCBCA3;       /\* Atmospheric Dust (Low Contrast) \*/  
            \--color-atlantic-blue: \#3399FF;     /\* Gran Canaria Flag Blue (Sky/Sea) \*/

            /\* \--- BIOME: THE VOLCANIC INTERIOR (Nightmode) \---  
               Source:  Volcanic, Canarian Pine  
               Physics: Cooled basalt, jagged obsidian, resilient flora. \*/  
            \--color-basalt: \#111111;            /\* Deepest Black (Roque Nublo Shadow) \*/  
            \--color-magma-vent: \#CF1020;        /\* Active Heat (Teneguía Style) \*/  
            \--color-magma-crust: \#EB5121;       /\* Cooling Lava \*/  
            \--color-canarian-pine: \#01796F;     /\* Pinus Canariensis (Deep Green) \*/  
              
            /\* \--- BIOME: YUMBO NIGHTLIFE (LSD/Psychedelic) \---  
               Source:  Psychedelic Art, Pride Colors  
               Physics: Synthetic fluorescence, bioluminescence. \*/  
            \--color-neon-pride: \#FF01D7;        /\* Yumbo Center Magenta \*/  
            \--color-bio-cyan: \#00EDF5;          /\* Atlantic Bioluminescence \*/  
            \--color-mojo-lime: \#F7F002;         /\* Toxic Mojo Verde \*/

            /\* \--- MATERIAL: MICA & GOLD DUST \---  
               Source: Dune Minerals  
               Simulates metallic minerals found in the black volcanic sand. \*/  
            \--gradient-mica: linear-gradient(135deg, \#C47610, \#E0D058, \#A5663A, \#FFF, \#C47610);

            /\* \--- OPTICS: CALIMA GLASS \---  
               Source: Sand Dunes  
               Physics: Light scattering through dust particles. \*/  
            \--glass-blur: 25px;  
            \--glass-tint: rgba(220, 188, 163, 0.05); /\* Tinted with 'Dark Vanilla' \*/  
            \--glass-border: 1px solid rgba(255, 255, 255, 0.15);  
            \--glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);

            /\* \--- KINETICS: THE TRADE WINDS (ALISIOS) \---  
               Physics: Constant, fluid, unidirectional flow. \*/  
            \--ease-swell: cubic-bezier(0.4, 0.0, 0.2, 1); /\* Ocean Swell Rhythm \*/  
            \--anim-breath: 6000ms; /\* Slow, deep breath like the tide \*/  
        }

        /\*   
           \=========================================================================  
           2\. GLOBAL RESET & BASE LAYERS  
           \=========================================================================   
        \*/  
        \*, \*::before, \*::after {  
            box-sizing: border-box;  
            \-webkit-font-smoothing: antialiased;   
        }

        body {  
            margin: 0;  
            padding: 0;  
            font-family: 'Inter', system-ui, sans-serif;  
            background-color: var(--color-basalt);  
            color: \#ffffff;  
            transition: background-color 0.8s var(--ease-swell), color 0.5s ease;  
            min-height: 100vh;  
            overflow-x: hidden;  
        }

        /\*   
           \=========================================================================  
           3\. SECTIONS & PALETTES (THEME MODES)  
           \=========================================================================   
        \*/

        /\* MODE 1: NIGHTMODE (Volcanic Caldera) \- DEFAULT \*/  
       .section-volcanic {  
            /\* The default state is the deep interior of the island at night \*/  
        }

        /\* MODE 2: DAYMODE (Maspalomas Dunes) \*/  
        body.theme-dunes {  
            background-color: var(--color-dune-gold);  
            color: var(--color-basalt);  
              
            /\* Re-map glass for the bright sun \*/  
            \--glass-tint: rgba(255, 255, 255, 0.2);  
            \--glass-border: 1px solid rgba(255, 255, 255, 0.4);  
            \--glass-shadow: 0 10px 40px rgba(196, 118, 16, 0.3); /\* Golden Shadow \*/  
        }

        /\* MODE 3: GRAYSCALE (Lighthouse Stone) \*/  
        body.theme-ash {  
            background-color: \#2F3742; /\* Ash Gray \*/  
            filter: grayscale(100%) contrast(1.1);  
        }

        /\*   
           \=========================================================================  
           4\. COMPONENT: THE CALIMA GLASS PANEL  
           Physics: 3D Flow \+ Dust Haze  
           \=========================================================================   
        \*/  
       .calima-glass {  
            background: var(--glass-tint);  
            backdrop-filter: blur(var(--glass-blur));  
            \-webkit-backdrop-filter: blur(var(--glass-blur));  
            border: var(--glass-border);  
            border-radius: 24px;  
            box-shadow: var(--glass-shadow);  
              
            padding: 3rem;  
            margin: 2rem auto;  
            max-width: 1000px;  
            position: relative;  
              
            /\* 3D Perspective Flow \*/  
            transform-style: preserve-3d;  
            perspective: 1200px;  
            transition: transform 0.6s var(--ease-swell);  
        }

       .calima-glass:hover {  
            /\* A subtle "heave" like the ocean \*/  
            transform: translateY(-10px) rotateX(1deg);  
            box-shadow:   
                0 20px 50px rgba(0,0,0,0.6),  
                /\* Chromatic Aberration (Bioluminescence) \*/  
                \-2px 0 15px var(--color-bio-cyan),  
                2px 0 15px var(--color-neon-pride);  
        }

        /\*   
           \=========================================================================  
           5\. ANIMATION: DUNE DUST (MICA PARTICLES)  
           Technique: CSS-Only Noise Masking over Gold Gradient  
           \=========================================================================   
        \*/  
       .mica-dust-layer {  
            position: absolute;  
            top: 0; left: 0;   
            width: 100%; height: 100%;  
            pointer-events: none;  
            z-index: \-1;  
            opacity: 0.4;  
            mix-blend-mode: overlay;  
              
            /\* The Mineral: Gold/Copper Gradient \*/  
            background: var(--gradient-mica);  
              
            /\* The Texture: Fractal Noise Mask \*/  
            mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");  
            \-webkit-mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");  
              
            /\* The Wind: Drifting Animation \*/  
            animation: alisiosWind 40s linear infinite;  
        }

        @keyframes alisiosWind {  
            0% { background-position: 0% 0%; }  
            100% { background-position: 100% 20%; } /\* Diagonal drift \*/  
        }

        /\*   
           \=========================================================================  
           6\. COMPONENT: THE MAGMA BUTTON (BREATHING)  
           Physics: Viscous fluid expansion  
           \=========================================================================   
        \*/  
       .btn-magma {  
            position: relative;  
            padding: 1.2rem 3.5rem;  
            border-radius: 50px;  
            border: none;  
            background: var(--color-magma-vent);  
            color: \#fff;  
            font-weight: 800;  
            text-transform: uppercase;  
            letter-spacing: 0.1em;  
            cursor: pointer;  
            overflow: hidden;  
              
            /\* Hardware Acceleration \*/  
            will-change: transform, box-shadow;  
            animation: magmaBreath var(--anim-breath) var(--ease-swell) infinite;  
        }

        /\* The Heat Pulse \*/  
        @keyframes magmaBreath {  
            0%, 100% { transform: scale(1); box-shadow: 0 0 10px var(--color-magma-crust); }  
            50% { transform: scale(1.03); box-shadow: 0 0 30px var(--color-magma-vent); }  
        }

        /\* CSS-Only Ripple (Interaction) \*/  
       .btn-magma::after {  
            content: "";  
            position: absolute;  
            top: 50%; left: 50%;  
            width: 10px; height: 10px;  
            background: rgba(255,255,255,0.6);  
            border-radius: 50%;  
            transform: translate(-50%, \-50%) scale(0);  
            opacity: 0;  
            transition: transform 0s, opacity 0s;  
        }  
       .btn-magma:active::after {  
            transform: translate(-50%, \-50%) scale(20);  
            opacity: 0;  
            transition: transform 0.6s ease-out, opacity 0.6s ease-out;  
        }

        /\*   
           \=========================================================================  
           7\. LIQUID DISTORTION (LSD/HEAT HAZE)  
           Physics: Refraction index modification via SVG  
           \=========================================================================   
        \*/  
       .heat-haze-container {  
            filter: url(\#heat-haze);  
        }

        /\* Typography \*/  
        h1, h2, h3 {  
            font-weight: 800;  
            margin: 0;  
        }  
          
       .text-gradient-gold {  
            background: var(--gradient-mica);  
            \-webkit-background-clip: text;  
            background-clip: text;  
            color: transparent;  
        }

       .palette-grid {  
            display: grid;  
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));  
            gap: 1rem;  
            margin-top: 1rem;  
        }  
       .swatch {  
            height: 80px;  
            border-radius: 12px;  
            display: flex;  
            align-items: center;  
            justify-content: center;  
            font-size: 0.8rem;  
            font-family: monospace;  
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);  
        }

    \</style\>  
\</head\>  
\<body\>

    \<svg style="position: absolute; width: 0; height: 0;"\>  
        \<defs\>  
            \<filter id="heat-haze"\>  
                \<feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="warp"\>  
                    \<animate attributeName="baseFrequency" dur="15s" values="0.015; 0.025; 0.015" repeatCount="indefinite" /\>  
                \</feTurbulence\>  
                \<feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="20" in="SourceGraphic" in2="warp" /\>  
            \</filter\>  
        \</defs\>  
    \</svg\>

    \<header style="text-align: center; padding: 6rem 1rem; position: relative;"\>  
        \<div class="mica-dust-layer"\>\</div\>  
        \<h1 class="text-gradient-gold" style="font-size: 4rem; text-shadow: 0 10px 30px rgba(0,0,0,0.5);"\>MASPALOMAS MAGMA\</h1\>  
        \<p style="color: var(--color-calima-haze); letter-spacing: 2px;"\>GRAN CANARIA AESTHETICS // SYSTEM\_STATUS: ACTIVE\</p\>  
          
        \<div style="margin-top: 3rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;"\>  
            \<button class="btn-magma" onclick="document.body.className=''"\>Night: Volcanic\</button\>  
            \<button class="btn-magma" style="background: var(--color-dune-gold); color: \#000;" onclick="document.body.className='theme-dunes'"\>Day: Dunes\</button\>  
            \<button class="btn-magma" style="background: var(--color-canarian-pine); animation: none;" onclick="document.body.className='theme-ash'"\>Mode: Grayscale\</button\>  
        \</div\>  
    \</header\>

    \<section class="calima-glass"\>  
        \<h2\>1. Nightmode: The Volcanic Interior\</h2\>  
        \<p\>Inspired by the basalt rocks of Roque Nublo and the cooling magma vents. Deep blacks with high-viscosity red accents.\</p\>  
        \<div class="palette-grid"\>  
            \<div class="swatch" style="background: var(--color-basalt); color: \#fff;"\>Basalt \#111\</div\>  
            \<div class="swatch" style="background: var(--color-magma-vent); color: \#fff;"\>Vent \#CF1020\</div\>  
            \<div class="swatch" style="background: var(--color-magma-crust); color: \#fff;"\>Crust \#EB5121\</div\>  
            \<div class="swatch" style="background: var(--color-canarian-pine); color: \#fff;"\>Pine \#01796F\</div\>  
        \</div\>  
    \</section\>

    \<section class="calima-glass" style="border-top: 4px solid var(--color-dune-gold);"\>  
        \<h2 style="color: var(--color-dune-gold);"\>2. Daymode: Dunas de Maspalomas\</h2\>  
        \<p\>Capturing the heat of the sand dunes and the contrast of the Atlantic Ocean. Uses 'Calima Haze' for reduced contrast.\</p\>  
        \<div class="palette-grid"\>  
            \<div class="swatch" style="background: var(--color-dune-gold); color: \#000;"\>Dune \#E0D058\</div\>  
            \<div class="swatch" style="background: var(--color-dune-shadow); color: \#fff;"\>Shadow \#C47610\</div\>  
            \<div class="swatch" style="background: var(--color-atlantic-blue); color: \#fff;"\>Atlantic \#3399FF\</div\>  
            \<div class="swatch" style="background: var(--color-calima-haze); color: \#000;"\>Calima \#DCBCA3\</div\>  
        \</div\>  
    \</section\>

    \<section class="calima-glass heat-haze-container" style="border: 1px solid var(--color-neon-pride);"\>  
        \<h2 style="color: var(--color-neon-pride); text-shadow: 0 0 10px var(--color-neon-pride);"\>4. Contrast: Yumbo LSD Flux\</h2\>  
        \<p\>The psychedelic layer. Represents the neon lights of Maspalomas nightlife and bioluminescent plankton. Used for 'Glitch' states.\</p\>  
        \<div class="palette-grid"\>  
            \<div class="swatch" style="background: var(--color-neon-pride); color: \#fff;"\>Pride \#FF01D7\</div\>  
            \<div class="swatch" style="background: var(--color-bio-cyan); color: \#000;"\>Bio \#00EDF5\</div\>  
            \<div class="swatch" style="background: var(--color-mojo-lime); color: \#000;"\>Mojo \#F7F002\</div\>  
        \</div\>  
    \</section\>

    \<section class="calima-glass"\>  
        \<h2\>5 & 6\. Glass & Animation\</h2\>  
        \<p\>\<strong\>Glass:\</strong\> Simulates "Calima" (Saharan dust) rather than clear ice. Tinted with \#DCBCA3.\<br\>  
           \<strong\>Flow:\</strong\> The background "Mica Dust" drifts like sand in the Trade Winds.\</p\>  
        \<div style="height: 100px; margin-top: 1rem; background: var(--glass-tint); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);"\>  
            \<span style="letter-spacing: 2px;"\>CALIMA GLASS TEXTURE\</span\>  
        \</div\>  
    \</section\>

    \<footer style="text-align: center; padding: 4rem; color: var(--color-calima-haze); font-size: 0.8rem;"\>  
        GENERATED FOR GITHUB COPILOT // LOCATION: GRAN CANARIA (27.7606° N, 15.5860° W)  
    \</footer\>

\</body\>  
\</html\>

#### **Works cited**

1. Volcano Color Scheme \- Palettes \- SchemeColor.com, accessed December 19, 2025, [https://www.schemecolor.com/volcano-color-palette.php](https://www.schemecolor.com/volcano-color-palette.php)  
2. What Color is Lava? Meaning, Code & Combinations, accessed December 19, 2025, [https://piktochart.com/tips/what-color-is-lava](https://piktochart.com/tips/what-color-is-lava)  
3. Lava Color Scheme \- Palettes \- SchemeColor.com, accessed December 19, 2025, [https://www.schemecolor.com/lava.php](https://www.schemecolor.com/lava.php)  
4. Psychedelic Art Color Scheme \- Palettes \- SchemeColor.com, accessed December 19, 2025, [https://www.schemecolor.com/psychedelic-art.php](https://www.schemecolor.com/psychedelic-art.php)