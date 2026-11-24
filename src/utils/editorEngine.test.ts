import test from 'node:test';
import assert from 'node:assert/strict';
import {
  autoGenerateSubtitlesFromScript,
  formatTimecode,
  getCanvasDimensions,
  getTotalTimelineDuration,
  resolveActiveSubtitle,
  resolveSceneAtTime,
} from './editorEngine';
import type { SceneBreakdown, SubtitleSegment } from '../types';

const SAMPLE_SCENES: SceneBreakdown[] = [
  {
    id: 's1',
    sceneNumber: 1,
    durationSec: 4,
    visualSummary: 'Opening flame wok hook',
    t2iPrompt: 'Wok flame macro shot',
    t2vPrompt: 'Fast push in on wok',
    cameraMotion: 'Push-in',
    transition: 'zoom-punch',
    imageUrl: '/src/assets/images/scene_street_food_1795502590753.jpg',
  },
  {
    id: 's2',
    sceneNumber: 2,
    durationSec: 5,
    visualSummary: 'Pouring iced matcha espresso',
    t2iPrompt: 'Matcha espresso swirl',
    t2vPrompt: 'Slow motion pour',
    cameraMotion: 'Macro orbit',
    transition: 'whip-pan',
    imageUrl: '/src/assets/images/scene_coffee_pour_1795502591694.jpg',
  },
];

test('calculates total timeline duration and aspect dimensions accurately', () => {
  assert.equal(getTotalTimelineDuration(SAMPLE_SCENES), 9);
  assert.deepEqual(getCanvasDimensions('9:16'), { width: 540, height: 960 });
  assert.deepEqual(getCanvasDimensions('16:9'), { width: 1280, height: 720 });
  assert.deepEqual(getCanvasDimensions('1:1'), { width: 720, height: 720 });
});

test('resolves active scene and transition progress near scene boundary', () => {
  const early = resolveSceneAtTime(SAMPLE_SCENES, 1.0, 0.5);
  assert.ok(early);
  assert.equal(early.sceneIndex, 0);
  assert.equal(early.transitionProgress, 0);

  const midTransition = resolveSceneAtTime(SAMPLE_SCENES, 3.75, 0.5);
  assert.ok(midTransition);
  assert.equal(midTransition.sceneIndex, 0);
  assert.equal(midTransition.nextScene?.id, 's2');
  assert.equal(Number(midTransition.transitionProgress.toFixed(2)), 0.5);

  const secondScene = resolveSceneAtTime(SAMPLE_SCENES, 5.2, 0.5);
  assert.ok(secondScene);
  assert.equal(secondScene.sceneIndex, 1);
  assert.equal(secondScene.nextScene, null);
});

test('generates evenly timed subtitle bites and tracks active word index', () => {
  const script = 'Jujurly ini street food paling gokil malam ini. Api wajannya literally bikin aroma smoky!';
  const subs = autoGenerateSubtitlesFromScript(script, 8);
  assert.ok(subs.length >= 2);
  assert.equal(subs[0].startSec, 0);
  assert.ok(subs[subs.length - 1].endSec <= 8);

  const active = resolveActiveSubtitle(subs as SubtitleSegment[], 0.3);
  assert.ok(active);
  assert.equal(active.activeWordIndex, 0);
  assert.ok(active.words.length > 0);
});

test('formats timecodes cleanly with tenths', () => {
  assert.equal(formatTimecode(0), '00:00.0');
  assert.equal(formatTimecode(65.4), '01:05.4');
});
