# NarrativeOS — Deployment & Final Submission Guide

**Hackathon:** GeNarrative Clash 2026  
**Track:** Storytelling & Co-Writers  
**Portal:** `generative-clash-2026.web.app` (Submitted by Team Lead)  
**Submission Cutoff:** Monday Nov 16, 2026

---

## 1. Cloud Deployment Setup

### Frontend: Vercel (Recommended)
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New... -> Project** and select `shreejato/who-knew-what`.
3. Set **Root Directory** to `web`.
4. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed backend (e.g. `https://who-knew-what-api.onrender.com` or `https://...railway.app`).
5. Click **Deploy**.

### Backend: Render or Railway (Recommended)
#### Option A: Render
1. Go to [render.com](https://render.com) -> New **Web Service**.
2. Connect `shreejato/who-knew-what`.
3. Set **Root Directory** to `api`.
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Set Environment Variables:
   - `GEMINI_API_KEY`: (Your Google AI Studio key)
   - `EXTRACTOR`: `gemini` (or `adapted`)
7. Click **Create Web Service**.

---

## 2. Pre-Submission Verification Checklist

Run this full check in an **Incognito / Private Window** before submitting:

- [ ] **Both Mandatory Google Forms Completed:**
  - Giveaway Form: https://forms.gle/uMxYcJh1Rv9DZ4Uv6 (All 3 members)
  - Adaption Verification Form: https://forms.gle/KpRStgBbxjSUz6UR8 (All 3 members)
- [ ] **GitHub Repository:**
  - Public repository: `https://github.com/shreejato/who-knew-what`
  - Clean git commit history with all 3 members contributing.
  - Zero API keys or secrets in any files or git history.
  - `README.md` is under 150 lines, accurate, with architecture diagram and setup guide.
- [ ] **Demo Video:**
  - Length between 2:00 and 4:00 minutes.
  - Set to **Public** or **Unlisted** (if YouTube), or **Anyone with the link can view** (if Drive/Loom).
  - Audio and video play cleanly in an incognito window without login required.
- [ ] **Held-Out Benchmark Intact:**
  - `data/test_story.txt` and `data/answer_key.json` were strictly preserved as held-out eval test data.
- [ ] **Submission Submitted by Team Lead:**
  - Submitted on `generative-clash-2026.web.app` before the cutoff.
