# **ARPHEN: THE NEURO-SEMANTIC SCANSION ENGINE – A COMPREHENSIVE TECHNICAL AND THEORETICAL ANALYSIS**

## **1\. Introduction: The Neuro-Semantic Intervention**

The Arphen project represents a radical departure from the prevailing paradigms of digital text consumption. Defined by its creators not as an "e-reader" but as a "neuro-semantic instrument," Arphen intervenes in the attention economy by fundamentally restructuring the mechanical act of reading.1 Where traditional e-readers (Kindle, Apple Books) remediate the physical book—preserving its static layout, pagination, and linear passivity—Arphen proposes a model of "high-velocity data ingestion" mediated by local-first Artificial Intelligence.1 This report provides an exhaustive analysis of the Arphen architecture, synthesizing its psychoanalytic foundations with its implementation in browser-based machine learning, decentralized networking, and psycholinguistics.  
The central thesis of Arphen is that the biological eye, with its reliance on saccadic movement, constitutes a "cognitive bottleneck" in the processing of information.1 By coupling **Rapid Serial Visual Presentation (RSVP)** with **Entropy Modulation**—a variable pacing mechanism controlled by the perplexity calculations of a Local Large Language Model (LLM)—the system transfers the labor of pacing from the subject (the reader) to the machine (the "Exegete"). This inversion of control is not merely a user interface decision but a philosophical stance rooted in **Lacanian psychoanalysis**, specifically the concept of *scansion* or the "variable-length session".1  
This document evaluates the technical feasibility, theoretical coherence, and implementation challenges of the Arphen ecosystem. It examines the "Local-First" architecture that rejects cloud dependency in favor of "Digital Sovereignty," the utilization of **WebGPU** and **WebLLM** for on-device inference, the "Serverless" synchronization via **WebRTC** and QR codes, and the complex regulatory landscape of its proposed "Librarian" monetization model.3

### **1.1 The Shift from Consumption to Metabolism**

The terminology employed in the Arphen documentation—"ingestion," "metabolism," "injection into the nervous system"—signals a shift from the humanities-oriented view of reading as interpretation to a cybernetic view of reading as information processing.1 This aligns with the media theory of Friedrich Kittler, who posited that media determine our situation, and that the digitization of text transforms it into a data stream independent of the human sensorium.  
In the current digital ecosystem, reading is characterized by "passive consumption." The user scrolls through infinite feeds or turns static pages, their attention constantly fragmented by the "empty speech" of the interface—notifications, ads, and the surrounding clutter of the browser.1 Arphen attempts to bypass this by occupying the foveal center of the eye. It does not ask the user to read; it "reads *for* the user," projecting the semantic content directly onto the retina at speeds exceeding 600-800 words per minute (WPM).1  
This "metabolism" requires a pre-processing stage, termed "The Maw," where the raw material of the book (the EPUB or PDF) is stripped of its formatting—the "corpse of the typesetter's work"—and reduced to a pure stream of tokens.4 This act of stripping formatting is a rejection of the typographic interface that has governed reading since Gutenberg. By dissolving the page, Arphen turns the text into a temporal experience rather than a spatial one. The text becomes a signal, and the reader becomes a receiver or "pilot".6

### **1.2 Digital Sovereignty and the "Tool" Model**

A critical pillar of the Arphen philosophy is "Digital Sovereignty".1 In an era dominated by Software as a Service (SaaS), where user data is harvested, stored in the cloud, and monetized, Arphen reverts to the "Tool" model. The software is a "static artifact" that resides entirely within the browser. There are no user accounts, no tracking pixels, and no backend databases.1  
This architectural decision has profound technical implications. It necessitates that all computational heavy lifting—specifically the inference of multi-billion parameter language models—occur locally on the user's device.1 It also dictates the network topology for syncing progress between devices, forcing the adoption of a peer-to-peer, serverless architecture using WebRTC.3 By refusing to hold user data, Arphen places the burden of persistence and transfer entirely on the client-side infrastructure (IndexedDB and direct device-to-device tunnels), challenging the convenience-oriented assumptions of modern web development.3

## ---

**2\. Theoretical Framework: The Psychoanalysis of Interface**

To understand the engineering specifications of the "Scansion Engine," one must first deconstruct the psychoanalytic concepts that serve as its functional requirements. The project explicitly cites the work of Jacques Lacan as the primary driver for its pacing algorithms.1

### **2.1 Lacanian Scansion and the Violence of the Cut**

