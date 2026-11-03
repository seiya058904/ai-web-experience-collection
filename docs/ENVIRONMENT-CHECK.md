# Environment self-check after a machine move

For the AI agent working in this repository. Run this once after the workspace is moved to a new Windows machine (or when the environment looks unfamiliar), then continue normal work if nothing fails. Report results briefly; fix only what is in the repository's scope and ask the user about machine-level items.

## 1. Repository state

```powershell
git status -sb            # expect: ## main...origin/main, no changes
git remote -v             # expect: https://github.com/seiya058904/ai-web-experience-collection.git
git log -1 --oneline      # compare with the user's last known commit if they give one
git ls-files --eol | Select-String "w/crlf" | Select-Object -First 5   # expect: nothing from tracked text files
```

- A dirty tree right after the move usually means line endings or a partial copy. `.gitattributes` normalizes text to LF and keeps binary/supplied assets byte-exact; do not "fix" it by recommitting assets. Report the diff instead.
- Never discard, stash or commit unexplained changes to make the tree clean.

## 2. Toolchain

```powershell
node -v; npm -v           # expect Node 24.x LTS (previous machine: v24.15.0 / npm 11.12.1)
gh auth status            # needed only for push/PR/Pages work
```

- If `node_modules/` is missing or was copied from another machine, run `npm ci` (allowed: it installs locked versions without changing `package-lock.json`).
- `dist/` is a build output; regenerate it, never copy it as evidence.

## 3. Project checks

```powershell
npm test
npm run build
npm run verify:build
git diff --check
git status -sb            # expect: still clean
```

All must pass. If one fails, diagnose before rerunning; check Node version and `npm ci` first.

## 4. Agent environment (outside the repository)

Check, do not modify without the user's approval:

- **Global instructions** `~/.claude/CLAUDE.md` loaded (Simplified Chinese replies, deletion/push boundaries). If absent, tell the user; this repo's `AGENTS.md` still applies.
- **`~/.claude/settings.json`**: on the previous machine it set an HTTP proxy `127.0.0.1:7890` and a status line using an absolute `C:/Users/admin/...` path. If network calls fail or the status line errors, report these as likely causes.
- **Skills / browsers**: `ego-browser` and `playwright` skills plus their executables are required for the browser verification in `AGENTS.md`. If unavailable, say so and fall back to another available browser tool; do not claim browser checks that were not run.
- **Credentials**: Claude Code and GitHub logins are per-machine. Ask the user to sign in (e.g. `! gh auth login`); never copy or print credential files.

## 5. Known machine-local leftovers (not blockers)

- Ignored local directories `.workbuddy/` (another tool's notes) and `.playwright-cli/` (old acceptance scripts) may be absent. They are not needed for build or tests.
- Several `docs/**/ACCEPTANCE.md`, `docs/audits/` and `provenance/**` records cite evidence under `C:/Users/admin/AppData/Local/Temp/`, `C:/Users/admin/.codex/` or `D:\下载\`. They are historical records; missing files there do not affect the build. Do not rewrite these records.
- The optional reference folder named in the global instructions (`D:\xia zai\AI project\Knowledge`) may not exist; proceed without it.

## 6. Result

- Everything in sections 1–3 passes → state "环境自查通过" with the commit and Node version, then continue the user's task.
- Any failure → list the exact failing item, its output and the proposed fix; finish independent safe work and wait only for decisions that need the user.
