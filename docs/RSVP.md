This is the design specification for the **Scansion Interface** (codenamed "The Cockpit"). It is designed to look less like an e-reader and more like a high-performance instrument for data ingestion.

### **1. The HUD: Landscape "Cognitive Cockpit"**

The interface is strictly **landscape-first** (desktop or horizontal phone). It divides the screen into a "Control Zone" (Left) and a "Focus Zone" (Center).

#### **A. The Left Sidebar (The Processing Hub)**

This is not just a table of contents; it is a live monitor of the AI's "digestion" process.

* **Hide/Show Toggle:** A minimal chevron (`<` / `>`) allows the user to collapse this entirely for "Zen Mode."  
* **The "Fill-Bar" Chapter List:**  
  * Instead of a static list, each Chapter Title is its own progress bar.  
  * **Visual Logic:** As the local LLM cleans and annotates Chapter 1, the background of the "Chapter 1" list item fills up with a subtle color (e.g., steel blue or slate grey) from left to right.  
  * **User Feedback:** The user instantly sees which chapters are "Ready to Read" (100% filled) and which are still being processed (animating).  
* **The Metrics Console (Bottom of Sidebar):** A fixed footer in the sidebar displaying real-time telemetry:  
  * **Neural Engine:** `[Llama-3-8B-Q4]` (Click to swap model).  
  * **Ingest Velocity:** `~85 TPS` (Updates dynamically based on the last chunk parsed).  
  * **Buffer Status:** "Chapter 5 Ready in 12s."  
  * **Time Bank:** "3h 42m of reading available" (Calculated based on your current 600 WPM average).

#### **B. Utility Controls**

* **Location:** Anchored at the bottom-left of the sidebar (or floating bottom-left if sidebar is hidden).  
* **[ ⚙️ Settings ]:** Opens the "Cockpit" (Persona, Pacing Rules, etc.).  
* **[ 📚 Library ]:** Opens the Librarian Chat / Gutenberg Search overlay.

---

### **2. The Focus Zone (The Flow Reader)**

The center of the screen is the "Foveal Stage." Unlike traditional RSVP (Spritz), we do not use a single static box. Instead, we use a **Flowing Text Stream**.

* **The Stream:**  
  * Text flows naturally, left-aligned, from top to bottom.
  * It resembles a standard paragraph view but is optimized for rapid serial processing.
  * **Low Visibility Context:** The lines above and below the current reading line are visible but dimmed (low opacity). This provides context without distraction.

* **The Active Line:**
  * The reader moves **row by row**. The view scrolls vertically to keep the active line in the "sweet spot" (center-ish).
  * **Word Highlighting:** Within the active line, the "current word" is highlighted in the background (e.g., a subtle block or underline). This highlight moves horizontally across the line as the reader progresses.
  * **Bionic Reading:** The current word (and potentially surrounding words) uses Bionic Reading (bold start) to anchor the eye.

* **Adaptive WPM (The "Breathing" Engine):**  
  * The speed is not constant. It breathes based on text density and punctuation.
  * **Punctuation Pacing:** Full stops, commas, and complex clauses trigger micro-pauses.
  * **Density Pacing:** AI-analyzed "dense" sections slow down the stream automatically.

---

### **3. Interaction & Control (The "Karaoke" Mode)**

This solves the #1 issue with RSVP (losing context/control). The interface invites interaction.

* **Hover-to-Pause:**  
  * When the mouse cursor enters the text area (above or below the current word), the stream **instantly pauses**.
  * **Brightening:** The dimmed context lines brighten to full opacity, allowing the user to read the surrounding paragraph normally.
  * **Click-to-Play:** To resume, the user simply clicks the word they want to start from (or the currently highlighted word).

* **Scrolling Zones:**
  * Small, stylized shaded areas at the top and bottom (or sides) of the text view act as "scroll zones."
  * Moving the cursor into these zones scrolls the text line-by-line backwards or forwards, allowing for rapid skimming or regression.

* **Minimalist UI:**
  * **No "Engage" Button:** The text itself is the control. Click to play/pause.
  * **Symbolic Controls:** Minimal icons for essential actions only.
  * **Subtitle Header:** The book title and chapter title appear discreetly in the top bar, keeping the focus on the stream.

---

### **4. Summary of User Flow**

1. **Load:** User opens app. Sidebar shows processing status.
2. **Read:** User clicks the first word. The highlight begins moving across the line.
3. **Flow:** As the highlight reaches the end of a line, the text scrolls up one row. The highlight jumps to the start of the new center line.
4. **Interact:** User misses a detail. They move the mouse over the text. The stream pauses, the text brightens. They read the previous sentence.
5. **Resume:** User clicks the word where they left off. The stream resumes.
6. **Skim:** User moves mouse to the top "scroll zone" to quickly rewind a few paragraphs.

This interface turns reading into a **guided flow**, blending the speed of RSVP with the context of traditional reading.