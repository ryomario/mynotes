# Contributing to My Notes

Thank you for considering contributing to **My Notes**! We welcome contributions of all kinds – bug reports, feature enhancements, documentation improvements, and more.

## Code of Conduct

Please note that this project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/ryomario/mynotes.git
   cd mynotes
   ```
3. **Create a new branch** for your work. Use a descriptive name, e.g. `feature/add-dark-mode` or `bugfix/fix-typo`:

   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Install dependencies** using pnpm (as defined in the project's global rules):

   ```bash
   pnpm install
   ```
5. **Make your changes**. Ensure they follow the existing code style and pass TypeScript linting.
6. **Run the test suite** (if applicable) and the development server to verify your changes work:

   ```bash
   pnpm test   # optional if tests exist
   pnpm dev
   ```
7. **Commit your changes** with a clear, concise commit message:

   ```bash
   git add .
   git commit -m "feat: add dark mode toggle"
   ```
8. **Push your branch** to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```
9. **Open a Pull Request** against the `main` branch of the upstream repository.

   - Provide a descriptive title.
   - Explain the purpose of the change and any relevant context.
   - Reference related issues using `#issue-number` if applicable.

## Review Process

- All PRs will be automatically checked by the CI workflow (see `.github/workflows/ci.yml`).
- A maintainer will review your changes, request any needed modifications, and approve the PR.
- The `main` branch is **protected**; it can only be updated via merged PRs after successful CI checks and at least one approving review.

## Keeping Your Fork Up‑to‑Date

```bash
git remote add upstream https://github.com/ryomario/mynotes.git
git fetch upstream
git checkout main
git merge upstream/main
```

## Tips for a Smooth Contribution

- Keep changes focused on a single idea.
- Write or update documentation when adding new features.
- Run the linter (`pnpm lint`) before committing.
- If you add new dependencies, ensure they are necessary and lightweight.

## Need Help?

If you run into any issues or have questions, feel free to open an issue or ask in the project's discussion board.

Thank you for helping make **My Notes** better!