In classical psychoanalysis, the session duration was fixed (typically 50 minutes). Jacques Lacan, however, introduced the controversial technique of the **variable-length session**. He observed that the fixed duration allowed the "analysand" (patient) to fill the time with "empty speech" (*parole vide*)—the defensive, chatter-filled discourse of the Ego designed to avoid the traumatic truth of the Unconscious.2  
Lacan's intervention was to "cut" (*scansion*) the session short at a precise moment of significance—a slip of the tongue, a moment of hesitation, or the emergence of a "Full Speech" (*parole pleine*).9 This act of cutting is an act of punctuation. It retroactively confers meaning on the discourse that preceded it and forces the subject to confront the suspension of meaning. As noted in critical theory, "The 'activity' of the scansion evades" the control of the Ego, breaking the linear flow of time to reveal the structure of desire.10  
Application to the Arphen Interface:  
Arphen translates this clinical technique into a reading protocol. The "Scansion Engine" treats the text as the discourse of the Other.

* **The Acceleration (Empty Speech):** When the text is predictable, cliché, or transitional (low information entropy), the engine accelerates. It treats this as "empty speech" that does not require deep cognitive processing. The reader is pushed through these sections at high velocity, bypassing the internal monologue.1  
* **The Brake (The Cut):** When the text achieves "high philosophical density" or high perplexity—moments where the meaning is complex, unexpected, or traumatic—the engine "slams the brakes".1 This sudden deceleration is the digital equivalent of the Lacanian cut. It forces the reader to halt, to "tarry with the unconscious" of the text.11

The interface removes the agency of pacing from the user. In traditional reading, the user slows down when they *feel* like it (often due to fatigue or distraction). In Arphen, the *meaning* controls the pace.1 The machine, acting as the Analyst, determines where the significance lies based on statistical probability, enforcing a rhythm that is external to the reader's comfort.

### **2.2 The "Exigent Sadist" and the Reader**

The project documentation and related psychoanalytic literature allude to the figure of the "exigent sadist"—one who carries a "poetic knife of Lacanian scansion".11 Arphen effectively positions the software as this sadist. It subjects the reader to a relentless stream of data, denying them the ability to look away or to pause without active intervention.  
This creates a dynamic of "jouissance" (painful pleasure). The reading experience is intense, exhausting, and rhythmic. The UI specifications, which call for a "Terminal" or "Diagnostic Tool" aesthetic with "Cyber-Green or Lacanian-Red on Pitch Black," reinforce this adversarial relationship.12 The interface is not designed to be "user-friendly" in the conventional sense; it is designed to be "high-density" and demanding, treating the reader not as a consumer but as a pilot navigating a high-speed information stream.6

## ---

**3\. The Exegete: Local-First AI Architecture**

The "Backend-of-the-Mind," referred to as **The Exegete**, is the computational engine responsible for metabolizing text and generating the control signals for the RSVP display.4 Its architecture is defined by the constraints of the browser environment and the capabilities of modern hardware, specifically Apple Silicon.

### **3.1 The Technical Stack: WebLLM and WebGPU**

The feasibility of Arphen rests on the maturation of **WebGPU**, the modern web standard that grants browsers direct, low-level access to the device's Graphics Processing Unit (GPU).13 Unlike the older WebGL, which was designed for graphics and required complex translation layers for general-purpose computing, WebGPU enables efficient execution of compute shaders, making it possible to run Large Language Models (LLMs) entirely within the client.13  
WebLLM (MLC-LLM):  
Arphen utilizes WebLLM, a high-performance in-browser inference engine built on the Apache TVM stack.13 WebLLM compiles LLM weights into WebAssembly (WASM) and utilizes WebGPU for acceleration.

* **Performance:** Benchmarks indicate that an **Apple M3 Max** can decode a 4-bit quantized Llama-3-8B model at approximately **90-100 tokens per second (TPS)**.15 Even an M1 Max can sustain \~33 TPS.17 This is critical because the RSVP engine must calculate entropy *faster* than the user can read. If the user reads at 600 WPM (10 words/sec), the AI must process at least 15-20 TPS to maintain a buffer. The M-series chips, with their Unified Memory Architecture, are uniquely suited for this, allowing the GPU to access system RAM directly without costly PCIe transfers.17  
* **Quantization:** The Exegete relies on 4-bit quantization (e.g., Llama-3-8B-Instruct-q4f16\_1). This reduces the memory footprint of an 8B model to roughly 4-6GB of RAM.13 This fits comfortably within the memory limits of modern desktop browsers (Chrome/Edge allow up to 16GB or more per tab depending on system RAM), though it poses challenges for mobile devices.19

### **3.2 The Ingestion Pipeline: "The Maw"**

The ingestion process, termed "The Maw," converts raw files into actionable data.4

