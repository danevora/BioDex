# BioDex Constitution
<!-- Project engineering principles and working agreements -->

## Core Principles

### I. User-First, Fun-First
Every feature must serve the core loop of exploration, capture, and collection. Favor playful, friendly experiences over technical depth. If a change does not improve user delight or clarity, it should be cut or deferred.

### II. Mobile-First, Web-Ready
Design for mobile ergonomics first, but require full functionality in the web app. Layouts must be responsive, performant, and usable on desktop and tablet without a separate codebase.

### III. Idempotent, Flexible APIs
All write APIs must be idempotent. Data models must be extensible so new dex fields can be added without migrations that break existing clients.

### IV. Data Integrity Over Speed
User captures and progress are sacred. Design APIs and storage for correctness first (idempotency, validation, clear ownership), then optimize performance.

### V. Privacy by Default
Location and photos are sensitive. Collect the minimum, make sharing opt-in, and avoid public exposure without explicit consent. Design for easy data deletion.

### VI. Simple Systems, Clear Contracts
Prefer simple architectures and stable interfaces. Version contracts deliberately, document expectations, and avoid hidden coupling between frontend and backend.

## Technical Requirements

- Responsive UI built mobile-first; all features must work in the web app and degrade gracefully on larger screens.
- Backend APIs are idempotent and support flexible, additive fields on dex entries and captures.
- Animal data must support rich metadata: scientific name, taxonomy or family tree, origin regions for map display, and a descriptive blurb.
- Dex entries must support user-specific fields such as last-captured timestamp, user photo, and future additions like global completion percentage.
- Static animal catalog data and user capture data are stored separately but joinable for display.

## Dependency Management

- Prefer stable, well-maintained dependencies with clear licenses and security posture.
- Pin versions and use lockfiles; avoid unpinned or floating versions in production.
- Review new dependencies for size, maintenance, and risk; remove unused packages promptly.
- Keep dependencies updated on a regular cadence, prioritizing security patches.

## Quality & Testing Standards

- Automated tests are required for core capture flow, progress calculations, and friend updates.
- Backend APIs must have contract tests for request/response shapes and error states, including idempotency.
- Frontend must include smoke tests for camera flow, dex grid, and detail view across mobile and web breakpoints.
- Accessibility and offline behavior are part of quality: graceful degradation is required.

## Development Workflow

- PRs should be small, scoped, and include a clear user impact statement.
- Every PR needs at least one reviewer and passing automated checks.
- Breaking changes require explicit notes and a migration plan.

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

This constitution supersedes other working agreements. Amendments require a documented rationale, explicit approval, and an update to the version metadata.

**Version**: 1.0.0 | **Ratified**: 2025-02-10 | **Last Amended**: 2025-02-10
