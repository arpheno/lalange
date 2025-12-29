This is the technical specification for **The Exegete**. It serves as the "Backend-of-the-Mind," running invisibly on the host machine (MacBook) to feed the "Front-of-the-Eye" (The Reader).

In the **Arphen** ecosystem, we do not "parse" text; we "metabolize" it.

---

# **THE EXEGETE: System Architecture & Ingestion Protocol**

**Status:** `v0.1 (Alpha)` | **Maintainer:** `Arphen` | **License:** `AGPLv3`

## **I. Abstract**

The Exegete is a local-first, browser-based **neuro-semantic pre-processor**. It exists to solve the "Latency Problem" of reading. By the time the biological eye sees a word, The Exegete has already read it, calculated its information entropy, determined its optimal display duration, and—if requested—rewritten it to be more interesting.

It runs entirely in a **Service Worker** on the host device, utilizing **WebGPU (MLC-LLM)** to interface directly with the Apple Silicon Neural Engine without requiring a Python installation.

---

## **II. Ingestion Phase: "The Maw"**

Before a book can be read, it must be stripped of its formatting—the "corpse" of the typesetter's work.

### **1\. The Sanitizer**

* **Input:** `.epub` / `.pdf` (via `epub.js` or `pdf.js` worker).  
* **De-Formatting:** The engine strips CSS, headers, footers, and page numbers.  
* **Regex Scrubber:**  
  * *Ligature Splitter:* Converts `ﬁ` to `fi` (vital for tokenization).  
  * *Smart Quote Normalizer:* Converts curly quotes to ASCII (reduces token complexity).  
  * *Whitespace Collapse:* Reduces all multiple spaces to singletons.

### **2\. The Chunker**

Text is broken into **Semantic Packets** rather than arbitrary byte-chunks.

* **Logic:** Split by `\n` (paragraph).  
* **Grouping:** Paragraphs are grouped into "Macro-Chunks" of roughly **1000 tokens** (optimal context window for the 8B model).  
* **Output:** A JSON array of raw text blocks, ready for the neural pass.

---

## **III. The Annotation Loop: "The Pulse"**

This is the core background process. The Exegete runs about 50–100 chunks *ahead* of the user's current reading position.

**Model:** `Llama-3.2-3B-Instruct-q4f16_1` (Fast, low VRAM usage).

### **1\. Entropy & Density Calculation**

The RSVP engine needs to know how fast to flash a word. The Exegete calculates this by measuring "Perplexity" (Surprise).

* **The Method:** The model performs a single forward pass on the chunk.  
* **The Metric:** We extract the **Logits** (probability scores) for each token.  
* **The "Density Score":**  
  * If the model predicts the next word with 99% confidence (e.g., "The cat sat on the..."), **Entropy is Low**. Speed \= **800 WPM**.  
  * If the model is surprised (e.g., "The cat sat on the... *metaphysics*"), **Entropy is High**. Speed \= **250 WPM**.  
* **The Artifact:** A `density_map` array is generated: `[0.1, 0.1, 0.9, 0.4...]`.

### **2\. Bionic Fixation Points**

Simultaneously, a lightweight non-LLM script (Regex/Algorithmic) calculates the **Saccade Anchor**.

* **Algorithm:** Bold the first `Min(3, floor(length * 0.4))` characters of every word.  
* **Result:** `[Meta]physics` \-\> **Meta**physics.

---

## **IV. The Gonzo Mutation: "The Hallucination"**

When the user activates **"Style Transfer"** (e.g., *Alice in Berghain*), The Exegete performs a "Model Handover."

### **1\. The Context Swap**

* **State:** User enters "Gonzo Mode."  
* **Action:** The 3B "Scanner" model is paused. If VRAM is sufficient (M3 Max), the **8B** or **70B** "Author" model is loaded into a parallel WebGPU pipeline.  
* **The Sliding Window:** To maintain narrative coherence (or the illusion of it), The Exegete injects the *last 3 sentences* of the previous chunk into the System Prompt of the new chunk.

### **2\. The "Fugue" Prompt**

The prompt is dynamically assembled based on the active persona:

Plaintext  
SYSTEM: You are the Ghost of Hunter S. Thompson.  
INPUT CONTEXT: "...and then Alice fell down the hole."  
TASK: Rewrite the following chunk. Amplify paranoia. Increase velocity.  
RAW CHUNK: \[Insert Text\]

* **Output:** The transformed text replaces the original text in the buffer. The `density_map` is recalculated on the *new* text.

---

## **V. Buffering & Handover: "The Synapse"**

How the data moves from the invisible backend to the visible screen.

### **1\. The Ring Buffer**

The Exegete maintains a **Ring Buffer** of 50 processed chunks.

* **Read Head:** Where the user is looking.  
* **Write Head:** Where the AI is working (future).  
* **Garbage Collection:** As the user finishes Chunk 1, it is dropped from memory to free up context for Chunk 51\.  
* g.

---

### **Developer Note:**

*"The Exegete is designed to run hot. If the user's MacBook fans spin up, it is working. We are trading electricity for cognitive velocity."* — Arphen

