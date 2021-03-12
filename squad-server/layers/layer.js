export default class Layer {
  constructor(data) {
    this.name = data.Name;
    this.classname = data.levelName;
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
    this.tanks = [];
    this.helicopters = [];
    for (const t of ['team1', 'team2']) {
      this.teams.push({
        faction: data[t].faction,
        name: data[t].teamSetupName,
        tickets: data[t].tickets,
        commander: data[t].commander,
        vehicles: (data[t].vehicles || []).map((vehicle) => ({
          name: vehicle.type,
          classname: vehicle.rawType,
          count: vehicle.count,
          spawnDelay: vehicle.delay,
          respawnDelay: vehicle.respawnTime
        }))
      });
      this.tanks.push(
        data[t].vehicles.filter((v) => {
          return v.icon.match(/tank/);
        }).length
      );
      this.helicopters.push(
        data[t].vehicles.filter((v) => {
          return v.icon.match(/helo/);
        }).length
      );
    }
  }
}
