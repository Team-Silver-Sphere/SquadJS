import InfluxDBConnector from 'connectors/influxdb';

import {
  LOG_PARSER_NEW_GAME,
  LOG_PARSER_PLAYER_DIE,
  LOG_PARSER_PLAYER_WOUND,
  LOG_PARSER_REVIVE,
  LOG_PARSER_TICK_RATE
} from 'squad-server/events/log-parser';

export default function influxdbLog(server) {
  if (!server)
    throw new Error(
      'InfluxDBLog must be provided with a reference to the server.'
    );

  server.on(LOG_PARSER_TICK_RATE, info => {
    InfluxDBConnector.writePoint({
      measurement: 'ServerTickRate',
      tags: { server: server.id },
      fields: { tick_rate: info.tickRate },
      timestamp: info.time
    });
  });

  server.on(LOG_PARSER_NEW_GAME, info => {
    InfluxDBConnector.writePoint({
      measurement: 'Match',
      tags: { server: server.id },
      fields: { map: info.map, layer: info.layer },
      timestamp: info.time
    });
  });

  server.on(LOG_PARSER_PLAYER_WOUND, info => {
    InfluxDBConnector.writePoint({
      measurement: 'PlayerWound',
      tags: { server: server.id },
      fields: {
        victim: info.victim.steamID,
        victimName: info.victim.name,
        victimTeamID: info.victim.teamID,
        victimSquadID: info.victim.squadID,
        attacker: info.attacker.steamID,
        attackerName: info.attacker.name,
        attackerTeamID: info.attacker.teamID,
        attackerSquadID: info.attacker.squadID,
        damage: info.damage,
        weapon: info.weapon,
        teamkill: info.teamkill
      },
      timestamp: info.time
    });
  });

  server.on(LOG_PARSER_PLAYER_DIE, info => {
    InfluxDBConnector.writePoint({
      measurement: 'PlayerDie',
      tags: { server: server.id },
      fields: {
        victim: info.victim.steamID,
        victimName: info.victim.name,
        victimTeamID: info.victim.teamID,
        victimSquadID: info.victim.squadID,
        attacker: info.attacker.steamID,
        attackerName: info.attacker.name,
        attackerTeamID: info.attacker.teamID,
        attackerSquadID: info.attacker.squadID,
        damage: info.damage,
        weapon: info.weapon,
        teamkill: info.teamkill
      },
      timestamp: info.time
    });
  });

  server.on(LOG_PARSER_REVIVE, info => {
    InfluxDBConnector.writePoint({
      measurement: 'Revive',
      tags: { server: server.id },
      fields: {
        victim: info.victim.steamID,
        victimName: info.victim.name,
        victimTeamID: info.victim.teamID,
        victimSquadID: info.victim.squadID,
        attacker: info.attacker.steamID,
        attackerName: info.attacker.name,
        attackerTeamID: info.attacker.teamID,
        attackerSquadID: info.attacker.squadID,
        damage: info.damage,
        weapon: info.weapon,
        teamkill: info.teamkill,
        reviver: info.reviver.steamID,
        reviverName: info.reviver.name,
        reviverTeamID: info.reviver.teamID,
        reviverSquadID: info.reviver.squadID
      },
      timestamp: info.time
    });
  });
}
