import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function (configPath = './config.json') {
  const fullPluginConfigPath = path.resolve(__dirname, '../', configPath);
  const fullServerConfigPath = path.resolve(__dirname, '../', './server-config.json');
  const fullExamplePath = path.resolve(__dirname, '../', './example-config.json');

  if (!fs.existsSync(fullServerConfigPath)) {
    fs.copyFileSync(fullExamplePath, fullServerConfigPath);
    throw new Error(`SquadJS couldn't find any Server configuration file. We have generated a config file at ${fullConfigPath}. This file needs to be configured before running SquadJS again.`);
  }

  const unparsedPluginConfig = fs.readFileSync(fullPluginConfigPath, 'utf8');
  const unparsedServerConfig = fs.readFileSync(fullServerConfigPath, 'utf8');

  let parsedPluginConfig, parsedServerConfig;
  try {
    parsedPluginConfig = JSON.parse(unparsedPluginConfig);
    parsedServerConfig = JSON.parse(unparsedServerConfig);
  } catch (err) {
    throw new Error(`Unable to parse config files. ${err}`);
  }

  const parsedConfig = {}
  Object.assign(parsedConfig, parsedServerConfig, parsedPluginConfig);

  return parsedConfig;
}