1. **Sanitization:** The input is typically an EPUB or PDF. Libraries like epub.js or pdf.js are used to extract raw text strings. The system aggressively strips CSS, headers, footers, and page numbers, as these are artifacts of the "corpse" of typesetting.4  
2. **Regex Scrubbing:**  
   * **Ligature Splitting:** Conversions of glyphs like ﬁ to fi are essential. LLM tokenizers (like the Byte-Pair Encoding used by Llama-3) often treat ligatures as unknown or rare tokens, which would artificially spike the entropy/perplexity score, causing the reader to slow down unnecessarily.4  
   * **Normalization:** Smart quotes are converted to ASCII to reduce token complexity.  
3. **Chunking:** The continuous text stream is broken into "Macro-Chunks" of approximately 1000 tokens.4 This size is optimized to balance the model's context window overhead with the need for narrative coherence.

### **3.3 The Pulse: Entropy and Density Calculation**

This is the central innovation of Arphen. The "Pulse" calculates the **Information Entropy** (specifically, the perplexity or surprisal) of every word to modulate the display speed.  
The Mechanism:  
For a sequence of words, the LLM predicts the probability distribution of the next token. The Surprisal $S(w)$ of a word $w$ is defined as:

$$S(w) \= \-\\log\_2 P(w | \\text{context})$$

High surprisal means low probability (high "surprise").

* **Low Entropy (High Probability):** If the sentence is "The cat sat on the...", the model predicts "mat" with 99% confidence. The surprisal is near zero. The Exegete assigns a high speed (e.g., 800 WPM).4  
* **High Entropy (Low Probability):** If the sentence is "The cat sat on the... metaphysics," the model is surprised. The probability is low (e.g., 0.01%). The surprisal is high. The Exegete assigns a low speed (e.g., 250 WPM).4

Psycholinguistic Validation:  
This approach is grounded in Surprisal Theory (Hale, 2001; Levy, 2008), which posits that the cognitive effort required to process a word is linearly proportional to its surprisal.22 Empirical studies using eye-tracking have confirmed that human reading times naturally increase when encountering high-surprisal words.22 By automating this deceleration, Arphen externalizes the brain's natural processing latency.

### **3.4 "Gonzo Mode": Generative Style Transfer**

Arphen includes a "Generative Mirror" feature called "Gonzo Mode," which rewrites text in real-time using a specific persona (e.g., "Hunter S. Thompson" or "The Pirate").1  
Context Swapping Implementation:  
This requires a "Model Handover."

1. The efficient 3B "Scanner" model (used for entropy) is paused.  
2. A larger 7B or 8B "Author" model is loaded into the pipeline.4  
3. **The Fugue Prompt:** The system injects a prompt: SYSTEM: You are the Ghost of Hunter S. Thompson. TASK: Rewrite the following chunk. Amplify paranoia..4  
4. **Sliding Window:** To maintain narrative continuity, the last 3 sentences of the *previous* rewritten chunk are injected into the context of the *current* chunk.

This feature challenges the concept of the "Author." The reader consumes a "Remix" that exists only for that session.1 Technical constraints are significant here: generating text is slower than calculating probabilities (prefill vs. decode). On an M1/M2, this might run at 10-15 tokens/second, which is too slow for real-time reading. Therefore, Arphen likely processes this in the background, filling a ring buffer ahead of the user's current position.4

## ---

**4\. The Cockpit: Interface Dynamics & RSVP Mechanics**

The user interface ("The Cockpit") rejects skeuomorphism for a "Manifesto UI" style—monospaced fonts, high-contrast colors (Cyber-Green/Lacanian-Red), and dense telemetry.6

### **4.1 The RSVP Core and Bionic Anchoring**

**Rapid Serial Visual Presentation (RSVP)** eliminates the need for saccades (eye movements), which consume \~10-15% of reading time.25 However, RSVP is criticized for causing fatigue and reducing comprehension because it removes the ability to re-read (regression) and preview upcoming words (parafoveal preview).26  
To mitigate the focus fatigue, Arphen uses **Bionic Highlighting** (Saccade Anchoring).

* **The Algorithm:** The first 30-50% of the word is rendered in **Bold White**, while the rest is Light Grey.  
* **Effect:** This artificially guides the eye to the "Optimal Viewing Position" (OVP), acting as a "fixation anchor".6 This technique, popularized by "Bionic Reading," claims to reduce the micro-saccades the eye makes while trying to focus on a word, although scientific validation is mixed compared to standard text.28

### **4.2 The "River of Text": Solving the Context Problem**

The "River of Text" is Arphen's solution to the primary failure mode of RSVP: the loss of context.6 In standard RSVP, if a user blinks or lapses attention, the word is lost.  
The Biological Overlay:  
Arphen renders the RSVP word in the center, but surrounds it with a "ghost stream":

