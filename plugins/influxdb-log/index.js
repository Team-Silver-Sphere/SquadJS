import InfluxDBConnector from 'connectors/influxdb';

import {
  LOG_PARSER_NEW_GAME,
  LOG_PARSER_PLAYER_DIE,
  LOG_PARSER_PLAYER_WOUND,
  LOG_PARSER_REVIVE,
  LOG_PARSER_TICK_RATE
} from 'squad-server/events/log-parser';

import { SERVER_PLAYERS_UPDATED } from 'squad-server/events/server';

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

  server.on(SERVER_PLAYERS_UPDATED, players => {
    InfluxDBConnector.writePoint({
      measurement: 'PlayerCount',
      tags: { server: server.id },
      fields: { player_count: players.length },
      timestamp: new Date()
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
        victim: info.victim ? info.victim.steamID : null,
        victimName: info.victim ? info.victim.name : null,
        victimTeamID: info.victim ? info.victim.teamID : null,
        victimSquadID: info.victim ? info.victim.squadID : null,
        attacker: info.attacker ? info.attacker.steamID : null,
        attackerName: info.attacker ? info.attacker.name : null,
        attackerTeamID: info.attacker ? info.attacker.teamID : null,
        attackerSquadID: info.attacker ? info.attacker.squadID : null,
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
        victim: info.victim ? info.victim.steamID : null,
        victimName: info.victim ? info.victim.name : null,
        victimTeamID: info.victim ? info.victim.teamID : null,
        victimSquadID: info.victim ? info.victim.squadID : null,
        attacker: info.attacker ? info.attacker.steamID : null,
        attackerName: info.attacker ? info.attacker.name : null,
        attackerTeamID: info.attacker ? info.attacker.teamID : null,
        attackerSquadID: info.attacker ? info.attacker.squadID : null,
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
        victim: info.victim ? info.victim.steamID : null,
        victimName: info.victim ? info.victim.name : null,
        victimTeamID: info.victim ? info.victim.teamID : null,
        victimSquadID: info.victim ? info.victim.squadID : null,
        attacker: info.attacker ? info.attacker.steamID : null,
        attackerName: info.attacker ? info.attacker.name : null,
        attackerTeamID: info.attacker ? info.attacker.teamID : null,
        attackerSquadID: info.attacker ? info.attacker.squadID : null,
        damage: info.damage,
        weapon: info.weapon,
        teamkill: info.teamkill,
        reviver: info.reviver ? info.reviver.steamID : null,
        reviverName: info.reviver ? info.reviver.name : null,
        reviverTeamID: info.reviver ? info.reviver.teamID : null,
        reviverSquadID: info.reviver ? info.reviver.squadID : null
      },
      timestamp: info.time
    });
  });
}
