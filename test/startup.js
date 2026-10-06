const assert = require('node:assert/strict');
const fs = require('node:fs');

const script = fs.readFileSync(require('node:path').join(__dirname, '..', 'start-local.ps1'), 'utf8');

assert.match(script, /Start-Process\s+-FilePath\s+'npm\.cmd'\s+-ArgumentList\s+'start'[\s\S]*?-WindowStyle\s+Hidden/i);
assert.match(script, /D:\\xamppp/i);
assert.doesNotMatch(script, /php\.exe/i, 'TikLiveTools must not start PHP for its local Node server');

console.log('TikLiveTools startup visibility test passed');
