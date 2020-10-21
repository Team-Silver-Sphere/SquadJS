import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';


export function mergeConfig(fullConfigPath, fullExamplePath){

  if (!fs.existsSync(fullConfigPath)) {
    fs.copyFileSync(fullExamplePath, fullConfigPath);
    throw new Error(`SquadJS couldn't find any configuration file. We have generated a config file at ${fullConfigPath}. This file needs to be configured before running SquadJS again.`);
  }

  const unparsedConfig = fs.readFileSync(fullConfigPath, 'utf8');
  let parsedConfig;
  try {
    parsedConfig = JSON.parse(unparsedConfig);
  } catch (err) {
    throw new Error(`Unable to parse config file. ${err}`);
  }

  const parsedExampleConfig = JSON.parse(fs.readFileSync(fullExamplePath, 'utf8'));

  // merges two lists of objects based on the value of a given common property
  // items from the second list will override matching items in the first
  function merge(a, b, prop){
    var merged =  a.filter( aitem => ! b.find ( bitem => aitem[prop] === bitem[prop]) )
    merged = merged.concat(b);
    merged.sort((a, b) => a[prop] < b[prop] ? -1 : a[prop] > b[prop] ? 1 : 0 );
    return merged;
  }

  // merge example plugins and user plugins, in case any new plugins have been added and are not in the users conifg
  parsedConfig.plugins = merge(parsedExampleConfig.plugins, parsedConfig.plugins, "plugin");

  // merges configs, this will add any missing properties for plugins or new sections
  parsedConfig = Object.assign(parsedExampleConfig, parsedConfig);

  if('squadjs' in parsedConfig && parsedConfig.squadjs.autoUpdateMyConfig){
    fs.writeFileSync(fullConfigPath, JSON.stringify(parsedConfig, null, 2));
  }

  return parsedConfig
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const configPath = path.resolve(__dirname, '../../config.json');
const examplePath = path.resolve(__dirname, '../../config-example.json');

mergeConfig(configPath, examplePath);