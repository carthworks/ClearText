# Non‑Printable Unicode: Viewer & Cleaner

# ClearText: Unicode Cleaner & Exporter
# Paste, preview, and export text without hidden clutter.

A Next.js web app to detect, visualize, and clean non‑printable or invisible Unicode characters in pasted or uploaded text files. Includes smart normalization rules (NBSP → space, smart quotes → straight quotes, fancy dashes → -) and configurable cleaning by Unicode category.

## Demo

- Local development: `npm run dev` → `http://localhost:3000`
- ![Uploading image.png…]()


## Features

- 🔍 Detection & Visualization
  - Detailed character map with names and code points (e.g., `U+200B ZERO WIDTH SPACE`, `U+00A0 NBSP`)
  - Color‑coded inline highlighting with tooltips explaining each character
  - Toggle between inline highlight preview and a separate frequency list
  - Frequency counts per hidden character
- 🧹 Cleaning
  - Remove non‑printable categories: `Cc`, `Cf`, `Cs`, `Co`, `Cn`
  - Preserve specific controls: TAB, LF, CR
  - Smart replace options:
    - NBSP (`U+00A0`) → normal space
    - Fancy dashes (`– — − …`) → `-`
    - Smart quotes (`“ ” ‘ ’` …) → straight quotes
- 📄 Input/Output
  - Paste text, drag‑drop or upload `.txt` and common text formats
  - Copy cleaned text or download as a file

## Tech Stack

- Next.js 14 (App Router), React 18, TypeScript
- No backend required for core features (client‑side processing only)

## Getting Started

1. Prerequisites: Node.js 18+ (recommended 20+), npm
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.
4. Build for production:
   ```bash
   npm run build
   npm start
   ```

## Usage

- Paste or upload text in the left panel.
- Use the options below the editor to configure cleaning rules:
  - Remove categories (Cc/Cf/Cs/Co/Cn)
  - Preserve TAB/LF/CR
  - Smart replaces (NBSP→space, normalize dashes, normalize quotes, remove ZWSP)
- Click "Clean with options" to apply. Use "Download cleaned" to save the result.
- Toggle "Show List" to switch to the frequency list view.

## Project Structure

```
src/
  app/
    page.tsx        # UI: editor, controls, preview
    layout.tsx      # Root layout and metadata
    globals.css     # Styling and tokens
  lib/
    nonprintable.ts # Detection, visualization, and cleaning utilities
```

## Scripts

- `npm run dev` — start Next.js in development
- `npm run build` — create a production build
- `npm start` — run the production server
- `npm run lint` — run ESLint

## Configuration

- TypeScript paths: `@/*` → `src/*`
- No environment variables are required.

## Accessibility & Security Notes

- Visualization renders a visible placeholder for invisible characters to avoid confusing, hard‑to‑select glyphs.
- Cleaning is client‑side; no text is sent to a server.

## Roadmap

- Export report (CSV/JSON) of detected characters
- Category‑specific color configuration
- Keyboard shortcuts for common actions
- Add tests for utility functions

## Contributing (Bitbucket)

- Branch naming: `feature/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`
- Conventional commits are recommended (e.g., `feat: add list view`)
- Open a Pull Request targeting `main` with a concise description, screenshots if UI changes, and test notes
- CI: Bitbucket Pipelines run lint + build on PRs by default (see `bitbucket-pipelines.yml`)

## CI/CD (Bitbucket Pipelines)

- Default pipeline: install, lint, build
- PR pipeline: install, lint, build; fail fast on type/lint/build errors
- Customize deployment steps as needed

## License

Specify your license here (e.g., MIT). 
