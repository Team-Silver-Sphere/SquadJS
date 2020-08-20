import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function (configPath = './config.json') {
  const fullConfigPath = path.resolve(__dirname, '../', configPath);
  if (!fs.existsSync(fullConfigPath)) throw new Error('Config file does not exist.');
  const unparsedConfig = fs.readFileSync(fullConfigPath, 'utf8');

  let parsedConfig;
  try {
    parsedConfig = JSON.parse(unparsedConfig);
  } catch (err) {
    throw new Error('Unable to parse config file.');
  }

  return parsedConfig;
}
