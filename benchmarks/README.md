# Nimai Benchmarks

Dated benchmark artifacts for the spec-review loop (Prompt 1.5).

Each benchmark folder contains:
- `README.md` — narrative, loop trace, and convergence result
- `verdict-iteration-N.json` — raw verdict block from each review pass

## Index

| Date | Domain | Spec | Iterations | Result |
|------|--------|------|-----------|--------|
| [2026-03-04](./2026-03-04-chatmasala/) | Conversational AI platform | ChatMasala data model + state machine | 2 | ✅ PASS |

## Convention

- Store one folder per benchmark, named `YYYY-MM-DD-<slug>/`
- Use the verdict JSON format matching the Nimai version used (v1 string[] or v2 object[])
- The input spec stays in the originating repo — reference it by repo name in README.md
- Builder and reviewer must be separate agents (cross-repo artifact rule applies)
