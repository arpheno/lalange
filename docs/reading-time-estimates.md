# Live Reading Time Estimates Feature

## Overview
Added live-updating reading time estimates that show available reading time at the user's current WPM, with linear projection for chapters currently being ingested.

## Implementation Details

### Database Schema Changes
**File: `src/core/sync/schema.ts` and `src/core/sync/db.ts`**
- Added `lastChunkCompletedAt` (timestamp) to `ChapterDocType` to track when each processing chunk completes
- This timestamp enables linear projection of words being processed but not yet reported

### Pipeline Updates
**File: `src/core/ingest/pipeline.ts`**
- Modified chunk processing to update `lastChunkCompletedAt: Date.now()` on every DB patch
- This timestamp is used alongside `processingSpeed` (WPM) to project currently-processing words

### UI Components

#### 1. BookCard Component (Library View)
**File: `src/components/Library/BookCard.tsx`**
- New component that replaces the inline book rendering in Library
- Subscribes to chapter updates for each book
- Calculates and displays:
  - **Finished chapters**: Total reading time at 300 WPM (default)
  - **Processing chapters**: Linear projection using:
    - `reportedWords` + (`processingSpeed` × `timeSinceLastChunk`)
  - Shows ingestion speed (e.g., "45 min • 450 WPM ingest") when processing
- Updates every second when chapters are processing

#### 2. Reader Sidebar Updates
**File: `src/components/Reader/Reader.tsx`**
- Modified `renderSidebarContent()` to show per-chapter reading times
- Displays:
  - **Ready chapters**: Exact reading time in green (e.g., "12 min")
  - **Processing chapters**: Estimated time with `~` prefix in yellow (e.g., "~8 min")
  - Shows ingestion WPM for processing chapters
- Live updates every second when any chapter is processing

#### 3. Reading Time Hook
**File: `src/hooks/useReadingTimeEstimate.ts`**
- Reusable hook for calculating reading time estimates
- Handles both finished and processing chapters
- Includes `formatReadingTime()` utility for human-readable time strings
  - "< 1 min" for sub-minute content
  - "5 min" for under an hour
  - "2h 15m" for longer content

## Linear Projection Algorithm

For processing chapters, the system estimates words available but not yet reported:

```
timeSinceLastChunk = (now - lastChunkCompletedAt) / 60000  // minutes
projectedNewWords = floor(processingSpeed × timeSinceLastChunk)
estimatedTotalWords = reportedWords + projectedNewWords
readingTime = estimatedTotalWords / userReadingWPM
```

This provides a more accurate estimate than just using `reportedWords`, since chunks can be large (200+ words) and take time to process.

## Visual Behavior

### Library View
- Book cards show reading time overlay at the bottom
- During ingestion: Yellow pulsing text "~45 min • 450 WPM ingest"
- After completion: Green static text "1h 23m"

### Reader Sidebar
- Each chapter shows its reading time below the title
- Processing chapters: `~8 min • 450 WPM` (yellow, updates live)
- Ready chapters: `12 min` (green, static)

## User Experience
- Users can immediately see how much content is available to read while ingestion continues
- Linear projection ensures the estimate is more accurate than just using reported word count
- Live updates (1s interval) provide feedback on ingestion progress
- Time estimates use the user's current reading speed (from WPM slider in reader)

## Testing Notes
- The integration tests in `make test-ollama` verify that `lastChunkCompletedAt` is correctly set during pipeline processing
- Unit tests in `src/hooks/useReadingTimeEstimate.ts` would be helpful additions for testing the projection math
- The BookCard component may need additional mocking in unit tests due to its database subscription