* **Above:** The previous 3-4 lines of text, fading upwards into transparency.  
* **Below:** The next 3-4 lines, fading downwards.  
* **Visual Style:** Low contrast, ghost-like opacity.

**Functionality:**

1. **Peripheral Simulator:** It restores the parafoveal context that RSVP eliminates. Research indicates that peripheral vision plays a crucial role in reading speed and comprehension.29  
2. **Luminance Coding:** The text in the River is not uniform. It uses a "Grayscale Density Heatmap." Darker words indicate high density/entropy. The user can "see" a difficult paragraph coming up in their peripheral vision before it hits the fovea, allowing for subconscious preparation.6  
3. **Interactive Regression:** The user can tap any word in the "River" to instantly rewind the stream to that point, solving the "missing a word" problem of RSVP.6

### **4.3 The "Fill-Bar" Chapter List**

The sidebar acts as a "Processing Hub" rather than a table of contents.6

* **Visual Logic:** Chapter titles are progress bars. They fill up as the local LLM tokenizes and analyzes the text.  
* **Telemetry:** It displays "Ingest Velocity" (TPS) and "Time Bank" (reading time remaining).  
* This reinforces the "Tool" metaphor: the user is operating a machine that is actively working ("metabolizing") the text.4

## ---

**5\. The Synapse: Serverless Peer-to-Peer Network Architecture**

A major constraint identified in the Arphen documentation is the "hardware reality": while M-series MacBooks can run 8B models efficiently, mobile phones face thermal throttling and battery drain.3 To solve this, Arphen employs a **"Shovel" Companion Workflow**: the MacBook acts as the "Ingestion Engine" (compute), and the phone acts as the "Viewing Portal" (display).3

### **5.1 WebRTC Without a Signaling Server**

Syncing data between the Mac and Phone usually requires a cloud server (Signaling Server) to exchange connection details (SDP \- Session Description Protocol). This violates Arphen's "No-Cloud" rule. The solution is a **Local-First Sync Architecture** using **QR Codes** as the signaling channel.3  
**The Protocol:**

1. **Ingestion (Mac):** The Mac processes the book and generates a WebRTC Offer (SDP).  
2. **QR Display (Mac):** The SDP is encoded into a QR code displayed on the Mac screen.  
3. **Scan (Phone):** The user scans the code with the Arphen app on their phone.  
4. **Answer (Phone):** The phone generates a WebRTC Answer (SDP) and displays it as a QR code.  
5. **Scan (Mac):** The Mac scans the phone's QR code via its webcam.  
6. **Connection:** A direct P2P tunnel (WebRTC DataChannel) is established over the local Wi-Fi/LAN. The processed book data is transferred directly.3

### **5.2 The SDP Compression Challenge**

A significant technical hurdle is the data capacity of QR codes. A raw WebRTC SDP payload is large (2-3KB). A Version 40 QR code can theoretically hold \~4KB of alphanumeric data, but scanning such a dense code is slow and error-prone.33  
**Optimization Strategies:**

* **SDP Minification:** The system must strip non-essential lines from the SDP (e.g., unused codecs, global IP candidates) to reduce size.35  
* **Compression:** Using gzip or LZ-string compression on the SDP before encoding it into the QR code.  
* **Multipart QR Codes:** If the payload exceeds the reliable scanning limit, Arphen creates an animated sequence of QR codes (e.g., 3 frames looping) which the scanner captures sequentially to reconstruct the payload.36

### **5.3 Data Persistence: IndexedDB**

Once the data reaches the phone, it is stored in **IndexedDB**, the browser's persistent NoSQL storage.3

* **Storage Limits:** On Android (Chrome), a site can use up to 60-80% of free disk space.38 On iOS (Safari), the limit is typically 500MB to 1GB, and importantly, Safari imposes a **7-day eviction policy** on script-writable storage if the user does not interact with the site.39 This means Arphen users on iOS must open the app at least once a week to prevent their library from being wiped by the OS—a critical usability constraint for a "long-term" library.

## ---

**6\. The Librarian: Discovery, Ethics, and Monetization**

Arphen includes a "Librarian" chatbot to aid discovery. This component is designed to navigate the tension between open-source idealism (Project Gutenberg) and the economic necessity of affiliate revenue.5

### **6.1 The "Prescription" Engine and Gutendex**

The Librarian is a local AI agent (using a lighter model like **Mistral-7B** or **Llama-3-8B**) configured with a "System Persona": *"You are the Scansion Librarian, a knowledgeable, slightly eccentric guide"*.5  
**Workflow:**

