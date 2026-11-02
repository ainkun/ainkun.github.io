const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const id = 'G-64J13FY14D';
// scripts/build_site.py publishes every page at the root, so every one carries the Google tag.
const pages = fs.readdirSync(root).filter(name => name.endsWith('.html'));
const read = page => fs.readFileSync(path.join(root, page), 'utf8').replace(/\r\n/g, '\n');
const headOf = html => html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
const tagOf = html => headOf(html).match(/  <!-- Google tag \(gtag\.js\) -->\n  <script async src="([^"]+)"><\/script>\n  <script>\n([\s\S]*?)  <\/script>\n/);

test('every published page has the Google tag once, in its head', () => {
  assert.ok(pages.length >= 12, pages.join(', '));
  for (const page of pages) {
    const html = read(page);
    assert.equal(html.split('googletagmanager.com/gtag/js').length - 1, 1, page);
    const tag = tagOf(html);
    assert.ok(tag, page);
    assert.equal(tag[1], `https://www.googletagmanager.com/gtag/js?id=${id}`, page);
  }
});

test('the tag is the same on every page', () => {
  const [first, ...rest] = pages.map(page => tagOf(read(page))[0]);
  rest.forEach((tag, index) => assert.equal(tag, first, pages[index + 1]));
});

test('previews on this computer are not counted, and the site is', () => {
  const code = tagOf(read('index.html'))[2];
  const run = hostname => {
    const context = { location: { hostname }, Date };
    context.window = context;
    vm.runInNewContext(code, context);
    return context;
  };
  for (const hostname of ['localhost', '127.0.0.1', '[::1]', '']) {
    assert.equal(run(hostname)[`ga-disable-${id}`], true, hostname || 'an opened file');
  }
  for (const hostname of ['ainkun.com', 'www.ainkun.com', 'ainkun.github.io']) {
    const page = run(hostname);
    assert.equal(page[`ga-disable-${id}`], undefined, hostname);
    assert.deepEqual(Array.from(page.dataLayer, command => command[0]), ['js', 'config'], hostname);
    assert.deepEqual(Array.from(page.dataLayer[1]), ['config', id], hostname);
  }
});
