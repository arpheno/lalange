# **ARPHEN: THE NEURO-SEMANTIC SCANSION ENGINE — A DEEP TECHNICAL ANALYSIS OF FORWARD-PASS ARCHITECTURES AND PSYCHODYNAMIC PACING**

## **1\. Introduction: The Neuro-Semantic Intervention**

The Arphen project represents a radical departure from the prevailing paradigms of digital text consumption, proposing not merely an "e-reader" but a "neuro-semantic instrument" designed to fundamentally restructure the mechanical act of reading.1 Where traditional e-readers, such as Kindle or Apple Books, remediate the physical book by preserving its static layout, pagination, and linear passivity, Arphen intervenes in the attention economy by establishing a cybernetic loop between the reader's nervous system and a local Artificial Intelligence. This report provides an exhaustive, expert-level analysis of the Arphen architecture, specifically addressing the critical engineering challenge of extracting semantic density signals—Perplexity and Entropy—directly from the **Forward Pass** of a Large Language Model (LLM) without incurring the computational latency of autoregressive text generation.  
The central thesis of Arphen is that the biological eye, with its reliance on saccadic movement, constitutes a "cognitive bottleneck" in the processing of information.1 By coupling **Rapid Serial Visual Presentation (RSVP)** with **Entropy Modulation**—a variable pacing mechanism controlled by the perplexity calculations of a Local LLM—the system transfers the labor of pacing from the subject (the reader) to the machine (the "Exegete"). This inversion of control is not merely a user interface decision but a philosophical stance rooted in **Lacanian psychoanalysis**, specifically the concept of **scansion** or the "variable-length session".1  
To achieve this, the system requires a real-time signal of "textual density." The initial architectural assumption—that the model must "read along" with the user in a generative mode—introduces significant latency and computational waste. The user's query, "can we get the values directly from forward pass or something," identifies the precise optimization required to make this system viable on consumer hardware. This report validates that intuition: shifting from an **Autoregressive Decoding** paradigm (writing) to a **Prefill-Based Scoring** paradigm (reading) allows for the parallel processing of text at speeds exceeding 500-1000 tokens per second, far outpacing human reading speeds and enabling a "look-ahead" buffer that ensures smooth, responsive pacing.3  
This document evaluates the technical feasibility, theoretical coherence, and implementation challenges of this "Forward Pass" ecosystem. It examines the "Local-First" architecture that rejects cloud dependency in favor of "Digital Sovereignty," the utilization of **WebGPU** and **WebLLM** for on-device inference, the extraction of logprobs and hidden\_states for density mapping, and the psycholinguistic validity of using **Surprisal Theory** as a proxy for cognitive load.4

### **1.1 The Shift from Consumption to Metabolism**

The terminology employed in the Arphen documentation—"ingestion," "metabolism," "injection into the nervous system"—signals a shift from the humanities-oriented view of reading as interpretation to a cybernetic view of reading as information processing.1 This aligns with the media theory of Friedrich Kittler, who posited that media determine our situation, and that the digitization of text transforms it into a data stream independent of the human sensorium.  
In the current digital ecosystem, reading is characterized by "passive consumption." The user scrolls through infinite feeds or turns static pages, their attention constantly fragmented by the "empty speech" of the interface—notifications, ads, and the surrounding clutter of the browser.1 Arphen attempts to bypass this by occupying the foveal center of the eye. It does not ask the user to read; it "reads *for* the user," projecting the semantic content directly onto the retina at speeds exceeding 600-800 words per minute (WPM).1  
This "metabolism" requires a pre-processing stage, termed "The Maw," where the raw material of the book (the EPUB or PDF) is stripped of its formatting—the "corpse of the typesetter's work"—and reduced to a pure stream of tokens.1 By dissolving the page, Arphen turns the text into a temporal experience rather than a spatial one. The text becomes a signal, and the reader becomes a receiver or "pilot".1  
To sustain this metabolic rate, the underlying computational engine must be exceptionally efficient. A standard generative loop, which predicts the next token, samples it, and appends it to the context, is inherently sequential and memory-bound. It is akin to typing out the book one letter at a time to understand it. The "Forward Pass" approach, conversely, is akin to glancing at a whole page at once. It processes the entire sequence in parallel, calculating the probability of every existing word simultaneously. This shift from sequential generation to parallel evaluation is the key to unlocking the "Neuro-Semantic" potential of the tool.

