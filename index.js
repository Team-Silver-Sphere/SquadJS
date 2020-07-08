import Discord from 'discord.js';
import mysql from 'mysql';
import Influx from 'influx';

import Server from 'squad-server';
import SquadLayerFilter from 'connectors/squad-layer-filter';

import {
  discordAdminCamLogs,
  discordChat,
  discordChatAdminRequest,
  discordServerStatus,
  discordTeamkill,
  influxdbLog,
  influxdbLogDefaultSchema,
  mapvote,
  mysqlLog,
  teamRandomizer,
  seedingMessage
} from 'plugins';

async function main() {
  const server = new Server({
    id: 1,

    host: 'xxx.xxx.xxx.xxx',
    queryPort: 27165,
    rconPort: 21114,
    rconPassword: 'password',

    // Uncomment the following lines to read logs over FTP.
    // ftpPort: 21,
    // ftpUser: 'FTP Username',
    // ftpPassword: 'FTP Password',
    // logReaderMode: 'ftp',

    logDir: 'C:/path/to/squad/log/folder'
  });

  // Discord Plugins
  const discordClient = new Discord.Client();
  await discordClient.login('Discord Login Token');
  await discordAdminCamLogs(server, discordClient, 'discordChannelID');
  await discordChat(server, discordClient, 'discordChannelID');
  await discordChatAdminRequest(server, discordClient, 'discordChannelID', { pingGroups: ['discordGroupID'] });
  await discordServerStatus(server, discordClient);
  await discordTeamkill(server, discordClient, 'discordChannelID');

  // in game features
  const squadLayerFilter = SquadLayerFilter.buildFromFilter({});
  mapvote(server, 'didyoumean', squadLayerFilter, {});

  teamRandomizer(server);
  seedingMessage(server);

  // MySQL Plugins
  const mysqlPool = mysql.createPool({
    connectionLimit: 10,
    host: 'host',
    port: 3306,
    user: 'squadjs',
    password: 'password',
    database: 'squadjs'
  });
  mysqlLog(server, mysqlPool);

  // Influx Plugins
  const influxDB = new Influx.InfluxDB({
    host: 'host',
    port: 8086,
    username: 'squadjs',
    password: 'password',
    database: 'squadjs',
    schema: influxdbLogDefaultSchema
  });
  influxdbLog(server, influxDB);

  await server.watch();
}

main();
