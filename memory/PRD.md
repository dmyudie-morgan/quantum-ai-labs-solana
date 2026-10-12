# Quantum AI Labs — PRD

## Original problem statement
Enhance the existing Quantum AI Labs project into a premium AI × Quantum-Inspired Computing × Web3 research platform: homepage matching the supplied "Frontier Intelligence" design, official Q emblem logo, supplied cinematic MP4 hero video, preserve existing utilities (AI Assistant, Prompt Lab, Web3 chain monitor, Dexscreener prices, auto refresh, gas alert), and add Quantum Algorithm Lab, Prompt Engineering Lab upgrades, Blockchain Explorer, Research Knowledge Hub, Benchmark Playground. Free-first, technically honest, secure, no fabricated data, no auto-deploy.

## User choices
- Rebuild existing utilities faithfully from the live site (source not in workspace)
- AI: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929) via Emergent Universal Key
- Imagery: existing project's renders reused (downloaded from live site, converted to WebP)
- Community links configurable via REACT_APP_COMMUNITY_* env (only X set: x.com/QntmAiLabs from existing site)
- Scope: homepage + all 8 utilities

## Architecture
- Backend FastAPI: server.py (routes, rate limit, SSE), ai_service.py (LlmChat streaming, 60 s chunk timeout), web3_service.py (public JSON-RPC, failover, chainId verification, 10 s cache, RPC_<NETWORK> env overrides), market_service.py (Dexscreener, 30 s cache). Mongo: chat_messages.
- Frontend React (CRA) + Tailwind; fonts Sora + IBM Plex Mono. Routes: / /vision /technology /research /research/:slug /roadmap /ecosystem /assistant /tools /quantum-field /benchmark /web3.
- Assets: /public/brand (emblem resized, aspect preserved), /public/video (hero.mp4 2.8 MB, hero-mobile.mp4 0.9 MB, re-encoded from supplied 9.2 MB), /public/img (*.webp).

## Implemented (2026-10-12)
- Homepage: nav, cinematic hero video (reduced-motion poster fallback), 6 module cards, 3 pillars, R&D status, ecosystem, community CTA, footer
- AI Assistant (streaming, multi-turn, markdown, clear, retry, stop, provider disclosure)
- Prompt Lab (builder, 6 templates, rule-based checks, tidy, copy, .md/.txt export, local save/edit/delete, optional AI improve)
- Quantum Field: Max-Cut exact vs local search vs SA vs SQA (PIMC), deterministic seeds, SVG graph
- Benchmark Playground (7 bounded algorithms, repeats, stats, history)
- Web3: chain monitor (6 EVM chains), gas alert (above/below, persisted), explorer (address/tx/token), Dexscreener token feed (address/search, auto-refresh 60 s)
- Knowledge Hub: 6 sourced articles with fact/hypothesis labels, search, categories
- Testing: iteration_1 — backend 22/22, frontend 100%

## Backlog
- P1: Verifiable experiment records (hash commitments of benchmark/lab runs)
- P1: Web Worker for larger Quantum Field instances
- P2: More community channels once URLs provided; browser Notification API for gas alert while tab open
