import Server from 'squad-server';

import { discordTeamkill, influxdbLog, mysqlLog } from 'plugins';

async function main() {
  const server = new Server({
    id: 0,

    logDir: './squad-server/log-parser/test-data',
    testMode: true
  });

  await discordTeamkill(server, '667741905228136459');
  // influxdbLog(server);
  // mysqlLog(server);

  server.watch();
}

main();
