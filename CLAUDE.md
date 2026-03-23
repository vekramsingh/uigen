# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

Only add comments for complex or non-obvious logic. Do not add comments to every edit or for self-explanatory code.

## Commands

```bash
# Install deps, generate Prisma client, run DB migrations
npm run setup

# Dev server (localhost:3000) — uses Turbopack
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run a single test file
npx vitest run <path/to/test>

# Reset database (destructive)
npm run db:reset

# Lint
npm run lint
```

**Windows note:** Scripts use `cross-env` for cross-platform env var support. The `node-compat.cjs` file is required at startup to delete `globalThis.localStorage`/`sessionStorage` before Next.js hydrates, fixing a Node 25+ Web Storage SSR bug.

## Architecture

UIGen is an AI-powered React component generator with a live preview. Users describe a UI in chat, the AI generates/edits files in a virtual file system, and the result is rendered in a sandboxed iframe.

### Request Flow

1. User sends chat message → `src/app/api/chat/route.ts`
2. Route deserializes the `VirtualFileSystem` from the request body, calls `streamText` (Vercel AI SDK) with Claude Haiku
3. Claude uses two tools to modify files: `str_replace_editor` (create/edit) and `file_manager` (rename/delete)
4. Tool call results are processed client-side by `FileSystemContext`, which updates in-memory state
5. `PreviewFrame` re-renders the live preview from the updated virtual FS
6. On stream completion, the project (messages + FS data) is persisted to SQLite via Prisma

### Virtual File System (`src/lib/file-system.ts`)

All files live entirely in memory — nothing is written to disk. The `VirtualFileSystem` class serializes to JSON for transport (request body) and persistence (Prisma `Project.data` column). It supports standard file/directory operations plus text-editor-style commands (`viewFile`, `replaceInFile`, `insertInFile`).

### AI Provider (`src/lib/provider.ts`)

- **With `ANTHROPIC_API_KEY`**: Uses `claude-haiku-4-5`, up to 40 tool-call steps
- **Without key**: Falls back to `MockLanguageModel`, which returns static component code (Counter, Form, Card) in ≤4 steps — no API required for development

### State Management

Two React contexts carry all client state:

- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`): Owns the virtual FS, handles tool calls from the AI stream, tracks the currently selected file
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`): Wraps Vercel AI SDK's `useAIChat`, serializes the FS into each request, manages anonymous work tracking

Both are provided in `src/app/main-content.tsx`, which renders the two-panel layout (chat left 35%, preview/editor right 65%).

### Auth

JWT sessions via `jose` stored in httpOnly cookies. `src/lib/auth.ts` handles create/get/verify/delete session. Passwords are bcrypt-hashed. Projects are optionally associated with a user — anonymous users can create projects without signing in. Middleware (`src/middleware.ts`) guards `/api/projects` and `/api/filesystem` routes only.

### Database

The database schema is defined in `prisma/schema.prisma` — reference it whenever you need to understand the structure of stored data. SQLite via Prisma. Schema has two models:
- `User`: email + hashed password
- `Project`: `messages` (JSON string array) + `data` (serialized VirtualFileSystem JSON), optional `userId`

Generated client outputs to `src/generated/prisma/` (not the default location — import from there, not `@prisma/client`).

### UI

- Tailwind CSS v4 (no `tailwind.config.*` — uses default v4 config)
- Shadcn/ui components in `src/components/ui/` (new-york style, Lucide icons)
- Monaco editor for code editing (`@monaco-editor/react`)
- Resizable panels via `react-resizable-panels`
