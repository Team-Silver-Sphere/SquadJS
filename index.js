import SquadServer from 'squad-server';
import printLogo from 'squad-server/logo';

printLogo();

const config = process.env.config;
const configPath = process.argv[2];

if (config && configPath) throw new Error('Cannot accept both a config and config path.');

let server;
if (config) {
  server = SquadServer.buildFromConfigString(config);
} else {
  server = SquadServer.buildFromConfigFile(configPath || './config.json');
}

server.then((server) => server.watch());
