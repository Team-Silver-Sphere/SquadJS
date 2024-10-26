export default class Layer {
  constructor(data) {
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
      classname: data.lightingLevel
    };
    this.teams = [];
    for (const t of ['team1', 'team2']) {
      let team = data[t] || data.teamConfigs[t];
      this.teams.push({
        faction: team.faction,
        name: team.teamSetupName,
        tickets: team.tickets,
        commander: team.commander,
        vehicles: (team.vehicles || []).map((vehicle) => ({
          name: vehicle.type,
          classname: vehicle.rawType,
          count: vehicle.count,
          spawnDelay: vehicle.delay,
          respawnDelay: vehicle.respawnTime
        })),
        numberOfTanks: (team.vehicles || []).filter((v) => {
          return v.icon.match(/_tank/);
        }).length,
        numberOfHelicopters: (team.vehicles || []).filter((v) => {
          return v.icon.match(/helo/);
        }).length
      });
    }
  }
}