### **1.2 Digital Sovereignty and the "Tool" Model**

A critical pillar of the Arphen philosophy is "Digital Sovereignty".1 In an era dominated by Software as a Service (SaaS), where user data is harvested, stored in the cloud, and monetized, Arphen reverts to the "Tool" model. The software is a "static artifact" that resides entirely within the browser. There are no user accounts, no tracking pixels, and no backend databases.1  
This architectural decision has profound technical implications. It necessitates that all computational heavy lifting—specifically the inference of multi-billion parameter language models—occur locally on the user's device.1 It also dictates the network topology for syncing progress between devices, forcing the adoption of a peer-to-peer, serverless architecture using WebRTC.1 By refusing to hold user data, Arphen places the burden of persistence and transfer entirely on the client-side infrastructure (IndexedDB and direct device-to-device tunnels), challenging the convenience-oriented assumptions of modern web development.  
The "Forward Pass" architecture reinforces this sovereignty. By relying on local computation for density scoring, we eliminate the need to send text to an OpenAI or Anthropic API for analysis. This not only preserves privacy—essential for a tool that might process sensitive or personal texts—but also eliminates the latency and cost associated with API calls. The user owns the "pipe," and the "physics" of the reading experience are determined solely by the capabilities of their local silicon.2

## ---

**2\. Theoretical Framework: The Psychoanalysis of Interface**

To understand the engineering specifications of the "Scansion Engine," one must first deconstruct the psychoanalytic concepts that serve as its functional requirements. The project explicitly cites the work of Jacques Lacan as the primary driver for its pacing algorithms.1 The move to a "Forward Pass" architecture must be validated not just technically, but theoretically: does calculating perplexity without generation still fulfill the function of the "Cut"?

### **2.1 Lacanian Scansion and the Violence of the Cut**

In classical psychoanalysis, the session duration was fixed (typically 50 minutes). Jacques Lacan, however, introduced the controversial technique of the **variable-length session**. He observed that the fixed duration allowed the "analysand" (patient) to fill the time with "empty speech" (*parole vide*)—the defensive, chatter-filled discourse of the Ego designed to avoid the traumatic truth of the Unconscious.1  
Lacan's intervention was to "cut" (*scansion*) the session short at a precise moment of significance—a slip of the tongue, a moment of hesitation, or the emergence of a "Full Speech" (*parole pleine*).1 This act of cutting is an act of punctuation. It retroactively confers meaning on the discourse that preceded it and forces the subject to confront the suspension of meaning. As noted in critical theory, "The 'activity' of the scansion evades" the control of the Ego, breaking the linear flow of time to reveal the structure of desire.  
Application to the Arphen Interface:  
Arphen translates this clinical technique into a reading protocol. The "Scansion Engine" treats the text as the discourse of the Other.

* **The Acceleration (Empty Speech):** When the text is predictable, cliché, or transitional (low information entropy), the engine accelerates. It treats this as "empty speech" that does not require deep cognitive processing. The reader is pushed through these sections at high velocity, bypassing the internal monologue.1  
* **The Brake (The Cut):** When the text achieves "high philosophical density" or high perplexity—moments where the meaning is complex, unexpected, or traumatic—the engine "slams the brakes".1 This sudden deceleration is the digital equivalent of the Lacanian cut. It forces the reader to halt, to "tarry with the unconscious" of the text.

The interface removes the agency of pacing from the user. In traditional reading, the user slows down when they *feel* like it (often due to fatigue or distraction). In Arphen, the *meaning* controls the pace.1 The machine, acting as the Analyst, determines where the significance lies based on statistical probability, enforcing a rhythm that is external to the reader's comfort.  
The "Forward Pass" calculation of perplexity is the perfect mathematical homologue to this process. Perplexity measures "surprisal"—the degree to which the current word deviates from the expected pattern of language. A high perplexity score indicates a rupture in the predictable flow of signifiers, a moment where the text introduces something "Real" that resists symbolic integration. By coupling the brake to this signal, Arphen automates the Lacanian cut.

