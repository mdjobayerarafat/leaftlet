# History scrub (temporary)

Secrets (OpenRouter key + Appwrite key) were committed in `.env.local` in
commits `e70256a` and `94e5a6f`. Purge plan before pushing:

1. ✅ `git rm --cached .env.local` + add to `.gitignore`
2. Commit the removal now
3. Run `git filter-repo --path .env.local --invert-paths` (rewrites all history,
   drops the file from every commit)
4. Force-push: `git push --force origin main`
5. **Rotate both keys** (they reached GitHub's scanners; treat as compromised):
   - OpenRouter: https://openrouter.ai/keys
   - Appwrite console → API keys

Local file `.env.local` remains untouched on disk (only git history changes).