1. The user asks for a recommendation (e.g., "Existential dread but funny").  
2. The AI generates search queries.  
3. The system calls the **Gutendex API** (a JSON wrapper for Project Gutenberg) to fetch free, public domain eBooks.5  
4. The user is presented with a "Download from Gutenberg" button, ensuring the interaction generates legitimate traffic for the archive.5

### **6.2 The "SponsorLink" System and Amazon Policy**

To monetize, the Librarian uses a "Modern Counterpart" logic.

* **The Logic:** If the AI recommends a free classic (e.g., *Moby Dick*), it also identifies a modern, copyrighted "counterpart" (e.g., *The Whale*).  
* **Link Generation:** The JavaScript layer generates an Amazon Affiliate link for the modern book: amazon.com/s?k=\&tag=scansion-20.5

Regulatory Compliance (Amazon Associates):  
This system operates in a regulatory grey area.

1. **Client-Side Software:** The Amazon Associates Operating Agreement strictly prohibits using "client-side software applications" (like browser plugins or toolbars) to generate links or redirect traffic.42 However, Arphen runs as a *web application* in a tab, not an extension. This distinction is crucial but precarious.  
2. **Offline Use:** Amazon prohibits sharing links in "offline" formats (PDFs, emails, private messages).43 Since Arphen is a Progressive Web App (PWA) designed for offline use, generating affiliate links while the device is offline (to be clicked later) might violate the requirement for accurate referrer tracking.  
3. **AI Generated Content:** Amazon has updated policies regarding AI-generated content for Kindle publishing, but for Associates, the primary concern is trademark infringement and misleading claims.44 The "SponsorLink" system mitigates this by using the AI only to *identify* the book, while the link itself leads to a generic search results page (k=), shifting the burden of specific product selection to Amazon's own search algorithm.5

## ---

**7\. Implementation Roadmap & Technical Specifications**

The development of Arphen is structured into four distinct phases, prioritizing the core reading engine before expanding to the complex network and generative features.

### **7.1 Phase 1: The Core (Desktop Only)**

* **Objective:** Achieve stable, high-velocity reading on a MacBook.  
* **Technology:** React, Vite, WebLLM (Llama-3-8B-Quantized).  
* **Key Metric:** **Tokens Per Second (TPS).** The engine must achieve \>80 TPS to calculate entropy faster than the user reads.  
* **Memory Management:** Implement the "Ring Buffer" to manage memory efficiently within the browser's constraints (typically 4GB-16GB heap depending on the browser version).4

### **7.2 Phase 2: The Synapse (Mobile Companion)**

* **Objective:** Enable "No-Cloud" sync to mobile devices.  
* **Technology:** PeerJS (WebRTC wrapper), qrcode library.  
* **Key Challenge:** **SDP Compression.** Implement LZ-string compression and multipart QR code logic to transfer the connection handshake reliably.37  
* **State Machine:** Develop the "Host" (Mac) vs. "Peer" (Phone) logic to handle the asymmetrical connection flow.

### **7.3 Phase 3: The Librarian (Monetization)**

* **Objective:** Integrate discovery and revenue.  
* **Technology:** Gutendex API, Amazon Affiliate Tagging.  
* **Prompt Engineering:** Fine-tune the Librarian's system prompt to prioritize Public Domain suggestions (Gutenberg) while accurately identifying "Modern Counterparts" for monetization without hallucinating non-existent titles.

### **7.4 Phase 4: The Art (Gonzo Mode)**

* **Objective:** Enable generative rewriting.  
* **Requirement:** Hardware gating. This feature must be disabled on devices with \<16GB RAM, as running a 7B "Author" model alongside the 3B "Scanner" model will likely crash the browser tab due to OOM (Out Of Memory) errors.47

## ---

**8\. Conclusion: The Feasibility of the Neuro-Semantic Tool**

The Arphen project is a theoretically rigorous and technically ambitious attempt to redefine digital reading. By synthesizing **Lacanian psychoanalysis** with **computational linguistics**, it proposes a reading experience that is not merely faster, but structurally different—one where the "meaning controls the pace."  
Technical Verdict:  
The project is technically feasible on high-end consumer hardware (Apple Silicon). The convergence of WebGPU, efficient quantized models (Llama-3), and high-bandwidth unified memory makes local-first AI viable for the first time. However, the constraints of mobile browsers (thermal throttling, memory eviction) necessitate the "Companion Mode" architecture, which introduces friction via the QR code handshake.  
**Critical Risks:**