### **2.2 The "Exigent Sadist" and the Reader**

The project documentation and related psychoanalytic literature allude to the figure of the "exigent sadist"—one who carries a "poetic knife of Lacanian scansion".1 Arphen effectively positions the software as this sadist. It subjects the reader to a relentless stream of data, denying them the ability to look away or to pause without active intervention.  
This creates a dynamic of "jouissance" (painful pleasure). The reading experience is intense, exhausting, and rhythmic. The UI specifications, which call for a "Terminal" or "Diagnostic Tool" aesthetic with "Cyber-Green or Lacanian-Red on Pitch Black," reinforce this adversarial relationship.1 The interface is not designed to be "user-friendly" in the conventional sense; it is designed to be "high-density" and demanding, treating the reader not as a consumer but as a pilot navigating a high-speed information stream.1  
Crucially, the "Forward Pass" architecture enhances this "sadistic" precision. Because the prefill phase is so fast, the system can look ahead hundreds of words in milliseconds. It knows exactly when the "trauma" (the complex sentence) is coming. It can visualize the "density map" of the upcoming paragraph in the peripheral "River of Text" before the reader even reaches it.1 This omniscience allows the system to control the pacing with absolute authority, eliminating the lag that would occur if it were trying to "read along" in real-time generation mode.

## ---

**3\. The Computational Paradigm: From Autoregression to Spectral Analysis**

To operationalize the user's request for "smarter ways" to extract values, we must analyze the fundamental difference between how LLMs are typically used (generation) and how Arphen needs to use them (analysis). This distinction maps directly to the hardware concepts of **Prefill** and **Decode**.

### **3.1 The Physics of Prefill vs. Decode**

LLM inference is a two-stage process, and understanding the physics of these stages is critical for optimizing Arphen on consumer hardware like Apple Silicon.3  
1\. The Prefill Phase (The Forward Pass):  
This is the "reading" phase. The model takes a sequence of input tokens (the prompt) and processes them all simultaneously.

* **Mechanism:** It converts tokens to embeddings, passes them through the Transformer layers (Attention \+ Feed-Forward Networks), and computes the Key-Value (KV) cache for the entire sequence.  
* **Performance:** This phase is **Compute-Bound**. Because it processes large matrices (batch processing of tokens), it can fully saturate the parallel compute cores (ALUs) of the GPU. It is highly efficient. On an M3 Max, prefill speeds can exceed **500–1000 tokens per second**.7  
* **Relevance to Arphen:** Since Arphen already possesses the text of the book, it can feed the text into the model as a "prompt." The model effectively "reads" the chunk in one go.

2\. The Decode Phase (Autoregression):  
This is the "writing" phase. The model generates one token at a time, appending it to the sequence and feeding it back in.

* **Mechanism:** It predicts the next token, samples it, and repeats. This is inherently serial; token $n+1$ cannot be computed until token $n$ is generated.  
* **Performance:** This phase is **Memory-Bound**. For every single token generated, the entire weight of the model (e.g., 6GB for an 8B quantized model) must be moved from memory to the compute units. The GPU spends most of its time waiting for data transfer, not calculating. Speeds are typically **30–100 tokens per second** on Apple Silicon.1  
* **Relevance to Arphen:** Using this mode to "analyze" text is wasteful. We would be asking the model to hallucinate the book word by word, just to check if it matches the original. This introduces unnecessary latency, heat, and battery drain.

The Strategic Pivot:  
The user's query correctly identifies that we should abandon the Decode phase entirely for the Scansion Engine. We treat the book as a series of "prompts" to be prefilled. We extract the metrics (logits/embeddings) during the highly efficient Prefill phase. This moves the bottleneck from Memory Bandwidth (slow) to Compute (fast), unlocking real-time analysis capabilities even on lower-tier hardware.

### **3.2 The Waste of Autoregression**

