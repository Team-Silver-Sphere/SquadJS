import Influx from 'influx';

export default [
  {
    measurement: 'ServerTickRate',
    fields: {
      tick_rate: Influx.FieldType.FLOAT
    },
    tags: ['server']
  },
  {
    measurement: 'PlayerCount',
    fields: {
      player_count: Influx.FieldType.INTEGER
    },
    tags: ['server']
  },
  {
    measurement: 'Match',
    fields: {
      dlc: Influx.FieldType.STRING,
      mapClassname: Influx.FieldType.STRING,
      layerClassname: Influx.FieldType.STRING,
      map: Influx.FieldType.STRING,
      layer: Influx.FieldType.STRING
    },
    tags: ['server']
  },
  {
    measurement: 'PlayerWounded',
    fields: {
      victim: Influx.FieldType.STRING,
      victimName: Influx.FieldType.STRING,
      victimTeamID: Influx.FieldType.INTEGER,
      victimSquadID: Influx.FieldType.INTEGER,
      attacker: Influx.FieldType.STRING,
      attackerName: Influx.FieldType.STRING,
      attackerTeamID: Influx.FieldType.INTEGER,
      attackerSquadID: Influx.FieldType.INTEGER,
      damage: Influx.FieldType.STRING,
      weapon: Influx.FieldType.STRING,
      teamkill: Influx.FieldType.BOOLEAN
    },
    tags: ['server']
  },
  {
    measurement: 'PlayerDied',
    fields: {
      victim: Influx.FieldType.STRING,
      victimName: Influx.FieldType.STRING,
      victimTeamID: Influx.FieldType.INTEGER,
      victimSquadID: Influx.FieldType.INTEGER,
      attacker: Influx.FieldType.STRING,
      attackerName: Influx.FieldType.STRING,
      attackerTeamID: Influx.FieldType.INTEGER,
      attackerSquadID: Influx.FieldType.INTEGER,
      damage: Influx.FieldType.STRING,
      weapon: Influx.FieldType.STRING,
      teamkill: Influx.FieldType.BOOLEAN
    },
    tags: ['server']
  },
  {
    measurement: 'PlayerRevived',
    fields: {
      victim: Influx.FieldType.STRING,
      victimName: Influx.FieldType.STRING,
      victimTeamID: Influx.FieldType.INTEGER,
      victimSquadID: Influx.FieldType.INTEGER,
      attacker: Influx.FieldType.STRING,
      attackerName: Influx.FieldType.STRING,
      attackerTeamID: Influx.FieldType.INTEGER,
      attackerSquadID: Influx.FieldType.INTEGER,
      damage: Influx.FieldType.STRING,
      weapon: Influx.FieldType.STRING,
      teamkill: Influx.FieldType.BOOLEAN,
      reviver: Influx.FieldType.STRING,
      reviverName: Influx.FieldType.STRING,
      reviverTeamID: Influx.FieldType.INTEGER,
      reviverSquadID: Influx.FieldType.INTEGER
    },
    tags: ['server']
  }
];
