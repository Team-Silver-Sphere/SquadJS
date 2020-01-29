import Server from 'squad-server';

import { discordTeamkill, influxdbLog, mysqlLog } from 'plugins';

async function main() {
  const server = new Server({
    id: 0,

    logDir: './test-data',
    testMode: true
  });

  await discordTeamkill(server, 'channelID');
  influxdbLog(server);
  mysqlLog(server);

  server.watch();
}

main();