To illustrate the inefficiency of the generative approach: calculating the perplexity of a 1000-word paragraph using generate() would require 1000 sequential forward passes, each incurring the memory bandwidth penalty of loading the model weights. The system would effectively be "re-reading" the model from RAM 1000 times.  
In contrast, the "Forward Pass" approach processes the 1000 words in a single (or chunked) operation. The weights are loaded once (or streamed efficiently), and the attention mechanism computes the relationships between all words in parallel. The logits for all 1000 positions are available at the output of this single pass. This reduces the time complexity from $O(N)$ (where $N$ is sequence length) in terms of memory access overhead to essentially $O(1)$ batch operation relative to the weights.

### **3.3 The "Prompt Logprobs" Solution**

The specific value we need from the forward pass is the **Log-Probability (Logprob)** of the actual tokens in the text.

* **Logits:** The raw, unnormalized scores output by the final layer of the neural network. They range from $-\\infty$ to $+\\infty$.  
* **Logprobs:** The log-softmax of the logits. These represent the log-probability $log(P(token | context))$. A value of 0 means 100% probability. A value of \-10 means extremely low probability (high surprise).

In a standard API call (e.g., OpenAI), the system typically only returns logprobs for the *generated* tokens. However, advanced local inference engines like **vLLM** and **MLC-LLM** (which power WebLLM) have introduced parameters like prompt\_logprobs to return these values for the input tokens as well.10  
By enabling prompt\_logprobs, we effectively ask the model: "For every word in this paragraph I just gave you, how surprised would you have been if you had to guess it?" This provides the exact "Surprisal" signal required by the psychoanalytic framework without generating a single new token.

## ---

**4\. Technical Implementation: The Exegete Architecture**

The "Backend-of-the-Mind," referred to as **The Exegete**, is the computational engine responsible for metabolizing text and generating the control signals for the RSVP display.12 Its architecture is defined by the constraints of the browser environment and the capabilities of modern hardware, specifically Apple Silicon. We now refine this architecture based on the "Forward Pass" strategy.

### **4.1 The Technical Stack: WebLLM and WebGPU**

The feasibility of Arphen rests on the maturation of **WebGPU**, the modern web standard that grants browsers direct, low-level access to the device's Graphics Processing Unit (GPU).1 Unlike the older WebGL, which was designed for graphics and required complex translation layers for general-purpose computing, WebGPU enables efficient execution of compute shaders, making it possible to run LLMs entirely within the client.  
WebLLM (MLC-LLM):  
Arphen utilizes WebLLM, a high-performance in-browser inference engine built on the Apache TVM stack.1 WebLLM compiles LLM weights into WebAssembly (WASM) and utilizes WebGPU for acceleration.

* **Performance:** Benchmarks indicate that an **Apple M3 Max** can decode a 4-bit quantized Llama-3-8B model at approximately **90-100 tokens per second (TPS)**.1 However, in **Prefill (Forward Pass)** mode, this speed effectively quintuples, allowing the system to scan ahead of the reader with ease.  
* **Quantization:** The Exegete relies on 4-bit quantization (e.g., Llama-3-8B-Instruct-q4f16\_1). This reduces the memory footprint of an 8B model to roughly 4-6GB of RAM.1

### **4.2 Implementing the Forward Pass in WebLLM**

The core implementation challenge is accessing the prompt\_logprobs within the WebLLM Javascript SDK. While the standard chat.completions.create interface mimics OpenAI's API, the underlying MLCEngine is more flexible.  
Configuration for "Read-Only" Analysis:  
To implement the Scansion Engine, we configure the request to minimize generation and maximize analysis:

JavaScript

const response \= await engine.chat.completions.create({  
  messages:,  
  max\_tokens: 1,       // Force immediate stop after prompt processing  
  logprobs: true,      // Enable log probability calculation  
  top\_logprobs: 1,     // We only need the score of the actual token  
  // Crucial: Pass the prompt\_logprobs flag if supported by the specific  
  // version of vLLM/MLC backend.  
  extra\_body: { prompt\_logprobs: true }   
});

