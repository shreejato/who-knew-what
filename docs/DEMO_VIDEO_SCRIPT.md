# NarrativeOS — 2 to 4 Minute Demo Video Script

**Target Duration:** 3 minutes (180 seconds)  
**Speaker:** Member 3 (or team presenter)  
**Screen Recording Tool:** Loom, OBS Studio, or Windows Game Bar (Win+Alt+R)  
**Rule:** Only record our own live UI (`http://localhost:3000`) and terminal outputs. No third-party UI or external screenshots.

---

## Storyboard & Timing Breakdown

### [0:00 - 0:20] Hook & Problem (20s)
* **Visual:** Speaker facecam or title screen showing **NarrativeOS: The Story Intelligence Engine**.
* **Audio:**
  > "Complex stories fall apart in the details. When a murder mystery or fantasy saga spans dozens of chapters, writers lose track of who knew what secret, who was where at midnight, and which clues haven't been discovered yet. Existing AI tools focus on generating prose, but fiction writers don't need AI to write for them — they need an intelligence engine that catches plot holes without ever rewriting their words."

### [0:20 - 0:50] Upload & Automatic Chapter Ingestion (30s)
* **Visual:** Show browser at `http://localhost:3000/`. Drag and drop `data/test_story.txt` into the upload zone or paste the manuscript. Click **Analyze**.
* **Audio:**
  > "Here is our 6-chapter mystery manuscript. When we upload it to NarrativeOS, our backend parses the chapters and extracts the narrative entities: characters, facts, references, and crucially, knowledge events — tracking exactly how each character learned each fact, whether witnessed, told, overheard, or deduced."

### [0:50 - 1:30] Dynamic Epistemic Graph & Chapter Scrubbing (40s)
* **Visual:** Navigate to the **Knowledge Graph** tab. Interact with the React Flow node graph. Click on character "Petra Ashford" to show the side drawer. Scrub the **Chapter Slider** from Chapter 1 to Chapter 6. Nodes and edges update dynamically.
* **Audio:**
  > "This is the Epistemic Knowledge Graph. As we scrub across chapters using the timeline slider, notice how the knowledge state evolves. In Chapter 2, Petra doesn't know about the secret accounts. When Roland calls her, an edge lights up. Clicking on any character reveals their epistemic state: what they know, what they are completely unaware of, and who told them."

### [1:30 - 2:15] Contradiction Detector & Verbatim Evidence (45s)
* **Visual:** Switch to the **Contradictions** view. Select the `premature_knowledge` item and the `timeline` item. Show the side-by-side evidence cards with exact highlighted quotes. Point to the badge: *"NarrativeOS never edits your manuscript."*
* **Audio:**
  > "Now to the core breakthrough: our Epistemic Rule Engine. Here it flags a high-severity Premature Knowledge contradiction. In Chapter 3, Petra mentions the skimming scheme — but no one told her until Chapter 5. Every single finding displays verbatim evidence quotes pulled directly from the text, character-for-character. Our quote-exact verifier ensures zero hallucinations. Writers get a clear explanation and suggested fix, while staying in 100% creative control."

### [2:15 - 2:45] Adaption Labs Fine-Tuning & Model Comparison (30s)
* **Visual:** Point to the **Extractor: Adapted** badge in the header, then scroll down to the **Model Comparison Table** (`eval/results.md`).
* **Audio:**
  > "Generalist LLMs often hallucinate quotes or drop epistemic connections. To solve this, we used Adaption Labs' Adaptive Data platform: inventing a specialized synthetic continuity dataset and fine-tuning an open-weight extractor. As our benchmark on our held-out test suite shows, the Adaption-adapted model pushed quote exactness from 91.5% to 98.9%, improved F1 from 0.789 to 0.892, and reduced extraction latency by over 30%."

### [2:45 - 3:00] Finale Roadmap & Conclusion (15s)
* **Visual:** Show the clean GitHub repo `https://github.com/shreejato/who-knew-what` and concluding slide.
* **Audio:**
  > "This working 50% MVP gives creators certainty over their stories today. At the live finale on November 21st, we're building the What-If Story Simulator to let writers branch alternate plotlines in real time. NarrativeOS: Your story can become more complicated without becoming inconsistent. Thank you."

---

## Recording Checklist for Member 3
- [ ] Set browser window to 1080p (1920x1080) for crisp text.
- [ ] Ensure local backend (`http://localhost:8000`) and frontend (`http://localhost:3000`) are running smoothly.
- [ ] Video duration between **2:00 and 4:00 minutes** (strict hackathon rule).
- [ ] Export video and upload to YouTube (Unlisted or Public) or Google Drive (Share -> Anyone with the link can view).
- [ ] Test the video link in a Private/Incognito browser window.
