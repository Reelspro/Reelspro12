const fs = require('fs');
const path = require('path');

const rootOutput = path.resolve(__dirname, '../../output');
const backendOutput = path.resolve(__dirname, '../output');

console.log('Root output exists:', fs.existsSync(rootOutput));
if (fs.existsSync(rootOutput)) {
  console.log('Root output contents:', fs.readdirSync(rootOutput));
  if (fs.existsSync(path.join(rootOutput, 'reels'))) {
    console.log('Root output/reels contents:', fs.readdirSync(path.join(rootOutput, 'reels')));
  }
}

console.log('Backend output exists:', fs.existsSync(backendOutput));
if (fs.existsSync(backendOutput)) {
  console.log('Backend output contents:', fs.readdirSync(backendOutput));
  if (fs.existsSync(path.join(backendOutput, 'reels'))) {
    console.log('Backend output/reels contents:', fs.readdirSync(path.join(backendOutput, 'reels')));
  }
}
process.exit(0);
