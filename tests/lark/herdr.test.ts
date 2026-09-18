// The pane side of the herdr adapter: quoting for `pane run`, and the three
// calls the interactive setup hand-off makes, against a scripted `herdr`.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { closePane, promptPane, quoteForPaneShell, runInPane, sendKeys, splitPane, type HerdrRun, type HerdrRunner } from '../../skills/agent-lark/src/herdr.js';

function recorder(answer: (args: string[]) => HerdrRun): { run: HerdrRunner; calls: string[][] } {
  const calls: string[][] = [];
  return {
    calls,
    run: async (args) => {
      calls.push(args);
      return answer(args);
    },
  };
}

test('POSIX quoting: plain words pass, anything else is single-quoted, a word starting with = is always quoted (zsh expands =cmd)', () => {
  assert.equal(quoteForPaneShell(['/usr/bin/node', '/a/b.mjs', 'setup', '--reuse'], 'darwin'), '/usr/bin/node /a/b.mjs setup --reuse');
  assert.equal(quoteForPaneShell(['x y', "it's", '$HOME', ''], 'linux'), `'x y' 'it'\\''s' '$HOME' ''`);
  assert.equal(quoteForPaneShell(['=ls', 'a=b'], 'linux'), `'=ls' a=b`);
});

test('Windows quoting follows CommandLineToArgvW as list2cmdline applies it: spaces force quoting, a quote is escaped, a trailing backslash inside quotes is doubled', () => {
  assert.equal(quoteForPaneShell(['C:\\node.exe', 'a b', 'say "hi"', 'C:\\dir\\', 'x y\\'], 'win32'), 'C:\\node.exe "a b" "say \\"hi\\"" C:\\dir\\ "x y\\\\"');
});

test('splitPane: the split is asked below the caller with cwd, taking focus; the new pane id comes out of result.pane.pane_id', async () => {
  const ok = recorder(() => ({ ok: true, stdout: JSON.stringify({ id: 'x', result: { pane: { pane_id: 'w1:p7' } } }) }));
  assert.equal(await splitPane('/work', 'w1:p2', ok.run), 'w1:p7');
  // The new pane takes focus: the human types the secret there next.
  assert.deepEqual(ok.calls, [['pane', 'split', '--pane', 'w1:p2', '--direction', 'down', '--cwd', '/work']]);
  const refused = recorder(() => ({ ok: false, stdout: '', error: 'herdr: not found' }));
  assert.equal(await splitPane('/work', 'w1:p2', refused.run), null);
  const odd = recorder(() => ({ ok: true, stdout: '{"result":{}}' }));
  assert.equal(await splitPane('/work', 'w1:p2', odd.run), null);
});

test('runInPane types one quoted command line into the pane; closePane closes it', async () => {
  const rec = recorder(() => ({ ok: true, stdout: '{}' }));
  assert.equal(await runInPane('w1:p7', ['/usr/bin/node', '/skill/cli.mjs', '--home', '/tmp/h', 'setup', '--reuse'], rec.run), true);
  assert.deepEqual(rec.calls[0], ['pane', 'run', 'w1:p7', quoteForPaneShell(['/usr/bin/node', '/skill/cli.mjs', '--home', '/tmp/h', 'setup', '--reuse'])]);
  assert.equal((await closePane('w1:p7', rec.run)).ok, true);
  assert.deepEqual(rec.calls[1], ['pane', 'close', 'w1:p7']);
});

// ---- the agent side: prompt / send-keys against a scripted `herdr`, and how a refusal is read ----

const refusal = JSON.stringify({ error: { code: 'agent_not_found', message: 'agent target w1:p9 not found' }, id: 'cli:agent:prompt' });

test('promptPane: a refusal herdr prints on stderr with exit 1 comes back as its own error code, not as spawn_failed', async () => {
  // herdr 0.9.1: the error envelope goes to stderr and the process exits 1.
  const rec = recorder(() => ({ ok: false, stdout: '', stderr: refusal, error: 'Command failed: herdr agent prompt w1:p9 hi' }));
  const out = await promptPane('w1:p9', 'hi', rec.run);
  assert.deepEqual(rec.calls, [['agent', 'prompt', 'w1:p9', 'hi']]);
  assert.equal(out.ok, false);
  assert.equal(out.code, 'agent_not_found');
  assert.match(out.message ?? '', /not found/);
});

test('promptPane: an envelope on stdout is read the same way; a plain result is ok; a herdr that cannot be spawned is spawn_failed', async () => {
  const onStdout = recorder(() => ({ ok: true, stdout: refusal }));
  assert.equal((await promptPane('w1:p9', 'hi', onStdout.run)).code, 'agent_not_found');
  const fine = recorder(() => ({ ok: true, stdout: JSON.stringify({ id: 'cli:agent:prompt', result: { type: 'agent_prompted' } }) }));
  assert.deepEqual(await promptPane('w1:p1', 'hi', fine.run), { ok: true });
  const missing = recorder(() => ({ ok: false, stdout: '', stderr: '', error: 'spawn herdr ENOENT' }));
  const out = await promptPane('w1:p1', 'hi', missing.run);
  assert.equal(out.code, 'spawn_failed');
  assert.match(out.message ?? '', /ENOENT/);
});

test('sendKeys sends one logical key to the agent and reads the answer like promptPane', async () => {
  const ok = recorder(() => ({ ok: true, stdout: JSON.stringify({ id: 'cli:agent:send-keys', result: { type: 'ok' } }) }));
  assert.deepEqual(await sendKeys('w1:p1', 'ctrl+enter', ok.run), { ok: true });
  assert.deepEqual(ok.calls, [['agent', 'send-keys', 'w1:p1', 'ctrl+enter']]);
  const gone = recorder(() => ({ ok: false, stdout: '', stderr: refusal, error: 'Command failed' }));
  assert.equal((await sendKeys('w1:p1', 'ctrl+s', gone.run)).code, 'agent_not_found');
});

test('promptPane: a zero exit with no envelope on either stream is bad_output, not ok', async () => {
  const noise = recorder(() => ({ ok: true, stdout: 'not json at all', stderr: '' }));
  const out = await promptPane('w1:p1', 'hi', noise.run);
  assert.equal(out.ok, false);
  assert.equal(out.code, 'bad_output');
});

test('promptPane: bad_output on a zero exit names what was on stderr when stdout is empty', async () => {
  const noisy = recorder(() => ({ ok: true, stdout: '', stderr: 'warning: something odd' }));
  const out = await promptPane('w1:p1', 'hi', noisy.run);
  assert.equal(out.code, 'bad_output');
  assert.match(out.message ?? '', /something odd/);
});
