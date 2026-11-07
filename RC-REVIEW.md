# 0.3.0 RC Review — 2026-11-07

This remains an unpublished RC candidate on `codex/living-skills-0.3.0-knowledge-matching-refinement`, based on `1693cda22df59be95600623b8f17946005246ded`. The final Git commit identifies the reviewed snapshot; no release tag, public release or production Living lock update is authorized by this review.

Reviewed all three Skills and the branch changes from main. living-init retains pinned installation and no-Sync boundaries. living-records retains explicit authorization, record/Knowledge separation and receipt handling. living-knowledge retains stable object/local IDs, complete reads and revision bases; separates Task/Constraint, logical information needs (requires_data semantics), actual uses and explicit needs; reports implemented-but-unmodeled Tasks, unmapped information, Unknown and separately sourced plans within the requested scope. Coverage Review does not grant permission to expand or sync the investigation.

The RC adds source/date guidance after the Profile Pilot audit: a local uncommitted file is not a file at a Git commit; MCP history has its own identity and access scope; 404 alone is inconclusive; original verification dates and current source-inspection dates must be explicit. Existing synced history requires a later revision rather than rewriting.

Validation on the final candidate files:

- Node 24.21.0 manifest builder `--check`: PASS, all versions 0.3.0, Knowledge Contract 3.
- `quick_validate.py` for living-init, living-knowledge, living-records: all PASS (existing isolated PyYAML dependency; no repository dependency changes).
- Living's candidate installer in an isolated temporary layout: six directories for Codex and Claude Code, all four manifest files match source bytes, size and SHA-256.
- Manifest SHA-256: `03dc2fa32e9935cba5b0228ba472ef10717f640f32b387294af9a3b7d1e17882`.
- `git diff --check`: PASS. Manifest publication checks detect common personal-path/project-ID/credential patterns; staged files additionally reviewed.

Evidence limits: this validates manifest integrity and installation layout/compatibility, not a new desktop auto-discovery test or a new independent Agent behavioral experiment. The earlier isolated Profile Pilot evaluated manifest `b94fbe07fd71f9751b1d2c6eda31b9038fb49f97a63c7887f920ad78333a161c`; its Coverage Review result does not imply the later wording was behavior-tested. No GraphRAG model/API tests were run. Full current logs and installation output remain local in `/tmp/living-rc-validation/`, not part of the published skill payload.

Before release: review the pushed RC commit, confirm the Contract-3 Living service, check desktop discovery and any desired behavioral acceptance, then obtain separate release authorization. After a real published commit is fixed, Living can pin it with its pin script, verify every hash and deploy the lock. Existing unmodified Living-managed project Skills upgrade through bootstrap/re-initialization; local modifications are reconciled first, and a new Agent session confirms discovery.