If the high-level API strips the prompt logprobs (a common issue noted in snippets 11), we have two fallback strategies:  
Strategy A: The "Echo" Hack (Legacy Method)  
In older APIs, echo: true would return the prompt alongside the completion, including logprobs. If WebLLM supports this legacy parameter, it provides an immediate solution.14  
Strategy B: Low-Level forward Access (The "Smarter Way")  
Since WebLLM runs locally, we are not black-boxed. We can access the underlying MLCEngine methods. The snippets indicate that the engine has internal steps for prefill.15 By modifying the ServiceWorkerMLCEngine or the WASM bindings, we can expose the raw logits tensor before it is discarded.

* **Mechanism:** The prefill step in new\_request\_prefill.cc (in the MLC C++ backend) computes logits for the entire sequence. We can register a callback or a custom API endpoint in the WASM bridge to return this array directly.7  
* **Benefit:** This avoids the overhead of the chat abstraction entirely, dealing with pure tensors. It is the most "smarter" way, perfectly fulfilling the user's request.

### **4.3 The Pulse: Entropy and Density Calculation**

This is the central innovation of Arphen. The "Pulse" calculates the **Information Entropy** (specifically, the perplexity or surprisal) of every word to modulate the display speed.  
The Mechanism:  
For a sequence of words $w\_1, w\_2,..., w\_N$, the LLM predicts the probability distribution of the next token. The Surprisal $S(w\_i)$ is:

$$S(w\_i) \= \-\\log\_2 P(w\_i | w\_{\<i})$$

* **Low Entropy (High Probability):** "The cat sat on the..." \-\> Model predicts "mat" (99%). Surprisal $\\approx 0$.  
  * **Action:** The Exegete assigns a high speed (e.g., 800 WPM).  
* **High Entropy (Low Probability):** "The cat sat on the... metaphysics." \-\> Model predicts "mat" but sees "metaphysics" (0.01%). Surprisal is High.  
  * **Action:** The Exegete assigns a low speed (e.g., 250 WPM).

Psycholinguistic Validation:  
This approach is grounded in Surprisal Theory (Hale, 2001; Levy, 2008), which posits that the cognitive effort required to process a word is linearly proportional to its surprisal.1 Empirical studies using eye-tracking have confirmed that human reading times naturally increase when encountering high-surprisal words. By automating this deceleration, Arphen externalizes the brain's natural processing latency, creating a "bionic" reading rhythm.

## ---

**5\. Advanced Metrics: Semantic Velocity and the "Split-Brain"**

The user's query implies a desire for efficiency ("smarter ways"). Beyond simple perplexity, we can leverage **Semantic Velocity** derived from embeddings, and employ a **Split-Brain** architecture to optimize resource usage.

### **5.1 Semantic Velocity: Measuring the Rate of Meaning**

Perplexity measures word-level unpredictability. However, a text can be predictable at the word level but conceptually dense (e.g., a complex philosophical argument using simple words). To capture this, we use **Semantic Velocity**.  
The Metric:  
We extract the hidden states (embeddings) from the forward pass for each sentence or chunk.16

* Let $V\_t$ be the embedding vector of Sentence $t$.  
* Let $V\_{t+1}$ be the embedding vector of Sentence $t+1$.  
* Compute **Cosine Similarity**: $Sim \= \\frac{V\_t \\cdot V\_{t+1}}{\\|V\_t\\| \\|V\_{t+1}\\|}$.18  
* **Semantic Velocity** \= $1 \- Sim$.

**Interpretation:**

* **Low Velocity (High Similarity):** The text is dwelling on a single concept. The narrative is static. **Action:** Accelerate.  
* **High Velocity (Low Similarity):** The text is moving rapidly between disparate ideas. The narrative is dynamic or disjointed. **Action:** Decelerate.

This provides a "Macro-Pacing" signal that complements the "Micro-Pacing" of perplexity. While Perplexity handles the rhythm of the sentence, Semantic Velocity handles the rhythm of the paragraph.

### **5.2 The Split-Brain Architecture: 1B for Analysis, 8B for Art**

Running a 7B or 8B model continuously can be taxing on memory and battery. However, research suggests that **Small Language Models (SLMs)** like **Llama-3.2-1B** or **Qwen2.5-0.5B** are highly correlated with larger models in terms of perplexity ranking.19 A word that surprises an 8B model will likely also surprise a 1B model.  
The Proposal:  
We split the system into two distinct engines:

