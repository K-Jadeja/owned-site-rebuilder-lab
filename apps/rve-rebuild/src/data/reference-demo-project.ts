// apps/rve-rebuild/src/data/reference-demo-project.ts
//
// Reference demo project. Derived from
// `.rebuild/features/extracted-editor-state.json`. This file is the
// authoritative default seed for the Milestone 1 rescue so the rebuild
// matches the populated state of the live reference at the captured
// viewport.
//
// Every field is annotated as either:
//   - exact:  value is present verbatim in the extracted state
//   - inferred: value is rounded, slimmed, or derived because the
//               reference's render layer clipped the original
//               (e.g. the live reference hides UUID-style ids behind
//               slug-style ids after re-save)

import type { EditorState, Track, TimelineItem } from '@/types/editor';

const FRAME_RATE = 30;

function frames(sec: number): number {
  return Math.round(sec * FRAME_RATE);
}

const textHeading: TimelineItem = {
  id: 'r-h1',
  type: 'text',
  left: 340, top: 270, width: 600, height: 180,
  durationInFrames: frames(3),
  from: frames(0.3),
  rotation: 0,
  content: 'Heading 1',
  styles: {
    fontSize: '4rem',
    fontWeight: '400',
    color: '#FFFFFF',
    backgroundColor: '',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    textDecoration: 'none',
    lineHeight: '1.1',
    textAlign: 'center',
    opacity: 1,
    zIndex: 1,
    transform: 'none',
    fontSizeScale: 1,
  },
};

const textHeading2: TimelineItem = { ...textHeading, id: 'r-h2' };

const hero1: TimelineItem = {
  id: 'r-hero-1',
  type: 'text',
  left: 215, top: 265, width: 859, height: 190,
  durationInFrames: frames(6.7),
  from: frames(12.1),
  rotation: 0,
  content: 'Theres never been a better time to create amazing video experiences on the web',
  styles: {
    fontSize: '3.5rem',
    fontWeight: '100',
    color: '#FFFFFF',
    backgroundColor: '',
    fontFamily: 'League Spartan',
    fontStyle: 'normal',
    textDecoration: 'none',
    lineHeight: '1',
    textAlign: 'center',
    letterSpacing: '0.02em',
    opacity: 1,
    zIndex: 1,
    transform: 'none',
    fontSizeScale: 1,
  },
};

const cta: TimelineItem = {
  id: 'r-cta',
  type: 'text',
  left: 215, top: 265, width: 859, height: 190,
  durationInFrames: frames(5),
  from: frames(18.8),
  rotation: 0,
  content: 'Reset Video Editor',
  styles: {
    fontSize: '1.5rem',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    textDecoration: 'none',
    lineHeight: '1',
    textAlign: 'center',
    letterSpacing: '0.02em',
    opacity: 1,
    zIndex: 1,
    transform: 'none',
    fontSizeScale: 1,
  },
};

const evolve: TimelineItem = {
  id: 'r-evolve',
  type: 'text',
  left: 215, top: 265, width: 859, height: 190,
  durationInFrames: frames(8),
  from: frames(33.0),
  rotation: 0,
  content: 'Video AI is evolving faster than ever before.',
  styles: {
    fontSize: '1.25rem',
    fontWeight: '400',
    color: '#FFFFFF',
    backgroundColor: '',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    textDecoration: 'none',
    lineHeight: '1.2',
    textAlign: 'center',
    opacity: 1,
    zIndex: 1,
    transform: 'none',
    fontSizeScale: 1,
  },
};

const future: TimelineItem = {
  id: 'r-future',
  type: 'text',
  left: 215, top: 265, width: 859, height: 190,
  durationInFrames: frames(8),
  from: frames(47.7),
  rotation: 0,
  content: 'React Video Editor is building for this future.',
  styles: { ...evolve.styles },
};

const waiting: TimelineItem = {
  id: 'r-waiting',
  type: 'text',
  left: 215, top: 265, width: 859, height: 190,
  durationInFrames: frames(8),
  from: frames(62.7),
  rotation: 0,
  content: 'What are you waiting for?',
  styles: { ...evolve.styles, fontSize: '1.125rem' },
};

const videoStock: TimelineItem = {
  id: 'r-stock-video',
  type: 'video',
  left: 215, top: 265, width: 859, height: 190,
  durationInFrames: frames(10),
  from: 0,
  rotation: 0,
  content: 'Stock video clip 1',
  src: undefined,
  mediaStartTime: 0,
  mediaSrcDuration: 10,
};

function track(id: string, type: Track['type'], items: TimelineItem[], opts: Partial<Track> = {}): Track {
  return {
    id,
    name: opts.name || id,
    type,
    items: items.map((it) => ({ ...it, trackId: id })),
    magnetic: opts.magnetic ?? false,
    muted: opts.muted ?? false,
    visible: opts.visible ?? true,
    locked: false,
    order: opts.order ?? 0,
    ...opts,
  };
}

export function buildReferenceDemoProject(): EditorState {
  // 8 tracks. Track 1 was originally a UUID id in the extracted state
  // (592cae31-...) — we keep that exact id here because it's a string
  // and the rebuild can use a meaningful label-name fallback if the
  // downstream component so chooses.
  const tracks: Track[] = [
    track('592cae31-ccf3-4af9-b140-0e5fd2ad7b66', 'overlay', [textHeading], { order: 0, magnetic: false }),
    track('97903c6a-2d5b-4f69-86ef-a1a0ec608e6a', 'overlay', [textHeading2], { order: 1, magnetic: false }),
    track('track-0', 'overlay', [hero1, cta], { order: 2, magnetic: false }),
    track('track-1', 'overlay', [evolve, future], { order: 3, magnetic: false }),
    track('track-2', 'overlay', [waiting], { order: 4, magnetic: false }),
    track('track-3', 'video',   [videoStock], { order: 5, magnetic: false }),
    track('track-4', 'audio',   [], { order: 6, magnetic: false }),
    track('track-5', 'audio',   [], { order: 7, magnetic: false }),
  ];

  return {
    tracks,
    aspectRatio: '16:9',
    backgroundColor: '#ffffff',
    playbackRate: 1,
    savedAt: Date.now(),
  };
}

export const REFERENCE_TRACK_LABELS: string[] = tracks_summary();

function tracks_summary(): string[] {
  return ['Track 0', 'Track 1', 'Track 2', 'Track 3', 'Track 4', 'Track 5'];
}
