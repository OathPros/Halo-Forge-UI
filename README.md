# Halo Forge: Create & Publish Halo Knowledge Articles

Halo Forge is a static internal front-end app for creating source batches, generating article drafts, reviewing/locking articles, publishing ready articles, and exporting publish-ready JSON locally.

## Tech stack

- Vite
- React
- TypeScript
- JSZip

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages deployment

Deployment workflow: `.github/workflows/deploy-pages.yml`.

- On `main` push (or manual dispatch), GitHub Actions runs `npm ci` and `npm run build`.
- `dist/` is uploaded as a Pages artifact and deployed.
- `vite.config.ts` sets `base` dynamically from `GITHUB_REPOSITORY` during Actions so repo-based URLs resolve assets correctly.

## Product workflow

1. **Source**: create/select a batch, upload files and add pasted text, preview/edit source content.
2. **Articles**: generate draft articles from source items (mocked local generation service).
3. **Review Articles**: edit article fields; click **Ready to publish** to lock; click **Edit Article** to unlock.
4. **Publish**: publish ready articles, then download single JSON files, download all published JSON, or download a ZIP bundle.

## Data model

Typed models are defined in `src/types/models.ts`:

- `Batch`, `SourceItem`, `ArticleDraft`, `PublishedArticle`
- `BatchStatus`, `ArticleStatus`
- `PublishBundle`, `PublishManifest`

## Persistence model

Working state is saved locally in browser `localStorage` through `src/services/storage/storageService.ts`.

- No backend
- No runtime repo writes
- No GitHub API publish integration

## Export/download model (local-only)

Export is handled in `src/services/export/exportService.ts`.

The app uses browser-native file generation:

- `Blob`
- `URL.createObjectURL`
- `<a download>`
- `JSZip` for ZIP bundle export

### Single article JSON

For each published article, user can download:

- `<slug>.json`

### Batch ZIP publish bundle

Filename pattern:

- `halo-forge-export-<batch-slug>-<date>.zip`

ZIP contents:

- `manifest.json`
- `articles/index.json`
- `articles/<slug-1>.json`
- `articles/<slug-2>.json`
- ...

## What changes are needed later for real backend / Halo API integration

- Replace generation service with API-backed generation endpoint.
- Replace storage service with authenticated backend persistence (user/session ownership).
- Replace simulated publish transition with Halo API calls.
- Add auth, roles/permissions, audit trail, and server-side validation.
- Add robust rich text sanitization policy and server schema enforcement.