1. **The Scanner (Phase 1 & 2):** A **1B-3B quantized model** (e.g., Llama-3.2-1B-4bit).  
   * **Role:** Runs the "Forward Pass" continuously. Calculates Perplexity and Semantic Velocity.  
   * **Cost:** Extremely low memory (\~600MB-1GB). High speed. Low battery impact.  
   * **Status:** Always Active.  
2. **The Hallucinator (Phase 4):** An **8B+ model** (e.g., Llama-3-8B-Instruct).  
   * **Role:** "Gonzo Mode" (Style Transfer) and "The Librarian" (Chat).  
   * **Cost:** High memory (\~6GB). Slower.  
   * **Status:** Dormant/Paged Out until explicitly invoked by the user.

This "Split-Brain" approach ensures that the reading tool remains lightweight and responsive, only spinning up the heavy machinery when generative creativity is required. It perfectly answers the user's desire for a "smarter way" by allocating compute resources proportional to the complexity of the task (scoring vs. generating).

## ---

**6\. Implementation Roadmap & Technical Specifications**

The development of Arphen is structured into four distinct phases, prioritizing the core reading engine before expanding to the complex network and generative features.

### **6.1 Phase 1: The Core (Desktop Only)**

* **Objective:** Achieve stable, high-velocity reading on a MacBook using the "Forward Pass" architecture.  
* **Technology:** React, Vite, WebLLM (Llama-3.2-1B-Instruct-q4f16\_1).  
* **Key Metric:** **Tokens Per Second (TPS)** in Prefill Mode. Must achieve \>500 TPS to maintain a healthy look-ahead buffer.  
* **Implementation:**  
  * Load Llama-3.2-1B via CreateMLCEngine.  
  * Implement the "0-generation" loop: Feed chunks \-\> Request logprobs \-\> Store density scores.  
  * Render RSVP stream based on these scores.

### **6.2 Phase 2: The Synapse (Mobile Companion)**

* **Objective:** Enable "No-Cloud" sync to mobile devices.  
* **Technology:** PeerJS (WebRTC wrapper), qrcode library.  
* **Challenge:** Mobile browsers on iOS have strict memory limits for WebGL/WebGPU. The "Split-Brain" creates a unique opportunity here: The **MacBook (Host)** can run the Scanner and stream the *processed density data* (lightweight JSON) to the **Phone (Client)**, which only needs to render the UI. The phone effectively becomes a "dumb terminal" for the Mac's intelligence.  
* **Protocol:**  
  1. Mac processes book \-\> generates DensityMap.json.  
  2. Mac establishes WebRTC P2P tunnel with Phone via QR code handshake.1  
  3. Mac sends the book text \+ density map to Phone.  
  4. Phone stores in IndexedDB and plays back the RSVP.

### **6.3 Phase 3: The Librarian (Monetization)**

* **Objective:** Integrate discovery and revenue.  
* **Technology:** Gutendex API, Amazon Affiliate Tagging.  
* **Mechanism:** The Librarian chatbot (running on the Mac, accessed via Phone) recommends books. If a Public Domain book is chosen, it fetches from Gutenberg. If a copyrighted modern book is suggested ("The Modern Counterpart"), it generates a client-side Amazon Affiliate link (amazon.com/s?k=...) to monetize the intent without handling transactions.1

### **6.4 Phase 4: The Art (Gonzo Mode)**

* **Objective:** Enable generative rewriting.  
* **Requirement:** Hardware gating. This feature is disabled on devices with \<16GB RAM.  
* **Mechanism:** When triggered, the system pauses the 1B Scanner. It loads the 8B "Hallucinator" into VRAM. It performs style transfer on the upcoming text chunk ("Rewrite as Hunter S. Thompson"). It then switches back to the Scanner to analyze the *new* text for pacing (yes, we must scan our own hallucinations to know how fast to read them).

## ---

**7\. Conclusion: The Feasibility of the Neuro-Semantic Tool**

