import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function (configPath = './config.json') {
  const fullConfigPath = path.resolve(__dirname, '../', configPath);
  const fullExamplePath = path.resolve(__dirname, '../', './example-config.json');

  if (!fs.existsSync(fullConfigPath)) {
    fs.copyFile(fullExamplePath, fullConfigPath, (err) => {
      if (err) throw err;
      throw new Error('Config generated from example, Configure config.json and run again.');
    });
  }

  const unparsedConfig = fs.readFileSync(fullConfigPath, 'utf8');

  let parsedConfig;
  try {
    parsedConfig = JSON.parse(unparsedConfig);
  } catch (err) {
    throw new Error('Unable to parse config file.');
  }

  return parsedConfig;
}
