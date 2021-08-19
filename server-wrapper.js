import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Logger from 'core/logger';
import SquadServerFactory from 'squad-server/factory';
import printLogo from 'squad-server/logo';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  await printLogo();

  const configPath = process.argv[2];

  // Configure sensitive config from environment
  await setConfig(configPath);

  // create a SquadServer instance
  const server = await SquadServerFactory.buildFromConfigFile(configPath);

  // watch the server
  await server.watch();

  // now mount the plugins
  await Promise.all(server.plugins.map(async (plugin) => await plugin.mount()));
}

async function setConfig(configPath) {
  Logger.verbose('ServerWrapper', 1, 'Setting config...');

  const p = path.resolve(__dirname, configPath);

  Logger.verbose('ServerWrapper', 1, `Checking file exists ${p}...`);

  if (!fs.existsSync(p)) throw new Error('Config file does not exist.');

  Logger.verbose('ServerWrapper', 1, `Reading config...`);

  const configData = fs.readFileSync(p, 'utf8');

  let json = JSON.parse(configData);

  Logger.verbose('ServerWrapper', 1, `Setting Host...`);
  json.server.host = process.env.HOST;
  json.server.queryPort = process.env.QUERY_PORT;

  Logger.verbose('ServerWrapper', 1, `Setting RCON...`);
  json.server.rconPort = process.env.RCON_PORT;
  json.server.rconPassword = process.env.RCON_PASSWORD;

  Logger.verbose('ServerWrapper', 1, `Setting FTP...`);
  json.server.logDir = process.env.LOG_DIR;
  json.server.ftp.port = process.env.FTP_PORT;
  json.server.ftp.user = process.env.FTP_USER;
  json.server.ftp.password = process.env.FTP_PASSWORD;

  Logger.verbose('ServerWrapper', 1, `Setting Admin Lists...`);
  json.server.adminLists[0].source = process.env.ADMIN_LIST_URL;

  Logger.verbose('ServerWrapper', 1, `Setting Discord Token...`);
  json.connectors.discord = process.env.DISCORD_TOKEN;

  Logger.verbose('ServerWrapper', 1, `Writing config...`);

  fs.writeFileSync(p, JSON.stringify(json));
}

main();
