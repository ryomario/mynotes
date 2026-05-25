# Contributing to My Notes

Thank you for considering contributing to **My Notes**! We welcome and appreciate contributions of all kinds — bug reports, feature enhancements, documentation improvements, UI polishes, and more.

To ensure a smooth collaboration, please follow this contribution guide.

---

## Table of Contents
1. [How to Fork the Repository](#1-how-to-fork-the-repository)
2. [How to Set Up Local Development](#2-how-to-set-up-local-development)
3. [Branch Naming Convention](#3-branch-naming-convention)
4. [Coding Style](#4-coding-style)
5. [How to Write a Commit Message](#5-how-to-write-a-commit-message)
6. [Testing Requirements](#6-testing-requirements)
7. [How to Create a Pull Request](#7-how-to-create-a-pull-request)

---

## 1. How to Fork the Repository

To contribute code, you will need to fork the repository to your own GitHub account:

1. Visit the upstream repository: `https://github.com/ryomario/mynotes`.
2. In the top-right corner of the page, click the **Fork** button.
3. Choose your personal account as the destination owner.
4. Keep the repository name as `mynotes` and click **Create fork**.
5. Once the fork is created, copy the clone URL (SSH or HTTPS).

---

## 2. How to Set Up Local Development

Once you have forked the repository, follow these steps to set up your local development environment:

1. **Clone your fork** (replace `<your-username>` with your GitHub username):
   ```bash
   git clone https://github.com/<your-username>/mynotes.git
   cd mynotes
   ```

2. **Configure the upstream remote** so you can pull the latest changes:
   ```bash
   git remote add upstream https://github.com/ryomario/mynotes.git
   git fetch upstream
   ```

3. **Install the dependencies** using `pnpm` (which is our project's global package manager):
   ```bash
   pnpm install
   ```

4. **Start the local development server**:
   ```bash
   pnpm dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## 3. Branch Naming Convention

We use a standard branch naming convention to categorize the work being done. Before making changes, create a new branch from `main` using one of the following prefixes:

| Branch Type | Prefix | Example | Description |
|---|---|---|---|
| Feature | `feature/` or `feat/` | `feature/add-tag-support` | Introducing a new feature or capability |
| Bug Fix | `bugfix/` or `fix/` | `bugfix/prevent-theme-flicker` | Fixing an issue or a bug |
| Refactor | `refactor/` | `refactor/modular-storage` | Improving code structure without changing behavior |
| Documentation | `docs/` | `docs/add-api-guide` | Updating or creating documentation files |
| Performance | `perf/` | `perf/optimize-thumbnails` | Enhancing rendering or processing performance |
| Testing | `test/` or `tests/` | `test/add-storage-tests` | Adding or updating unit/integration tests |
| Chore | `chore/` | `chore/update-pnpm-version` | Standard maintenance, package updates, etc. |

Create and switch to your branch:
```bash
git checkout -b feature/your-feature-name
```

---

## 4. Coding Style

To maintain a clean and consistent codebase, please adhere to these coding guidelines:

* **TypeScript**: Always write strong and correct TypeScript types. Avoid using the `any` type; use `unknown` or define specific interfaces/types instead.
* **Linter**: We use ESLint. Ensure your code passes lint checks before committing. You can check your code by running:
  ```bash
  pnpm lint
  ```
* **Formatting**: Keep code clean, readable, and well-structured. Follow standard spacing and formatting (we target consistent modern JS/TS styles).
* **Comments & Documentation**: Maintain documentation integrity. Keep comments and docstrings up to date. Avoid adding useless or commented-out code.
* **Semantic HTML**: Use semantic tags (e.g. `<header>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`) to ensure accessibility and clear structure.

---

## 5. How to Write a Commit Message

We follow the **Conventional Commits** specification. This helps produce human-readable and machine-parseable commit histories.

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

* **Type**: Must be one of the following:
  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation-only changes
  - `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
  - `refactor`: A code change that neither fixes a bug nor adds a feature
  - `perf`: A code change that improves performance
  - `test`: Adding missing tests or correcting existing tests
  - `chore`: Changes to the build process or auxiliary tools and libraries
* **Scope**: Optional, indicating the component or module changed (e.g., `storage`, `i18n`, `ui`).
* **Description**: A short, present-tense, lowercase summary of the change. Use active verbs (e.g., "add", "fix", "improve", "refactor").

### Examples
- Good: `feat(storage): addIndexedDB support for note items`
- Good: `fix(i18n): correct translation key mismatch in locales`
- Good: `docs: update setup instructions in README`

---

## 6. Testing Requirements

To prevent regressions, any new code changes must satisfy our testing standards:

1. **Verify Existing Tests**: Ensure that all existing tests continue to pass without error.
2. **Add New Tests**: If you are adding a new feature or fixing a bug, please write corresponding tests inside the `src/__tests__/` or next to the code files where appropriate using **Vitest**.
3. **Run the Test Suite**: Before pushing your code, run:
   ```bash
   pnpm test
   ```
   Ensure that the entire test suite passes successfully.

---

## 7. How to Create a Pull Request

Ready to share your changes? Follow this workflow to open a Pull Request (PR):

1. **Keep your fork in sync** with upstream:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git merge main
   ```
2. **Verify locally**: Make sure `pnpm lint`, `pnpm test`, and `pnpm build` all pass on your machine.
3. **Push to your fork**:
   ```bash
   git push origin your-feature-branch
   ```
4. **Open a PR**:
   - Go to `https://github.com/ryomario/mynotes` (upstream).
   - You will see a banner prompting you to open a Pull Request. Click **Compare & pull request**.
   - Select `main` as the base branch and your fork's feature branch as the compare branch.
   - Fill out the PR using the automatically populated PR template. Make sure to link any related issues (e.g., `Closes #12`).
   - Click **Create pull request**.

### Post-PR Guidelines
- Our GitHub Actions will automatically run the CI checks (**Lint**, **Test**, and **Build Check**).
- All checks must pass, and at least one maintainer must approve the PR before it can be merged into `main`.
- If requested, make additional commits in your branch and push them; the PR will automatically update.
