# ORHET

Online Resource for Higher Education Transformation. A federated search over open scholarly databases, arranged by eight transformation themes, with a blog and a training page.

## Run

```
npm install
npm run dev
```

## Where things live

| What | File |
|---|---|
| The eight themes and their topics | `lib/themes.ts` |
| Theme icons (traced from the 2021 ORHET artwork) | `public/icons/*.svg` |
| Blog essays | `lib/essays.ts` |
| Courses | `lib/courses.ts` |
| Database connectors and counts | `lib/sources.ts` |
| Colours, type and the line pattern system | `app/globals.css` |

## Optional settings

See `.env.example`. A free `CORE_API_KEY` switches on the CORE source. A free `OPENALEX_API_KEY` raises rate limits.

The earlier ARHET app is kept on the `legacy-arhet-app` branch.
