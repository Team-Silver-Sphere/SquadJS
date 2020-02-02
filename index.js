import Server from 'squad-server';

import { discordChat, discordTeamkill, influxdbLog, mysqlLog } from 'plugins';

async function main() {
  const server = new Server({
    id: 0,

    logParserEnabled: true,
    logParserLogDir: './squad-server/log-parser/test-data',
    logParserTestMode: true
  });

  await discordChat(server, '667741905228136459');
  await discordTeamkill(server, '667741905228136459');
  influxdbLog(server);
  mysqlLog(server);

  await server.watch();
}

main();
