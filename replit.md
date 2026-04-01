# Architecture Pattern Library (APL)

## Overview
The Architecture Pattern Library (APL) is a full-stack TypeScript monorepo application designed for McCain Foods. Its primary purpose is to manage and disseminate architectural patterns, featuring AI-assisted drafting, documentation, and validation. The application aims to streamline the adoption of standardized architectural practices, enhance security posture through vulnerability scanning and vendor risk management, and facilitate the creation of unified Azure solution designs. Key capabilities include pattern CRUD operations, AI-powered pattern generation from various inputs (documents, code, ZIP files), DOCX export with McCain branding, AI-generated SVG architecture diagrams, Git version control synchronization to GitHub, integration with third-party vendor risk data, and dependency vulnerability scanning. The project seeks to provide a comprehensive, enterprise-grade platform for architectural governance and innovation within McCain Foods.

## User Preferences
- I prefer clear and concise communication.
- I appreciate detailed explanations when new features or complex changes are introduced.
- I expect iterative development with frequent, small updates rather than large, infrequent ones.
- Please ask for confirmation before making any major architectural changes or decisions.
- Do not make changes to the folder `lib/api-spec/` without explicit instruction.
- Do not make changes to the file `lib/api-spec/openapi.yaml` without explicit instruction.

## System Architecture
The application is a full-stack TypeScript monorepo utilizing pnpm workspaces.

**Frontend (`artifacts/web`):**
- Built with React 19, Vite 7, and Tailwind CSS 4.
- Features an enterprise UI with a horizontal Kanban-style dashboard for pattern status (Endorsed, Under Review, In Development, Deprecated).
- Includes dedicated pages for Pattern Catalog, Team Submission, Vendor Risk Management, Solution Designs, and Executive KPI Dashboard.
- **UI/UX Decisions:** McCain navy (#1B3A6B) and teal (#0F6E56) color scheme, responsive design, intuitive navigation with search and filters.
- **Key Components:** PatternCard, PatternDetail, PatternEditor, AiDraftButton, FileUpload, BuildFromDocument, ValidateDocument, AlignmentReport, GitSyncButton, ArchitectureDiagram, GitHubSource, SecurityAdvisories, ExecDashboard.
- **TeamPortal:** A self-contained, read-only portal for team members to submit documents, track their submissions, and browse the endorsed pattern catalog.

**Backend (`artifacts/api-server`):**
- Developed with Express 5, serving as the API server for all functionalities.
- Manages patterns CRUD, AI drafting, DOCX export, file uploads, AI analysis, diagram generation, Git sync, GitHub sourcing, vendor risk lookup, and security advisory scanning.
- Object storage is handled via Replit Object Storage (GCS-backed).

**Database:**
- PostgreSQL with Drizzle ORM.
- **Data Model:**
    - `patterns`: Stores architectural patterns with comprehensive metadata, classification, content (strategic intent, problem statement), JSONB fields for nested data (use cases, components, security considerations, revision history, third-party risks), and AI-generated Azure design documents.
    - `solution_designs`: Composes multiple patterns into unified Azure deployments, storing AI-generated designs and staleness information.
    - `vendors`: Standalone registry for vendor details, including classification, data sharing info, and spend bands.
    - `uploads`: Tracks file uploads, their analysis type, status, and results.

**AI Integration:**
- Utilizes Anthropic Claude for AI-assisted drafting, pattern building from documents/code/ZIPs, validation, Azure design generation, and GitHub-driven research.

**Monorepo Structure:**
- Divided into `artifacts` (frontend, backend), `lib` (shared code like DB schema, API spec, generated clients, AI integrations), and `scripts`.
- Uses pnpm workspaces for managing dependencies and builds.

**API:**
- All API endpoints are prefixed with `/api` and cover pattern management, AI operations, file handling, security, vendor risk, solution designs, and GitHub integrations.
- API validation uses Zod schemas generated from an OpenAPI specification via Orval.

## External Dependencies
- **AI Service:** Anthropic Claude (via direct `ANTHROPIC_API_KEY`)
- **Object Storage:** Replit Object Storage (GCS-backed)
- **Document Generation:** `docx` npm library for DOCX export with McCain branding
- **File Uploads:** `multer` for multipart form data
- **API Codegen:** Orval (generates clients and Zod schemas from OpenAPI spec)
- **Version Control Integration:** GitHub API (for searching repositories, fetching content, and analyzing repos)
- **Security Vulnerability Data:** GitHub Advisory Database
- **Vendor Risk Data:** Cloudflare Radar (for domain ranking)
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Frontend Framework:** React
- **Build Tool:** Vite
- **Styling:** Tailwind CSS