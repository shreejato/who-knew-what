# ✅ NarrativeOS — Final Submission Checklist

**Deadline:** Mon Nov 16, 2026 | **Portal:** generative-clash-2026.web.app | **Submitter:** Team Lead only

---

## Forms (every individual member — not just lead)

- [ ] **Giveaway form** → https://forms.gle/uMxYcJh1Rv9DZ4Uv6 (Member 1 ✅ / Member 2 ✅ / Member 3 ✅)
- [ ] **Adaption verification form** → https://forms.gle/KpRStgBbxjSUz6UR8 (all 3 members via official referral link)

---

## Code & Repository

- [ ] GitHub repo is **Public**: https://github.com/shreejato/who-knew-what
- [ ] All 3 members visible in git commit history
- [ ] Zero API keys, `.env` files, or secrets in any commit
- [ ] `.env.example` present with correct variable names
- [ ] `contracts/schema.json` is the authoritative contract (no unreviewd changes)
- [ ] `data/test_story.txt` and `data/answer_key.json` **NOT** used in training

## README

- [ ] `README.md` present, under 150 lines, in repo root
- [ ] Sections: Problem · Solution · Architecture diagram · Adaption integration · Accuracy table · Tech stack · Setup · Project structure · Roadmap · Team
- [ ] Architecture diagram is our own (not copied from another product)
- [ ] Accuracy table in README **matches** `eval/results.md` real run numbers

## Eval

- [ ] `eval/submit_and_eval.py` runs cleanly from repo root with backend running
- [ ] `eval/results.md` has at least one real Gemini baseline run result
- [ ] Adaption adapted model run attempted; results (or honest failure note) recorded

---

## Deployment

- [ ] **Backend** deployed on Render/Railway and responding at public URL
- [ ] **Frontend** deployed on Vercel and responding at public URL
- [ ] `NEXT_PUBLIC_API_URL` in Vercel env points to the live backend URL
- [ ] `GEMINI_API_KEY` set in Render dashboard (not in code)
- [ ] Live full flow test: upload `data/test_story.txt` → analyze → contradictions appear

---

## Demo Video

- [ ] Duration: **2:00 – 4:00 minutes** (strict)
- [ ] Recorded from our own live UI only (no third-party screenshots)
- [ ] Covers: Problem → Upload → Knowledge Graph slider → Contradiction evidence → Adaption comparison → Finale teaser
- [ ] Uploaded to **YouTube** (Public or Unlisted) or **Google Drive** (Anyone with link)
- [ ] Link tested in **Incognito/Private window** — plays without login

---

## Final Link Verification (all in Incognito)

- [ ] GitHub repo URL loads and shows all files
- [ ] Live frontend URL loads and the app works
- [ ] Demo video link plays
- [ ] All links submitted on portal are correct

---

## Submission (Team Lead)

- [ ] Submit on **generative-clash-2026.web.app** before the cutoff
- [ ] Mon Nov 16 = **buffer day only** — no new features, only link/README fixes
