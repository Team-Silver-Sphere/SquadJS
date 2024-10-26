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
        faction: team.defaultFactionUnit, 
        name: team.defaultFactionUnit, // There is no other name presented in the data so in order to keep the same structure to support the old formatted codes, used the same name
        tickets: team.tickets,
        allowedFactionsUnitTypes: team.allowedFactionsUnitTypes,
        allowedAlliances: team.allowedAlliances,
      });
    }
  }
}
