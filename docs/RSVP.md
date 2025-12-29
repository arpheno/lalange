This is the design specification for the **Scansion Interface** (codenamed "The Cockpit"). It is designed to look less like an e-reader and more like a high-performance instrument for data ingestion.

### **1\. The HUD: Landscape "Cognitive Cockpit"**

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
* **\[ ⚙️ Settings \]:** Opens the "Cockpit" (Persona, Pacing Rules, etc.).  
* **\[ 📚 Library \]:** Opens the Librarian Chat / Gutenberg Search overlay.

---

### **2\. The Focus Zone (The RSVP Core)**

The center of the screen is the "Foveal Stage." This is where the actual reading happens.

* **The Redicle / Anchor:**  
  * The word appears dead-center.  
  * **Bionic Highlighting:** The first 30–50% of the word is **Bold White**; the rest is **Light Grey**. This anchors the saccade immediately.  
* **Adaptive WPM (The "Breathing" Engine):**  
  * The speed is not constant. It breathes.  
  * There is a speed dial that provides a rough estimate, and we’re going to modify that speed by using an llm to annotate the text, this is described in a different document “editor”  
  * We need to have some javascript rule based duration changing as we’re probably gonna do full stops commas and other punctuation (imagine hyphenated words, i probably need a full second to read that)

---

### **3\. The Biological Overlay (The Context Field)**

This solves the \#1 issue with RSVP (losing context). It is a "Peripheral Vision" simulator surrounding the central word.

* **The "River" of Text:**  
  * **Above the RSVP line:** The previous 3–4 lines of text fade upwards into transparency.  
  * **Below the RSVP line:** The next 3–4 lines of text fade downwards.  
  * **Visual Style:** It is **not** high-contrast. It is subtle, ghost-like, and "biologically overlaid" (perhaps using a serif font for the river while the RSVP uses sans-serif).  
* **Grayscale Density Heatmap:**  
  * The flowing text isn't just one color. It uses **Luminance Coding**.  
  * **Simple Text:** Rendered in standard cool grey.  
  * **Dense Text:** Rendered in a darker, "heavier" charcoal or slate.  
  * *Result:* You can subconsciously "see" a difficult paragraph coming up before you reach it.  
* **Interactive Regression:**  
  * **Tap-to-Seek:** If you miss a detail, you don't need a rewind button. You just **tap the word** in the "River" above. The RSVP engine instantly snaps to that location and pauses.  
* **The "Analyst" Hover:**  
  * Hovering over any word in the River triggers a tiny tooltip superscript (e.g., `Entropy: 0.92`), showing exactly why the AI decided to slow down there.

---

### **4\. Summary of User Flow**

1. **Load:** User opens app. Sidebar shows "Chapter 1" filling up rapidly (processed by Qwen-0.5B).  
2. **Read:** User hits Spacebar. Words flash in the center. The "River" flows gently behind it.  
3. **Slow Down:** The text hits a philosophical knot. The RSVP slows down. The River text turns a darker shade of grey.  
4. **Glitch:** User blinks and misses a word. They tap the sentence floating just above the center. The stream rewinds instantly.  
5. **Finish:** Chapter 1 ends. The screen fades. The Sidebar shows Chapter 2 is already 100% processed and ready.

This interface turns reading into **piloting**.