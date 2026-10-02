// Accepts a layer in the SquadLayerList layers.json format (with the Units object of the same file)
// or in the older Squad Wiki finished.json format. Both give the same fields.
export default class Layer {
  constructor(data, units = {}) {
    this.name = data.Name;
    this.classname = data.levelName;
    this.layerid = data.rawName;
    this.map = {
      name: data.mapName
    };
    this.gamemode = data.gamemode;
    this.gamemodeType = data.type;
    this.version = data.layerVersion;
    this.size = data.mapSize;
    this.sizeType = data.mapSizeType;
    this.numberOfCapturePoints = parseInt(data.capturePoints);
    this.lighting = {
      name: data.lighting,
      classname: data.lightingLevel,
      type: data.persistentLightingType
    };
    this.commander = data.commander;
    this.factions = data.factions || [];

    this.teams = [];
    for (const teamKey of ['team1', 'team2']) {
      this.teams.push(
        data.teamConfigs
          ? teamFromUnit(data, data.teamConfigs[teamKey], units)
          : teamFromOldFormat(data[teamKey])
      );
    }
    this.tickets = this.teams.map((team) => team.tickets);
  }
}

// layers.json: the team uses the default unit of its team config. Layers without team data (for
// example the Automation layers) still get a team, with null values and no vehicles.
function teamFromUnit(data, teamConfig = {}, units) {
  const unit = units[teamConfig.defaultFactionUnit] || {};
  const vehicles = unit.vehicles || [];
  return {
    faction: unit.factionName ?? null,
    name: unit.displayName ?? null,
    tickets: teamConfig.tickets ?? null,
    commander: data.commander ?? null,
    vehicles: vehicles.map((vehicle) => ({
      name: vehicle.type,
      classname: vehicle.classNames?.[0],
      count: vehicle.count,
      spawnDelay: vehicle.delay,
      respawnDelay: vehicle.respawnTime
    })),
    ...countVehicles(vehicles)
  };
}

function teamFromOldFormat(team = {}) {
  const vehicles = team.vehicles || [];
  return {
    faction: team.faction,
    name: team.teamSetupName,
    tickets: team.tickets,
    commander: team.commander,
    vehicles: vehicles.map((vehicle) => ({
      name: vehicle.type,
      classname: vehicle.rawType,
      count: vehicle.count,
      spawnDelay: vehicle.delay,
      respawnDelay: vehicle.respawnTime
    })),
    ...countVehicles(vehicles)
  };
}

function countVehicles(vehicles) {
  return {
    numberOfTanks: vehicles.filter((vehicle) => /_tank/.test(vehicle.icon)).length,
    numberOfHelicopters: vehicles.filter((vehicle) => /helo|helicopter/.test(vehicle.icon)).length
  };
}