1. **User Friction:** The serverless WebRTC handshake is elegant but cumbersome compared to cloud sync. It restricts the user base to "Hobbyists" and privacy advocates.3  
2. **Amazon Compliance:** The "SponsorLink" system exists in a policy grey area. A strict interpretation of Amazon's "client-side software" rule could jeopardize the monetization model.  
3. **Ergonomics:** While "Bionic Highlighting" and the "River of Text" address RSVP's deficits, extended reading at high velocity may still cause significant cognitive fatigue. The "Lacanian Cut" (entropy braking) is a brilliant theoretical solution to this, but its practical efficacy depends entirely on the accuracy of the LLM's perplexity calculations.

Ultimately, Arphen is more than software; it is a manifesto. It argues that in an age of information overload, the only way to reclaim sovereignty is to stop reading and start processing. It transforms the reader from a passive consumer into an "Exigent Sadist," demanding that the text surrender its meaning with maximum efficiency.

| Component | Technology | Role | Status |
| :---- | :---- | :---- | :---- |
| **The Cockpit** | React / TypeScript | The "Heads-Up Display" for RSVP. | Feasible |
| **The Exegete** | WebLLM / WebGPU | Local inference engine (Llama-3-8B). | Feasible (M-Series) |
| **The Synapse** | PeerJS (WebRTC) | Serverless p2p sync via QR codes. | Feasible (High Friction) |
| **Storage** | IndexedDB / RxDB | Offline-capable browser database. | Feasible (iOS Limits) |
| **Monetization** | Amazon Affiliate | Client-side link generation. | High Risk (Policy) |

*(End of Report)*

#### **Works cited**

