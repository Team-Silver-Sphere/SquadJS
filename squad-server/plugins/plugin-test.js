import BasePlugin from './base-plugin.js';
import FactionSides from './lookup/factions-lookup.js';


export default class PluginTest extends BasePlugin {
  static get description() {
    return (
      "The <code>TestConfig</code> can be used to autoenable (or disable) all commands normally used in squad testing, <code>!testconfig {1/0}</code> into in-game chat"
    );
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      paramFirst: {
        required: false,
        description: 'The command used for test config.',
        default: true
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);
    this.pluginTest = this.pluginTest.bind(this);
	//this.pluginTestTwo = this.pluginTestTwo.bind(this);
  }

  async mount() {
    this.server.on('VEHICLE_DAMAGED', this.pluginTest);
	//this.server.on('PLAYER_SOLDIER_POSSESS', this.pluginTestTwo);
  }

  async unmount() {
    this.server.removeEventListener('VEHICLE_DAMAGED', this.pluginTest);
	//this.server.removeEventListener('PLAYER_SOLDIER_POSSESS', this.pluginTestTwo);
  }
  
   async pluginTest(info) {
		if (!info.healthRemaining 
		//|| info.healthRemaining >= 0.0
		) return;
		const player = this.server.players[this.server.players.findIndex(entry => entry.eosID === info.attackerEOSID)];
		const vehicleTeamsCheck = info.vehicleTeams;
		const isTeamkill = (() => {
			  if (!(player && player.teamName && vehicleTeamsCheck?.length)) return null;
			  const playerSide = FactionSides[player.teamName];
			  if (!playerSide || !vehicleTeamsCheck) return null;
			  const vehicleSide = [];
			  if (!typeof vehicleTeamsCheck[Symbol.iterator] === 'function') return null;
			  for (const vehTeam of vehicleTeamsCheck) {
				const vehSide = FactionSides[vehTeam];
				if (vehSide && !vehicleSide.includes(vehSide)) vehicleSide.push(vehSide);
			  }
			  if (vehicleSide.includes(playerSide)) isTeamkill = 1.0 / vehicleSide.length > 0.5; // teamkill confidence
			  else isTeamkill = false; // not in team list
		})();
		const parsedData = {
			vehicleName: info.vehicle ? info.vehicle : null,
			vehicleTeams: Array.isArray(vehicleTeamsCheck) && vehicleTeamsCheck.length > 0 ? JSON.stringify(vehicleTeamsCheck) : null,
			attacker: player ? player.steamID : null,
			attackerName: player ? player.name : null,
			attackerTeams: player ? player.teamID : null,
			healthRemaining: info.healthRemaining ? info.healthRemaining : null,
			teamkill: isTeamkill
		}
	   await this.server.rcon.broadcast('Vehicle Damaged. '.concat('Name:', parsedData.vehicleName, ', HP:', parsedData.healthRemaining, ', TK:', parsedData.teamkill, ', AttTeam:', parsedData.attackerTeams, ', VehTeams:', parsedData.vehicleTeams));
   }
  
  async pluginTestTwo(info) {
	  //await this.server.rcon.broadcast('PLAYER_SOLDIER_POSSESS: '.concat(SoldierLookup[info.playerRawTeam]));//.concat(info.playerName, ', ', info.playerSoldier));
	  //for (const key of this.server.players.keys()) {this.server.rcon.broadcast(key);}
	  //let index = this.server.players.findIndex(entry => entry.eosID === info.player.eosID);
	  //this.server.players[index]["teamName"] = SoldierLookup[info.playerRawTeam];
	  //await this.server.rcon.broadcast('playerpossesssoldier '.concat(info.player.teamName));
  }

}