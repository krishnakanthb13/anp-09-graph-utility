## v0.0.1 (2026-07-11)
### 🚀 Initial Open Source Release
- Extracted and modularized code into `lib/` directory for better maintainability.
- Added comprehensive unit testing suite across core utilities (`tableTranspose`, `csvConverter`, `markdownParser`, `dateTime`) with 100% pass rate.
- Performed rigorous security audit and patched critical XSS HTML/JS injection vectors in `htmlTemplate.js`.
- Implemented robust `try/catch` wrappers across all feature handlers to prevent silent failures.
- Bundled and optimized via `esbuild` to ensure strict Amplenote environment compatibility.
- Formalized comprehensive `README.md` and Plugin documentation.
