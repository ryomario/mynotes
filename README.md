# My Notes

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![CI](https://github.com/ryomario/mynotes/actions/workflows/ci.yml/badge.svg)](https://github.com/ryomario/mynotes/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9%2B-brightgreen)](https://pnpm.io/)

> A fast, modular, privacy-first note-taking app for the browser — with bookmark management, multi-language support, and a fully hackable architecture.

---

## What is This Project?

**My Notes** is a lightweight, self-contained note-taking and bookmark manager built with TypeScript and Vite. It runs entirely in the browser — no backend required — and stores all data locally using IndexedDB and/or Chrome Extension Storage APIs.

It was built to solve a very common problem: **most note-taking tools are either too bloated, cloud-dependent, or locked into a vendor ecosystem**. My Notes gives you a fast, offline-first workspace that you can own, extend, and self-host.

## What Problem Does It Solve?

| Problem | My Notes Solution |
|---|---|
| Notes locked in proprietary cloud | All data stored locally (IndexedDB / Chrome API) |
| Heavy, slow note apps | Minimal runtime, no framework overhead |
| No bookmark + notes integration | Built-in bookmark manager with note support |
| Single language UI | Multi-language support (EN, ID, …) via JSON locale files |
| Hard to extend or fork | Plugin-friendly, modular architecture |

---

## Features

- 📝 **Rich Note Editing** — Create, edit, and organize notes with a clean UI
- 🔖 **Bookmark Manager** — Save, categorize, and thumbnail-preview bookmarks
- 🌍 **Multi-language Support** — Switch between English, Indonesian, and more
- 🎨 **Cyberpunk Neon Theme** — Stunning dark-mode UI with smooth animations
- 💾 **Offline-first Storage** — IndexedDB + Chrome API adapter, no cloud required
- 🔌 **Modular Architecture** — Clean separation of storage, UI, and business logic
- ⚡ **Fast Dev Workflow** — Vite-powered HMR with TypeScript and ESLint

---

## Screenshots / Demo

> _Screenshots coming soon. Run the dev server (see below) to see it live._

---

## Installation

**Prerequisites:** Node.js ≥ 20, pnpm ≥ 9

```bash
# 1. Clone the repository
git clone https://github.com/ryomario/mynotes.git
cd mynotes

# 2. Install dependencies
pnpm install
```

---

## Usage

### Run in Development Mode

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
pnpm build
```

Output is placed in the `dist/` directory.

### Preview Production Build

```bash
pnpm preview
```

### Run the Linter

```bash
pnpm lint
```

### Run Tests

```bash
pnpm test
```

---

## Contributing

Contributions are welcome and appreciated! Please read **[CONTRIBUTING.md](CONTRIBUTING.md)** for the full guide on:

- Forking and setting up your local dev environment
- Branch naming conventions
- Commit message format
- How to open a Pull Request
- Testing requirements

And please follow our **[Code of Conduct](CODE_OF_CONDUCT.md)**.

---

## Development Setup

```bash
# Fork the repo, then clone your fork
git clone https://github.com/<your-username>/mynotes.git
cd mynotes

# Install dependencies
pnpm install

# Start the dev server
pnpm dev

# Run linter before committing
pnpm lint

# Run test suite
pnpm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete setup walkthrough.

---

## Roadmap

| Status | Feature |
|---|---|
| ✅ Done | Note CRUD with IndexedDB persistence |
| ✅ Done | Bookmark manager with thumbnail support |
| ✅ Done | Multi-language (EN / ID) via external JSON |
| ✅ Done | CI pipeline (lint → test → build) |
| 🔄 In Progress | Cloud sync (optional, pluggable backend) |
| 📋 Planned | Mobile-responsive layout improvements |
| 📋 Planned | Tag-based note organization |
| 📋 Planned | Export notes as Markdown / PDF |
| 📋 Planned | Dark/light theme toggle |
| 📋 Planned | Browser extension packaging (Chrome / Firefox) |

---

## Project Status

**Active development.** The core features are stable. New features and bug fixes are being actively worked on. See the [Issues](https://github.com/ryomario/mynotes/issues) and [Roadmap](#roadmap) above for what's coming next.

---

## Security

Please do **not** open a public GitHub issue for security vulnerabilities. Instead, follow the process described in [SECURITY.md](SECURITY.md).

---

## License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for the full text.

```
My Notes — A modular, privacy-first browser note-taking app
Copyright (C) 2024  Mario

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```
