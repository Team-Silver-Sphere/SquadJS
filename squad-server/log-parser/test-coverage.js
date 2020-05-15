import fs from 'fs';
import readLine from 'readline';

import CLIProgress from 'cli-progress';

import printLogo from 'core/utils/print-logo';

import rules from './rules/index.js';

const TEST_FILE = './squad-server/log-parser/test-data/SquadGame.log';
const EXAMPLES = 10;

async function main() {
  printLogo();
  const progressBar = new CLIProgress.SingleBar(
    { format: 'Coverage Test | {bar} | {value}/{total} ({percentage}%) Lines' },
    CLIProgress.Presets.shades_classic
  );
  progressBar.start(await getTestFileLength(), 0);

  let total = 0;
  let matched = 0;
  const unmatchedLogs = [];

  const testFile = readLine.createInterface({
    input: fs.createReadStream(TEST_FILE)
  });

  for await (const line of testFile) {
    total += 1;

    let matchedLine = false;

    for (const rule of rules) {
      if (!line.match(rule.regex)) continue;

      matchedLine = true;
      break;
    }

    if (matchedLine) matched += 1;
    else if (unmatchedLogs.length <= EXAMPLES) unmatchedLogs.push(line);

    progressBar.update(total);
  }

  progressBar.stop();

  console.log('Done.');
  console.log();
  console.log(
    `Matched ${matched} / ${total} (${(matched / total) * 100}%) log lines.`
  );
  console.log();
}

main();

function getTestFileLength() {
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    fs.createReadStream(TEST_FILE)
      .on('data', buffer => {
        let idx = -1;
        lineCount--; // Because the loop will run once for idx=-1
        do {
          idx = buffer.indexOf(10, idx + 1);
          lineCount++;
        } while (idx !== -1);
      })
      .on('end', () => {
        resolve(lineCount);
      })
      .on('error', reject);
  });
}
