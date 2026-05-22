# My Notes

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D14-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-6.0%2B-brightgreen)
pnpm test   # optional if tests exist

## Description

**My Notes** is a lightweight, modular note‑taking application built with TypeScript and designed for extensibility. It supports multiple languages, customizable themes, and integrates tightly with browser storage APIs.

## Features

- Multi‑language support (English, Indonesian, …) using external JSON translation files.
- Fast, responsive UI with a cyber‑punk neon theme.
- Persistent storage backed by IndexedDB and Chrome APIs.
- Easy extensibility via a plugin‑friendly architecture.

## Installation

```bash
# Clone the repository
git clone https://github.com/ryomario/mynotes.git
cd mynotes

# Install dependencies using pnpm
pnpm install
```

## Development

```bash
#Run the linter (`pnpm lint`) before committing.
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Building for Production

```bash
pnpm build
```

## Contributing

Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to propose changes.

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.
