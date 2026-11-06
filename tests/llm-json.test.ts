// Reading the JSON out of a model reply. A reply we can't read makes the router fall back to the built-in analyst.
import { extractJson, shapeNear } from '../server/services/ai/llm-provider';
import { unwrap } from '../server/services/ai/json-reply';
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };
const throws = (f: () => unknown) => { try { f(); return false; } catch { return true; } };

ok(extractJson('{"a":1}').a === 1, 'plain JSON');
ok(extractJson('Here you go:\n```json\n{"a":[1,2]}\n```').a.length === 2, 'code fences and chatter around the object are ignored');
ok(extractJson('{"a":[{"x":1},{"x":2},],"b":2,}').a.length === 2, 'trailing commas are repaired');
ok(throws(() => extractJson('{"a":[{"x":1} {"x":2}]}')), 'a missing comma is still an error (the caller asks again)');
ok(throws(() => extractJson('no json here')), 'text without an object is an error');
ok(throws(() => extractJson('{"a":"cut off')), 'a cut-off reply is an error');

const raw = '{"a":["Late \'orders\' hurt Acme Corp", "second" bad],"b":1}';
const shape = shapeNear(raw, "Expected ',' or ']' after array element in JSON at position 38");
ok(!/Acme|orders|Late/.test(shape) && shape.includes('x'), 'log snippet shows structure but not the text', shape);

ok(JSON.stringify(unwrap({ response: { a: 1 } })) === '{"a":1}', 'an answer nested under one generic key is unwrapped');
ok(JSON.stringify(unwrap({ a: 1, b: 2 })) === '{"a":1,"b":2}', 'a normal answer is left alone');
ok(JSON.stringify(unwrap({ data: [1] })) === '{"data":[1]}', 'a real field holding a list is left alone');

if (fails) { console.log(`\nFAILED: ${fails}`); process.exit(1); } else console.log('\nAll llm-json checks passed');