The Arphen project is a theoretically rigorous and technically ambitious attempt to redefine digital reading. By synthesizing **Lacanian psychoanalysis** with **computational linguistics**, it proposes a reading experience that is not merely faster, but structurally different—one where the "meaning controls the pace."  
Technical Verdict:  
The project is highly feasible on high-end consumer hardware (Apple Silicon), provided the architectural pivot to Forward Pass / Prefill Analysis is adopted. The user's intuition was correct: generating text to analyze text is a dead end. By tapping directly into the model's probabilistic engine (logprobs), we reduce the computational load by an order of magnitude while increasing the fidelity of the psychoanalytic "cut."  
The "Split-Brain" architecture (1B Scanner \+ 8B Hallucinator) further optimizes this viability, ensuring that the "always-on" component is lightweight enough to run without thermal throttling, while reserving the heavy compute for momentary bursts of creativity.  
**Critical Risks:**

* **Browser Memory Limits:** iOS Safari is aggressive in killing tabs that use excessive memory. The "Mac Host / Phone Client" topology mitigates this but introduces network friction.  
* **Amazon Compliance:** The "SponsorLink" system operates in a grey area of the Amazon Associates Operating Agreement regarding client-side software.  
* **Ergonomics:** While "Bionic Highlighting" and the "River of Text" address RSVP's deficits, extended reading at high velocity may still cause cognitive fatigue. The efficacy of "Entropy Braking" is theoretically sound but empirically unproven in this specific context.

Ultimately, Arphen is more than software; it is a manifesto. It argues that in an age of information overload, the only way to reclaim sovereignty is to stop reading and start processing. It transforms the reader from a passive consumer into an "Exigent Sadist," demanding that the text surrender its meaning with maximum efficiency.

### **Table 1: Comparative Analysis of Scoring Architectures**

| Architecture | Mechanism | Computational Cost | Latency | Suitability for Arphen |
| :---- | :---- | :---- | :---- | :---- |
| **Autoregressive (Naive)** | model.generate() to rewrite/check text | High ($O(N)$) | High (Token-by-token) | **Low** (Too slow for real-time) |
| **Forward Pass (Logits)** | prompt\_logprobs on input text | **Low ($O(1)$ batch)** | **Zero** (Parallel Prefill) | **High** (Ideal for Pacing) |
| **Embedding Distance** | Cosine Sim of hidden\_states | Ultra-Low | Negligible | **Medium** (Good proxy, less precise) |
| **Split-Brain (Hybrid)** | 1B for Scoring, 8B for Rewriting | Mixed | Adaptive | **Optimal** (Best of both worlds) |

**(End of Report)**

#### **Works cited**

