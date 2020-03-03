import Server from 'squad-server';

import {
  discordChat,
  discordTeamkill,
  influxdbLog,
  mapvote,
  mysqlLog
} from 'plugins';

async function main() {
  const server = new Server({
    id: 0,

    host: 'localhost',
    rconPort: 21114,
    rconPassword: 'password',
    logDir: 'C:/path/to/squad/log/folder'
  });

  // discord logging
  await discordChat(server, 'discordChannelID');
  await discordTeamkill(server, 'discordChannelID');

  // database logging
  mysqlLog(server);
  influxdbLog(server);

  // in game features
  mapvote(server);

  await server.watch();
}

main();
