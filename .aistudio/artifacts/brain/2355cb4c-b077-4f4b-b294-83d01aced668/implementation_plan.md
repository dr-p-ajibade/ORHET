# Quality Assurance & Academic Integrity Remediation Plan

Comprehensive root-cause remediation to eliminate all synthetic/mock articles, remove all fabricated author attributions, and establish a 100% live, authoritative open-access repository querying OpenAlex, CrossRef, and CORE.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user in Phase 1:
> - **Zero Synthetic Articles**: Remove all hardcoded mock articles and simulated bibliographic records entirely from the codebase.
> - **100% Live API Ingestion**: Populate the repository exclusively through live, verified API requests to OpenAlex, CrossRef, and CORE.
> - **Objective Author Attribution**: Do not pre-filter or inject Dr. P Ajibade's name into any paper. Only display publications actually returned by academic databases with verified metadata when users explicitly search for an author or topic.

- **Confirmed Decision 1**: All pre-seeded static mock articles in `src/data/curatedArticles.ts` will be removed. The archive will load authentic, live-retrieved open-access publications on mount.
- **Confirmed Decision 2**: Publications authored by Dr. P Ajibade will only be retrieved and attributed when users query his name directly against the live databases, ensuring strict academic truthfulness.
- **Confirmed Decision 3**: All DOIs, citations, and external links will originate purely from real registry responses, eliminating all `DOI NOT FOUND` errors permanently.

---

## 1. Overview & Core Concept

### What It Does
This remediation refactors the **ARHET Research Archive** from a hybrid system that previously contained static simulated benchmark papers into a **pure federated academic gateway**. Every single paper shown in the repository—including titles, authors, journals, abstracts, DOIs, and citations—will be fetched in real time from authoritative global scholarly data nodes: **OpenAlex** (250M+ works), **CrossRef** (152M+ DOIs), and **CORE** (34.5M+ open access papers).

### Target Audience / Persona
Scholars, graduate researchers, academic administrators, and higher education leaders who require verified, peer-reviewed, factually sound citations and publications without any synthetic or misleading data.

### Key Value
- **Uncompromised Scholarly Truth**: Zero risk of false co-authorship or artificial publication claims.
- **Guaranteed DOI & Full-Text Validity**: Every DOI link resolves to legitimate registry records and open-access repositories.
- **Live Epistemic Access**: Direct access to real, published research in higher education transformation, decolonial pedagogy, and open science.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Initial Archive Visit**:
   - On opening the Research Archive, the system automatically dispatches a verified live query to OpenAlex for real, published peer-reviewed works in *Higher Education Transformation & Open Science*.
   - A clean loading state displays database node contact, followed by authentic, live-indexed articles.
2. **Subject & Category Exploration**:
   - Selecting academic discipline tabs (*All*, *Education*, *Technology*, *Social Science*) dynamically categorizes real papers based on their verified metadata (OpenAlex concepts, publication venues, and abstracts).
3. **Live Search by Topic or Author**:
   - Searching for *Dr P Ajibade* queries the live OpenAlex and CrossRef APIs for Dr. Ajibade's actual indexed publications, returning only verified papers with genuine co-authors and functional DOIs.
4. **Detail View & Citation Export**:
   - Opening an article displays genuine bibliographic details in the native Scholarly Document Reader.
   - One-click *Copy Citation* generates genuine APA 7th citations from live registry data.
   - *Download PDF Brief* compiles real metadata into a clean scholarly summary.