1. Arphen Project Research and Implementation  
2. arphen  
3. Optimizing LLM Inference: Prefill vs Decode, Latency vs Throughput \- Medium, accessed December 31, 2025, [https://medium.com/@maghonei/optimizing-llm-inference-prefill-vs-decode-latency-vs-throughput-80dbf00fc0ba](https://medium.com/@maghonei/optimizing-llm-inference-prefill-vs-decode-latency-vs-throughput-80dbf00fc0ba)  
4. Perplexity Metric for LLM Evaluation \- Analytics Vidhya, accessed December 31, 2025, [https://www.analyticsvidhya.com/blog/2025/04/perplexity-metric-for-llm-evaluation/](https://www.analyticsvidhya.com/blog/2025/04/perplexity-metric-for-llm-evaluation/)  
5. Perplexity for LLM Evaluation \- GeeksforGeeks, accessed December 31, 2025, [https://www.geeksforgeeks.org/nlp/perplexity-for-llm-evaluation/](https://www.geeksforgeeks.org/nlp/perplexity-for-llm-evaluation/)  
6. LLM Inference Performance Engineering: Best Practices | Databricks Blog, accessed December 31, 2025, [https://www.databricks.com/blog/llm-inference-performance-engineering-best-practices](https://www.databricks.com/blog/llm-inference-performance-engineering-best-practices)  
7. WebLLM: A High-Performance In-Browser LLM Inference Engine \- MLC, accessed December 31, 2025, [https://blog.mlc.ai/2024/06/13/webllm-a-high-performance-in-browser-llm-inference-engine](https://blog.mlc.ai/2024/06/13/webllm-a-high-performance-in-browser-llm-inference-engine)  
8. Prefill speed on MLC significantly slower than llama.cpp on Jetson Thor – any optimization suggestions? \- NVIDIA Developer Forums, accessed December 31, 2025, [https://forums.developer.nvidia.com/t/prefill-speed-on-mlc-significantly-slower-than-llama-cpp-on-jetson-thor-any-optimization-suggestions/343483](https://forums.developer.nvidia.com/t/prefill-speed-on-mlc-significantly-slower-than-llama-cpp-on-jetson-thor-any-optimization-suggestions/343483)  
9. WebLLM: A High-Performance In-Browser LLM Inference Engine \- arXiv, accessed December 31, 2025, [https://arxiv.org/html/2412.15803v1](https://arxiv.org/html/2412.15803v1)  
10. What is the purpose of prompt logprobs? \- General \- vLLM Forums, accessed December 31, 2025, [https://discuss.vllm.ai/t/what-is-the-purpose-of-prompt-logprobs/1714](https://discuss.vllm.ai/t/what-is-the-purpose-of-prompt-logprobs/1714)  
11. Get logprobs for prompt tokens, not just for completion? \- API, accessed December 31, 2025, [https://community.openai.com/t/get-logprobs-for-prompt-tokens-not-just-for-completion/717289](https://community.openai.com/t/get-logprobs-for-prompt-tokens-not-just-for-completion/717289)  
12. exegete  
13. WebLLM | Home \- MLC, accessed December 31, 2025, [https://webllm.mlc.ai/](https://webllm.mlc.ai/)  
14. OpenAI-Compatible Server \- vLLM, accessed December 31, 2025, [https://docs.vllm.ai/en/latest/serving/openai\_compatible\_server.html](https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html)  
15. Profiling MLC-LLM's OpenCL Backend on Android: Performance Insights \- Callstack, accessed December 31, 2025, [https://www.callstack.com/blog/profiling-mlc-llms-opencl-backend-on-android-performance-insights](https://www.callstack.com/blog/profiling-mlc-llms-opencl-backend-on-android-performance-insights)  
16. LLM Embeddings Explained: A Visual and Intuitive Guide \- a Hugging Face Space by hesamation, accessed December 31, 2025, [https://huggingface.co/spaces/hesamation/primer-llm-embedding](https://huggingface.co/spaces/hesamation/primer-llm-embedding)  
17. Stop Paying for API Calls: Run Powerful LLMs Entirely in Your Browser Using WebGPU and Local RAG | by Dr. Ernesto Lee | Dec, 2025, accessed December 31, 2025, [https://drlee.io/stop-paying-for-api-calls-run-powerful-llms-entirely-in-your-browser-using-webgpu-and-local-rag-7e7fbe5057d4](https://drlee.io/stop-paying-for-api-calls-run-powerful-llms-entirely-in-your-browser-using-webgpu-and-local-rag-7e7fbe5057d4)  
18. Embedding Similarity Explained: How to Measure Text Semantics | Thinking Sand \- Medium, accessed December 31, 2025, [https://medium.com/thinking-sand/embedding-similarity-explained-how-to-measure-text-semantics-2932a0d899c9](https://medium.com/thinking-sand/embedding-similarity-explained-how-to-measure-text-semantics-2932a0d899c9)  
19. On the Effect of Instruction Tuning Loss on Generalization \- MIT Press Direct, accessed December 31, 2025, [https://direct.mit.edu/tacl/article/doi/10.1162/TACL.a.42/133798/On-the-Effect-of-Instruction-Tuning-Loss-on](https://direct.mit.edu/tacl/article/doi/10.1162/TACL.a.42/133798/On-the-Effect-of-Instruction-Tuning-Loss-on)  
20. The Fools are Certain; the Wise are Doubtful: Exploring LLM Confidence in Code Completion \- arXiv, accessed December 31, 2025, [https://arxiv.org/html/2508.16131v1](https://arxiv.org/html/2508.16131v1)  
21. Looking for the Inner Music: Probing LLMs' Understanding of Literary Style \- arXiv, accessed December 31, 2025, [https://arxiv.org/html/2502.03647v1](https://arxiv.org/html/2502.03647v1)