1. arphen  
2. Maher, M. (2022) \- Symptom Invented \- Lacan in The Context of French Marxism. Doctoral Thesis, University of Essex \- Scribd, accessed December 29, 2025, [https://www.scribd.com/document/811059969/Maher-M-2022-Symptom-Invented-Lacan-in-the-Context-of-French-Marxism-Doctoral-Thesis-University-of-Essex](https://www.scribd.com/document/811059969/Maher-M-2022-Symptom-Invented-Lacan-in-the-Context-of-French-Marxism-Doctoral-Thesis-University-of-Essex)  
3. phone exchange  
4. exegete  
5. Library  
6. RSVP  
7. 0983386722 | PDF | Xhtml | Html \- Scribd, accessed December 29, 2025, [https://www.scribd.com/document/368559009/0983386722](https://www.scribd.com/document/368559009/0983386722)  
8. Symptom Invented: Lacan in the Context of French Marxism Max Maher A thesis submitted for the degree of PhD in Psychoanalytic St \- Essex Research Repository, accessed December 29, 2025, [https://repository.essex.ac.uk/34549/1/Max%20Maher%20-%20PhD%20Thesis%20-%20Symptom%20Invented.pdf](https://repository.essex.ac.uk/34549/1/Max%20Maher%20-%20PhD%20Thesis%20-%20Symptom%20Invented.pdf)  
9. The Function and Field of Scansion in Jacques Lacan's Poetics of Speech | PDF \- Scribd, accessed December 29, 2025, [https://www.scribd.com/document/457782361/The-Function-and-Field-of-Scansion-in-Jacques-Lacan-s-Poetics-of-Speech](https://www.scribd.com/document/457782361/The-Function-and-Field-of-Scansion-in-Jacques-Lacan-s-Poetics-of-Speech)  
10. Transforming Violence through Artistic Practice in Cold War America, 1945-1975 \- Kent Academic Repository, accessed December 29, 2025, [https://kar.kent.ac.uk/81869/1/264Transforming\_Violence\_through\_Artistic\_Practice\_in\_Cold\_War\_America\_1945-75.p.pdf](https://kar.kent.ac.uk/81869/1/264Transforming_Violence_through_Artistic_Practice_in_Cold_War_America_1945-75.p.pdf)  
11. Saketopoulou avec Lacan \- Issuu, accessed December 29, 2025, [https://issuu.com/divisionreview/docs/dr2022\_32pages\_11\_6\_24/s/60507953](https://issuu.com/divisionreview/docs/dr2022_32pages_11_6_24/s/60507953)  
12. UI/UX  
13. mlc-ai/web-llm: High-performance In-browser LLM Inference Engine \- GitHub, accessed December 29, 2025, [https://github.com/mlc-ai/web-llm](https://github.com/mlc-ai/web-llm)  
14. \[2412.15803\] WebLLM: A High-Performance In-Browser LLM Inference Engine \- arXiv, accessed December 29, 2025, [https://arxiv.org/abs/2412.15803](https://arxiv.org/abs/2412.15803)  
15. WebLLM: A High-Performance In-Browser LLM Inference Engine \- arXiv, accessed December 29, 2025, [https://arxiv.org/html/2412.15803v1](https://arxiv.org/html/2412.15803v1)  
16. WebLLM: A High-Performance In-Browser LLM Inference Engine \- ResearchGate, accessed December 29, 2025, [https://www.researchgate.net/publication/387321297\_WebLLM\_A\_High-Performance\_In-Browser\_LLM\_Inference\_Engine](https://www.researchgate.net/publication/387321297_WebLLM_A_High-Performance_In-Browser_LLM_Inference_Engine)  
17. On Device Llama 3.1 with Core ML \- Apple Machine Learning Research, accessed December 29, 2025, [https://machinelearning.apple.com/research/core-ml-on-device-llama](https://machinelearning.apple.com/research/core-ml-on-device-llama)  
18. The Best Local LLMs To Run On Every Mac (Apple Silicon) \- ApX Machine Learning, accessed December 29, 2025, [https://apxml.com/posts/best-local-llm-apple-silicon-mac](https://apxml.com/posts/best-local-llm-apple-silicon-mac)  
19. It is time to remove the 4G/tab limitation \[40691287\] \- Chromium Issue, accessed December 29, 2025, [https://issues.chromium.org/40691287](https://issues.chromium.org/40691287)  
20. How much the memory limitation is on the iOS device browser? \- Stack Overflow, accessed December 29, 2025, [https://stackoverflow.com/questions/74506298/how-much-the-memory-limitation-is-on-the-ios-device-browser](https://stackoverflow.com/questions/74506298/how-much-the-memory-limitation-is-on-the-ios-device-browser)  
21. Perplexity \- Wikipedia, accessed December 29, 2025, [https://en.wikipedia.org/wiki/Perplexity](https://en.wikipedia.org/wiki/Perplexity)  
22. Lexical Predictability during Natural Reading: Effects of Surprisal and Entropy Reduction \- PMC \- PubMed Central, accessed December 29, 2025, [https://pmc.ncbi.nlm.nih.gov/articles/PMC5988918/](https://pmc.ncbi.nlm.nih.gov/articles/PMC5988918/)  
23. The Linearity of the Effect of Surprisal on Reading Times across Languages, accessed December 29, 2025, [https://aclanthology.org/2023.findings-emnlp.1052/](https://aclanthology.org/2023.findings-emnlp.1052/)  
24. The Effect of Surprisal on Reading Times in Information Seeking and Repeated Reading \- ACL Anthology, accessed December 29, 2025, [https://aclanthology.org/2024.conll-1.17.pdf](https://aclanthology.org/2024.conll-1.17.pdf)  
25. Bionic Reading: Supercharge Your Reading Speed and Comprehension | by Rohan Singh, accessed December 29, 2025, [https://medium.com/@rohansingh9814725/bionic-reading-supercharge-your-reading-speed-and-comprehension-4dca2b8f623d](https://medium.com/@rohansingh9814725/bionic-reading-supercharge-your-reading-speed-and-comprehension-4dca2b8f623d)  
26. Benefits of rapid serial visual presentation (RSVP) over scrolled text vary with letter size, accessed December 29, 2025, [https://pubmed.ncbi.nlm.nih.gov/9547800/](https://pubmed.ncbi.nlm.nih.gov/9547800/)  
27. Modern Speed-Reading Apps Do Not Foster Reading Comprehension \- PubMed, accessed December 29, 2025, [https://pubmed.ncbi.nlm.nih.gov/29461715/](https://pubmed.ncbi.nlm.nih.gov/29461715/)  
28. What Are The Best Speed Reading Apps 2025?, accessed December 29, 2025, [https://www.speedreadinglounge.com/speed-reading-apps](https://www.speedreadinglounge.com/speed-reading-apps)  
29. Are the benefits of sentence context different in central and peripheral vision? \- PubMed, accessed December 29, 2025, [https://pubmed.ncbi.nlm.nih.gov/10566861/](https://pubmed.ncbi.nlm.nih.gov/10566861/)  
30. Peripheral vision and pattern recognition: A review | JOV | ARVO Journals, accessed December 29, 2025, [https://jov.arvojournals.org/article.aspx?articleid=2191825](https://jov.arvojournals.org/article.aspx?articleid=2191825)  
31. Shared Secret Authentication | Nabto WebRTC Security, accessed December 29, 2025, [https://docs.nabto.com/developer/webrtc/guides/security/shared-secret-auth.html](https://docs.nabto.com/developer/webrtc/guides/security/shared-secret-auth.html)  
32. Qivex/webrtc-via-qr: Establish a WebRTC connection by scanning QR codes \- GitHub, accessed December 29, 2025, [https://github.com/Qivex/webrtc-via-qr](https://github.com/Qivex/webrtc-via-qr)  
33. Crow API: Cross-device I/O Sharing in Web Applications \- Mobile Embedded System Laboratory, Yonsei University, accessed December 29, 2025, [https://mobed.yonsei.ac.kr/mobed\_pages/pdf/index.php?name=INFOCOM23-Crow](https://mobed.yonsei.ac.kr/mobed_pages/pdf/index.php?name=INFOCOM23-Crow)  
34. How Much Data Can a QR Code Hold? \- Uniqode, accessed December 29, 2025, [https://www.uniqode.com/blog/qr-code/how-much-data-can-qr-code-hold](https://www.uniqode.com/blog/qr-code/how-much-data-can-qr-code-hold)  
35. I made a library to shorten WebRTC SDP and compress it. \- Reddit, accessed December 29, 2025, [https://www.reddit.com/r/WebRTC/comments/134ht8o/i\_made\_a\_library\_to\_shorten\_webrtc\_sdp\_and/](https://www.reddit.com/r/WebRTC/comments/134ht8o/i_made_a_library_to_shorten_webrtc_sdp_and/)  
36. Serverless WebRTC using QR codes \- Franklin Ta, accessed December 29, 2025, [https://franklinta.com/2014/10/19/serverless-webrtc-using-qr-codes/](https://franklinta.com/2014/10/19/serverless-webrtc-using-qr-codes/)  
37. QR Transfer Protocols \- Orion Reed, accessed December 29, 2025, [https://www.orionreed.com/posts/qrtp/](https://www.orionreed.com/posts/qrtp/)  
38. Storage quotas and eviction criteria \- Web APIs \- MDN Web Docs, accessed December 29, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Storage\_API/Storage\_quotas\_and\_eviction\_criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)  
39. Storage for the web | Articles \- web.dev, accessed December 29, 2025, [https://web.dev/articles/storage-for-the-web](https://web.dev/articles/storage-for-the-web)  
40. Does Edge/Safari have a limit on Indexeddb size? \- Stack Overflow, accessed December 29, 2025, [https://stackoverflow.com/questions/51405660/does-edge-safari-have-a-limit-on-indexeddb-size](https://stackoverflow.com/questions/51405660/does-edge-safari-have-a-limit-on-indexeddb-size)  
41. Most Reliable APIs \- Free Public APIs, accessed December 29, 2025, [https://www.freepublicapis.com/tags/reliable](https://www.freepublicapis.com/tags/reliable)  
42. Amazon Associates Program Policies, accessed December 29, 2025, [https://affiliate-program.amazon.com/help/operating/policies](https://affiliate-program.amazon.com/help/operating/policies)  
43. What are the top do's and don'ts of the Operating Agreement? \- Amazon.sg Associates Central \- Help, accessed December 29, 2025, [https://affiliate-program.amazon.sg/help/node/topic/G5CHSDWVK9JWVXRK](https://affiliate-program.amazon.sg/help/node/topic/G5CHSDWVK9JWVXRK)  
44. Associates Operating Agreement – What's Changed, accessed December 29, 2025, [https://affiliate-program.amazon.com/help/operating/compare](https://affiliate-program.amazon.com/help/operating/compare)  
45. Did everyone get this? What is changing exactly : r/Amazon\_Influencer \- Reddit, accessed December 29, 2025, [https://www.reddit.com/r/Amazon\_Influencer/comments/1nvn5zx/did\_everyone\_get\_this\_what\_is\_changing\_exactly/](https://www.reddit.com/r/Amazon_Influencer/comments/1nvn5zx/did_everyone_get_this_what_is_changing_exactly/)  
46. How To Use Amazon Hidden Keywords To Increase Product Discoverability, accessed December 29, 2025, [https://www.searchenginejournal.com/amazon-hidden-keywords/234755/](https://www.searchenginejournal.com/amazon-hidden-keywords/234755/)  
47. WebLLM supports Llama 2 70B now \- Simon Willison's Weblog, accessed December 29, 2025, [https://simonwillison.net/2023/Aug/30/webllm-supports-llama-2-70b-now/](https://simonwillison.net/2023/Aug/30/webllm-supports-llama-2-70b-now/)  
48. Tried running llama-70b on 126GB of memory; memory overflow. How much memory is necessary ? : r/LocalLLaMA \- Reddit, accessed December 29, 2025, [https://www.reddit.com/r/LocalLLaMA/comments/15lxscb/tried\_running\_llama70b\_on\_126gb\_of\_memory\_memory/](https://www.reddit.com/r/LocalLLaMA/comments/15lxscb/tried_running_llama70b_on_126gb_of_memory_memory/)