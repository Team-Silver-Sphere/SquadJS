import BasePlugin from './base-plugin.js';
import SoldierLookup from './lookup/soldier-lookup.js';
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
	this.pluginTestTwo = this.pluginTestTwo.bind(this);
  }

  async mount() {
    this.server.on('VEHICLE_DAMAGED', this.pluginTest);
	this.server.on('PLAYER_SOLDIER_POSSESS', this.pluginTestTwo);
  }

  async unmount() {
    this.server.removeEventListener('VEHICLE_DAMAGED', this.pluginTest);
	this.server.removeEventListener('PLAYER_SOLDIER_POSSESS', this.pluginTestTwo);
  }
  
   async pluginTest(info) {
	   let vehicleFactions = '|';
	   let isTeamkill = null;
	const vehicleTeamsCheck = info.vehicleTeams;
	const player = this.server.players[this.server.players.findIndex(entry => entry.eosID === info.attackerEOSID)];
	if (!(player && player.teamName && vehicleTeamsCheck?.length)) isTeamkill = null;
	const playerSide = FactionSides[player.teamName];
	if (!playerSide) isTeamkill = null;
	const vehicleSide = [];
	for (const vehTeam of vehicleTeamsCheck) {
		const vehSide = FactionSides[vehTeam];
		if (vehSide && !vehicleSide.includes(vehSide)) vehicleSide.push(vehSide);
	}
	if (vehicleSide.includes(playerSide)) isTeamkill = 1.0 / vehicleSide.length > 0.5; // teamkill confidence
	else isTeamkill = false; // not in team list
	   if (info.vehicleTeams) {
		   for (const faction of info.vehicleTeams) {
			   vehicleFactions = vehicleFactions.concat(faction, '|');
			   }
		   }
	   await this.server.rcon.broadcast('INFO: healthRemaining:'.concat(info.healthRemaining, ', target:', info.vehicle, ', attacker:', info.attackerName, 
	   ', attackerTeam:', player.teamName, 
	   ', vehicleTeams:', vehicleFactions, ', teamkill:', isTeamkill));
   }
  
  async pluginTestTwo(info) {
	  //await this.server.rcon.broadcast('PLAYER_SOLDIER_POSSESS: '.concat(SoldierLookup[info.playerRawTeam]));//.concat(info.playerName, ', ', info.playerSoldier));
	  //for (const key of this.server.players.keys()) {this.server.rcon.broadcast(key);}
	  //let index = this.server.players.findIndex(entry => entry.eosID === info.player.eosID);
	  //this.server.players[index]["teamName"] = SoldierLookup[info.playerRawTeam];
	  await this.server.rcon.broadcast('playerpossesssoldier '.concat(info.player.teamName));
  }

}