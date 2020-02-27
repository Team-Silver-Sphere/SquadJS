import InfluxDBConnector from 'connectors/influxdb';

import {
  LOG_PARSER_NEW_GAME,
  LOG_PARSER_PLAYER_DIE,
  LOG_PARSER_PLAYER_WOUND,
  LOG_PARSER_REVIVE,
  LOG_PARSER_TICK_RATE
} from '../../events/log-parser.js';

export default function influxdbLog(server) {
  if (!server)
    throw new Error(
      'InfluxDBLog must be provided with a reference to the server.'
    );

  server.on(LOG_PARSER_NEW_GAME, info => {
    InfluxDBConnector.writePoint({
      measurement: 'game',
      tags: { server: server.id },
      fields: { map: info.map, layer: info.layer },
      timestamp: info.time
    });
  });

  server.on(LOG_PARSER_PLAYER_DIE, info => {
    InfluxDBConnector.writePoint({
      measurement: 'player_die',
      tags: { server: server.id },
      fields: {
        victim: info.victim,
        damage: info.damage,
        attacker: info.attacker,
        weapon: info.weapon,
        teamkill: info.teamkill
      },
      timestamp: info.time
    });
  });

  server.on(LOG_PARSER_PLAYER_WOUND, info => {
    InfluxDBConnector.writePoint({
      measurement: 'player_wound',
      tags: { server: server.id },
      fields: {
        victim: info.victim,
        damage: info.damage,
        attacker: info.attacker,
        weapon: info.weapon,
        teamkill: info.teamkill
      },
      timestamp: info.time
    });
  });

  server.on(LOG_PARSER_REVIVE, info => {
    InfluxDBConnector.writePoint({
      measurement: 'revive',
      tags: { server: server.id },
      fields: {
        victim: info.victim,
        damage: info.damage,
        attacker: info.attacker,
        weapon: info.weapon,
        reviver: info.reviver
      },
      timestamp: info.time
    });
  });

  server.on(LOG_PARSER_TICK_RATE, info => {
    InfluxDBConnector.writePoint({
      measurement: 'tick_rate',
      tags: { server: server.id },
      fields: { tick_rate: info.tickRate },
      timestamp: info.time
    });
  });
}
