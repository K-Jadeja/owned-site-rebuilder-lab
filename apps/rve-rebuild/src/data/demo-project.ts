// apps/rve-rebuild/src/data/demo-project.ts
//
// Deterministic local demo project. Mirrors the populated state of
// the live reference (recovered from `.rebuild/features/extracted-editor-state.json`)
// and the recovered schema in `.rebuild/features/extracted-track-clip-schema.md`.

import type { EditorState, Track, TimelineItem } from '@/types/editor';

function item(
  id: string,
  type: TimelineItem['type'],
  startFrame: number,
  durationFrames: number,
  text: string,
  styles: Partial<TimelineItem['styles']> = {},
): TimelineItem {
  return {
    id,
    type,
    left: 0,
    top: 0,
    width: 600,
    height: 180,
    durationInFrames: durationFrames,
    from: startFrame,
    rotation: 0,
    content: text,
    styles,
    trackId: '',
  };
}

function track(
  id: string,
  name: string,
  items: TimelineItem[],
  opts: Partial<Track> = {},
): Track {
  return {
    id,
    name,
    items: items.map((it) => ({ ...it, trackId: id })),
    magnetic: true,
    muted: false,
    visible: true,
    locked: false,
    order: 0,
    ...opts,
  };
}

function buildDemoTracks(): Track[] {
  const t0Items: TimelineItem[] = [
    item('demo-h1', 'text', 9, 90, 'Heading 1', {
      fontSize: '4rem',
      fontWeight: '400',
      color: '#FFFFFF',
      fontFamily: 'Inter',
      fontStyle: 'normal',
      textDecoration: 'none',
      lineHeight: '1.1',
      textAlign: 'center',
      opacity: 1,
    }),
  ];
  const t1Items: TimelineItem[] = [
    item('demo-hero', 'text', 363, 201, 'Theres never been a better time to create amazing video experiences on the web', {
      fontSize: '3.5rem',
      fontWeight: '100',
      color: '#FFFFFF',
      fontFamily: 'League Spartan',
      fontStyle: 'normal',
      textDecoration: 'none',
      lineHeight: '1',
      textAlign: 'center',
      letterSpacing: '0.02em',
    }),
    item('demo-cta', 'text', 564, 150, 'Reset Video Editor', {
      fontSize: '1.5rem',
      fontWeight: '500',
      color: '#FFFFFF',
      fontFamily: 'Inter',
      textAlign: 'center',
    }),
  ];
  const t2Items: TimelineItem[] = [
    item('demo-evolve', 'text', 990, 240, 'Video AI is evolving faster than ever before.', {
      fontSize: '1.25rem',
      fontWeight: '400',
      color: '#FFFFFF',
      fontFamily: 'Inter',
      textAlign: 'center',
    }),
    item('demo-future', 'text', 1430, 240, 'React Video Editor is building for this future.', {
      fontSize: '1.25rem',
      fontWeight: '400',
      color: '#FFFFFF',
      fontFamily: 'Inter',
      textAlign: 'center',
    }),
  ];
  const t3Items: TimelineItem[] = [
    item('demo-waiting', 'text', 1880, 240, 'What are you waiting for?', {
      fontSize: '1.125rem',
      fontWeight: '400',
      color: '#FFFFFF',
      fontFamily: 'Inter',
      textAlign: 'center',
    }),
  ];
  const t4Items: TimelineItem[] = [
    {
      id: 'demo-stock-1',
      type: 'video',
      left: 0,
      top: 0,
      width: 600,
      height: 320,
      durationInFrames: 300,
      from: 0,
      rotation: 0,
      content: 'Stock video clip 1',
      trackId: '',
      mediaStartTime: 0,
      mediaSrcDuration: 10,
    },
  ];

  return [
    track('track-text-0', 'Text 0', t0Items, { type: 'text', order: 0 }),
    track('track-text-1', 'Text 1', t1Items, { type: 'text', order: 1 }),
    track('track-text-2', 'Text 2', t2Items, { type: 'text', order: 2 }),
    track('track-text-3', 'Text 3', t3Items, { type: 'text', order: 3 }),
    track('track-video-0', 'Video 0', t4Items, { type: 'video', order: 4 }),
    track('track-audio-0', 'Audio 0', [], { type: 'audio', order: 5 }),
  ];
}

export function buildDemoProject(): EditorState {
  return {
    tracks: buildDemoTracks(),
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    playbackRate: 1,
    savedAt: Date.now(),
  };
}

export const DEMO_TEXT_BY_ITEM_ID: Record<string, string> = {
  'demo-h1': 'Heading 1',
  'demo-hero': 'Theres never been a better time to create amazing video experiences on the web',
  'demo-cta': 'Reset Video Editor',
  'demo-evolve': 'Video AI is evolving faster than ever before.',
  'demo-future': 'React Video Editor is building for this future.',
  'demo-waiting': 'What are you waiting for?',
  'demo-stock-1': 'Stock video clip 1',
};
