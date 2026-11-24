const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'portfolio.js'), 'utf8');
const start = source.indexOf('  const getYouTubeVideoId =');
const end = source.indexOf('  const pauseCardVideos =');
assert.ok(start !== -1 && end > start);

const { getYouTubeVideoId, renderYouTubePlayer } = vm.runInNewContext(
  `${source.slice(start, end)}\n({ getYouTubeVideoId, renderYouTubePlayer })`,
  {
    URL,
    document: { createElement: (tagName) => ({ tagName }) },
    window: { location: { origin: 'https://example.com' } }
  }
);

test('extracts valid IDs from YouTube URL formats', () => {
  const videoId = '3BZA15qpBAw';
  for (const url of [
    `https://youtube.com/shorts/${videoId}?feature=share`,
    `https://www.youtube.com/watch?v=${videoId}`,
    `https://youtu.be/${videoId}?t=5`,
    `https://m.youtube.com/shorts/${videoId}`,
    `https://www.youtube.com/embed/${videoId}`
  ]) assert.equal(getYouTubeVideoId(url), videoId);

  for (const url of [
    'https://youtube.com/shorts/too-short',
    'https://youtube.com/shorts/3BZA15qpBAww',
    `https://example.com/shorts/${videoId}`,
    'not a URL'
  ]) assert.equal(getYouTubeVideoId(url), '');
});

test('renders a Shorts iframe and falls back when the thumbnail fails', () => {
  const container = {
    classList: { add(value) { assert.equal(value, 'has-video'); } },
    replaceChildren(...children) { this.children = children; }
  };
  renderYouTubePlayer(container, 'https://youtube.com/shorts/3BZA15qpBAw', 'Project video');

  const [thumbnail, frame] = container.children;
  assert.equal(thumbnail.src, 'https://i.ytimg.com/vi/3BZA15qpBAw/maxresdefault.jpg');
  assert.equal(frame.src, 'https://www.youtube.com/embed/3BZA15qpBAw?enablejsapi=1&origin=https%3A%2F%2Fexample.com');
  thumbnail.onerror();
  assert.equal(thumbnail.src, 'https://i.ytimg.com/vi/3BZA15qpBAw/hqdefault.jpg');
  assert.equal(thumbnail.onerror, null);
});