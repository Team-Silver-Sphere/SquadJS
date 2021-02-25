export default class Layer {
  constructor(data) {
    this.name = data.Name;
    this.classname = data.rawName;
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
    this.teams = [
      {
        faction: data.team1.faction,
        name: data.team1.teamSetupName,
        tickets: data.team1.tickets,
        commander: data.team1.commander,
        vehicles: (data.team1.vehicles || []).map((vehicle) => ({
          name: vehicle.type,
          classname: vehicle.rawType,
          count: vehicle.count,
          spawnDelay: vehicle.delay,
          respawnDelay: vehicle.respawnTime
        }))
      },
      {
        faction: data.team2.faction,
        name: data.team2.teamSetupName,
        tickets: data.team2.tickets,
        commander: data.team2.commander,
        vehicles: (data.team2.vehicles || []).map((vehicle) => ({
          name: vehicle.type,
          classname: vehicle.rawType,
          count: vehicle.count,
          spawnDelay: vehicle.delay,
          respawnDelay: vehicle.respawnTime
        }))
      }
    ];
  }
}
