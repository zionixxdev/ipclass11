# CompPrep 11 — Class 11 Computer Exam Preparation

A complete, functional, responsive web application for Class 11 Computer Science /
Informatics Practices exam preparation. It covers the full eight-chapter syllabus
with structured learning content, a large tagged question bank, a smart practice
engine, CBSE-style mock tests, a Python lab with real in-browser execution, a
revision centre and local progress analytics.

**🔗 Live site: https://zionixxdev.github.io/ipclass11/**

Built with **React + TypeScript + Vite + Tailwind CSS**, Lucide icons, Recharts
(for analytics) and LocalStorage for persistence. No login is required and there
is no paid API or mandatory API key — the app starts working immediately in
guest mode.

---

## Quick start

```bash
npm install
npm run dev        # start the dev server
```

Production build:

```bash
npm run build      # tsc + vite build  ->  dist/
npm run preview    # serve the production build locally
```

### Alternative build (no Rollup)

If your environment blocks Vite's build pipeline, an equivalent static build is
available:

```bash
npm run build:static   # Tailwind CLI + esbuild  ->  dist/
```

This emits a classic (IIFE) script, so `dist/index.html` can even be opened
directly from the file system. A prebuilt copy is already included in `dist/`.

> Note: the default `npm run build` (Vite) emits ES modules, which need to be
> served over HTTP (not opened via `file://`). Use `npm run build:static` if you
> want a double-click-openable build.

---

## What is included

### Eight chapters (exact syllabus)

1. **Computer Overview** — evolution, functional units, memory, units of measurement, data capture/storage/retrieval
2. **Software** — system software, programming tools, application software, open-source concepts
3. **Python Overview** — introduction, installation, working in Python, Hello World from the command line
4. **Python Fundamentals** — character set, tokens, variables, input/output, program structure
5. **Data Types and Operators** — data types, operators, type conversion, expressions
6. **Conditional and Looping Statements** — control structures, sequence, selection, iteration, programs
7. **Debugging Programs** — error messages, exceptions, built-in exceptions
8. **Lists** — creating, accessing, traversing, operators, operations, built-in functions, programs

### Learning mode

Every subtopic ships with the full 13-part treatment: a beginner-friendly Hinglish
explanation, a formal exam-writable English definition, keywords, real-life
examples, comparison tables, diagrams, "difference between" tables, Python syntax
and code examples, common mistakes, exam notes, FAQs, a short topic quiz and a
revision checklist. Topics use **Previous / Next / Mark as learned / Revise**
controls — a topic is only marked learned when the student says so.

### Question bank

**670 questions** across all eight chapters, each tagged with chapter, topic, type,
difficulty and marks, and every question carries a teaching explanation.

| Type | Coverage |
| --- | --- |
| MCQ | 4 options, instant checking, per-option explanations |
| Assertion–Reason | standard 4-option format |
| True / False | with correction of false statements |
| Fill in the Blanks | tolerant, alternative answers accepted |
| Match the Following | randomised matching |
| Very Short / Short / Long Answer | model answers, marking keywords, rubrics |
| Case-Based | realistic passage + table + 3–5 linked sub-questions |
| Output-Based Python | exact expected output + step-by-step execution |
| Find & Correct the Error | syntax / runtime / logical classification |
| Write a Python Program | hints, model solution, line explanations, test cases, rubric |
| Numerical & Conversion | bit/byte/KB/MB/GB/TB with stated conventions |

All Python output answers in the bank were verified by actually executing the code.

### Practice engine

Filter by chapter, subtopic, question type, difficulty, marks, unattempted,
incorrect or bookmarked. Modes: Quick (10), Chapter, Topic, Weak Areas, Mixed,
Timed and Revision. Answer one at a time, skip, mark for review, change answers,
submit, then review everything. Learning mode gives instant feedback; Exam mode
hides answers until submission.

### Mock tests

Configurable CBSE-style papers (Full 70 / Half 35 / Quick 20 marks, editable
duration) assembled from the bank with section-wise distribution, randomised
selection, a live timer, auto-scoring of objective questions, self-evaluation for
descriptive answers, and chapter-wise and type-wise performance analysis.

> These are practice papers generated from your question bank. They are **not**
> official CBSE sample papers and do not claim to follow the latest official
> pattern.

### Python Lab

A browser code editor with real Python execution via **Pyodide** (CPython compiled
to WebAssembly, loaded on demand from a CDN — your code never leaves your device).
Includes sample programs, a stdin area, an output console, step-by-step notes and
a static study fallback for when the runtime cannot load. The console only ever
shows output after code has actually run — nothing is simulated.

### Revision centre

Chapter notes, a definitions notebook, all difference tables, a Python cheat
sheet, a list-methods reference, a common-errors guide, important output patterns,
a units & conversions reference, your mistake notebook and a flashcard-style quick
revision mode.

### Progress & personalisation

Dashboard with syllabus completion, chapter progress, accuracy, weakest subtopics,
bookmarks, recently studied topics, an editable exam countdown and a recommended
next activity. Progress, bookmarks, mistakes and mock scores are stored in
LocalStorage, with export/import and a confirmed reset.

---

## Project structure

```
src/
  components/     Layout, QuestionCard, CodeBlock, shared UI primitives
  data/
    types.ts      the whole data model (chapters, topics, questions, attempts)
    index.ts      loads + normalises the content JSON, builds indexes
    content/      chapter-1.json … chapter-8.json  (all content lives here)
  lib/
    store.tsx     progress context + LocalStorage persistence
    storage.ts    load/save/export
    quiz.ts       answer checking, shuffling, scoring
    analytics.ts  chapter/topic/type statistics and recommendations
    pyodide.ts    browser Python execution + stdin shim
    utils.ts      helpers
  pages/          Dashboard, Learn, ChapterView, TopicView, Practice,
                  PythonLab, MockTests, Revision, Progress, Bookmarks,
                  Settings, NotFound
  App.tsx         routing
  main.tsx        entry point
build-static.mjs  esbuild-based alternative build
```

Content is fully decoupled from the UI: to add questions or topics, edit the JSON
in `src/data/content/` — no component changes are needed.

---

## Content honesty

The learning content and question bank are original practice material written to
match the syllabus. They are clearly practice material and are **not** official
CBSE questions or exam predictions. Long-answer mark allocations are configurable
and labelled as practice guidance rather than an official marking scheme.

## Accessibility & responsiveness

Mobile-first layout with a sidebar on desktop and a bottom navigation bar plus a
"More" sheet on phones, light and dark themes, comfortable touch targets and
readable contrast throughout.
