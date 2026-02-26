# Merge Conflict Recovery — Assessment Workflow Changes

This guide helps reapply the assessment workflow changes if they disappear after resolving conflicts on another branch (for example `redesign-2`).

## What should exist after merge (functional checklist)

1. **Route supports script-aware evaluation URL**
   - `src/router/index.ts` includes:
     - `assessments/evaluate/:scriptId?`
2. **Start button opens exact script**
   - `src/components/assessments/UploadQueueTable.vue`
   - `Start` action calls navigation to `/assessments/evaluate/<scriptId>`
3. **Evaluate page reads route and opens script**
   - `src/pages/AssessmentsEvaluatePage.vue`
   - `syncRouteScript()` watches `route.params.scriptId` and calls `store.openScript(...)`
4. **Store has script-aware selection**
   - `src/stores/assessmentStore.ts`
   - Includes `selectedScriptId`, `selectedScript`, `openScript()`
5. **PDF panel uses pdfjs and scroll-sync logic**
   - `src/components/assessments/PdfViewer.vue`
   - Renders multiple pages and maps PDF scroll to active question (`setActiveQuestion`)
6. **Single-open accordion behavior in scoring**
   - `src/components/assessments/ScoringPanel.vue`
   - Only one question is expanded (`activeQuestionNo`)
7. **Collapsed student rail remains usable**
   - `src/components/assessments/StudentNavigator.vue`
   - Collapsed state shows clickable indicators that select students
8. **Overflow/min-height scroll fix remains present**
   - `src/style.css`
   - Keep `min-height: 0` and `overflow-y: auto` on nested evaluation containers

---

## Recommended conflict-resolution strategy

### 1) Prefer these files from the assessment-workflow commit

If conflicts happen, use **ours/theirs** intentionally for these files as a group (do not mix partial hunks unless necessary):

- `src/router/index.ts`
- `src/stores/assessmentStore.ts`
- `src/pages/AssessmentsEvaluatePage.vue`
- `src/components/assessments/UploadQueueTable.vue`
- `src/components/assessments/PdfViewer.vue`
- `src/components/assessments/ScoringPanel.vue`
- `src/components/assessments/StudentNavigator.vue`
- `src/style.css`

Reason: these changes are tightly coupled (routing + store shape + component behavior + scroll CSS).

### 2) Resolve conflicts file-by-file

When Git stops on conflicts:

```bash
git status
```

Open each conflicted file and remove conflict markers:

- `<<<<<<< HEAD`
- `=======`
- `>>>>>>> <branch>`

Then keep the logic matching the checklist above.

### 3) Validate type/build immediately

```bash
npm run build
```

If build fails, check first for:

- Route path mismatch (`:scriptId?` missing)
- Store export mismatch (`openScript`, `selectedScript` not returned)
- Component compile mismatch due to renamed store keys

### 4) Smoke test behavior quickly

- Upload page → click `Start` on any row
  - URL should include `/assessments/evaluate/<scriptId>`
- In evaluate:
  - PDF panel scrolls
  - scoring list scrolls independently
  - collapsed student rail can still select students
  - active question changes as PDF scroll changes

---

## Fast reapply commands (if changes were lost)

If this branch already has the working commit, cherry-pick it onto your target branch:

```bash
git checkout redesign-2
git cherry-pick 8869f5c
```

If conflicts occur during cherry-pick:

```bash
git add <resolved-files>
git cherry-pick --continue
```

If you want to abort and retry:

```bash
git cherry-pick --abort
```

---

## Typical conflict hot spots and how to settle

1. **`assessmentStore.ts` large conflicts**
   - Keep `openStudent` + `openScript` dual selection model
   - Keep `selectedScriptId` and `selectedScript` computed
   - Ensure `useAssessmentStore()` returns every newly used key

2. **`style.css` conflicts in evaluation layout block**
   - Preserve functional overflow rules (`min-height: 0`, `overflow-y: auto`)
   - Avoid removing comments that explain scroll trap prevention

3. **`PdfViewer.vue` conflicts with mock viewer changes**
   - Keep `pdfjs-dist` rendering path, not static mock pages
   - Keep `onPdfScroll` smart mapping behavior

4. **`UploadQueueTable.vue` conflicts with redesign actions**
   - Keep `goToEvaluation(row.id)` and router push to script-aware route

5. **`ScoringPanel.vue` conflicts**
   - Keep single-open accordion logic based on `activeQuestionNo`

---

## After merge: final verification before pushing

```bash
git status
npm run build
```

If both are clean/successful, commit merge resolution and push.