### Visual Identity & Theme
- **Academic Restraint**: Neutral stone canvas (`#faf8f5` / `bg-stone-50`), crisp white cards with subtle borders (`border-stone-200`), and warm ochre/terracotta accent tones (`text-orange-700`, `bg-orange-600`).
- **Clear Provenance Badges**: Every paper displays a verified provenance tag indicating whether it originated from OpenAlex, CrossRef, or CORE, with verified DOI badges.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Purging `CURATED_RESEARCH_ARTICLES`
- **Chosen Approach**: Completely replace the static `CURATED_RESEARCH_ARTICLES` array with an automated live initial query (e.g., `higher education transformation`) executed on component mount.
- **Why**: Static mock data inevitably introduces hallucinated papers, inaccurate author combinations, and dead DOIs. Real academic projects must rely exclusively on verifiable records.
- **Alternatives Considered**: Manually verifying a hardcoded list of papers. Rejected because static lists become stale and do not demonstrate the scale and freshness of the federated repository.

### Decision 2: Elimination of Automatic Author Association
- **Chosen Approach**: The default archive display will NOT automatically associate papers with Dr. P Ajibade unless the user specifically initiates a search for his name or publications.
- **Why**: Protects scholarly reputation by guaranteeing that only authentic works physically indexed under his name appear in his attribution.
- **Alternatives Considered**: Pre-filtering the landing page to Dr. Ajibade. Rejected per user's explicit instruction: *"Do not pre-filter by my name unless searched"*.

### Decision 3: Robust Fallback & External Link Handling
- **Chosen Approach**: When an article has an authentic DOI, link directly to `https://doi.org/[valid_doi]`. If an article lacks an indexed DOI, link to its OpenAlex canonical landing page or open access repository download URL.
- **Why**: Eliminates 404 errors from the DOI Foundation.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ARHET RESEARCH ARCHIVE                           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                  ┌────────────────────┴────────────────────┐
                  ▼                                         ▼
       ┌──────────────────────┐                  ┌──────────────────────┐
       │   Live API Search    │                  │  Live Default Corpus │
       │ (User Query / Author)│                  │(Higher Ed Transform) │
       └──────────┬───────────┘                  └──────────┬───────────┘
                  │                                         │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                  Federated Upstream APIs                    │
        │  ┌─────────────────┐ ┌────────────────┐ ┌────────────────┐  │
        │  │  OpenAlex API   │ │  CrossRef API  │ │    CORE API    │  │
        │  │ (Live Works)    │ │  (Live DOIs)   │ │  (Open Access) │  │
        │  └─────────────────┘ └────────────────┘ └────────────────┘  │
        └──────────────────────────────┬──────────────────────────────┘
                                       │
                                       ▼
        ┌─────────────────────────────────────────────────────────────┐
        │              Verified Normalization Pipeline                │
        │  - Strict Title & Real Authors Extraction                   │
        │  - Canonical DOI Resolution (No mock DOIs)                  │
        │  - Domain Classification (Education, Technology, Social Sc) │
        └──────────────────────────────┬──────────────────────────────┘
                                       │
                                       ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                       Scholarly UI                          │
        │  - Horizontal Academic Category Navigation                  │
        │  - Real-Time Search Filter (Real author/title match)        │
        │  - Native Document Reader (No broken iframes)               │
        │  - APA 7th Citation Copy & PDF Brief Download               │
        └─────────────────────────────────────────────────────────────┘
```

### Component & State Plan
1. **`src/data/curatedArticles.ts`**:
   - Delete all fabricated article entries.
   - Retain only live repository scale statistics (`REPOSITORY_STATS`), category definitions (`ACADEMIC_CATEGORIES`), and the intelligent academic classification helper (`getArticleAcademicCategory`).
2. **`src/components/ArchivePage.tsx`**:
   - Add initial auto-fetch on mount: queries OpenAlex and CrossRef for genuine open-access works on foundational higher education themes (e.g., `"higher education transformation"`).
   - Ensure `displayedArticles` is fed 100% by live API results.
   - Update quick-filter presets to launch legitimate queries against live endpoints.
   - Preserve real-time search, category filtering, PDF export, and APA citation generation.
3. **`src/components/ResourceViewer.tsx`**:
   - Maintain the native Scholarly Document Reader as the primary view.
   - Ensure all citation and DOI copy features use verified API strings.
