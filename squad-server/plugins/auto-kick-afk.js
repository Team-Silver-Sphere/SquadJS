import BasePlugin from './base-plugin.js';

export default class AutoKickAFK extends BasePlugin {
  static get description() {
    return 'The <code>AutoKickAFK</code> plugin will automatically kick players that are not in a squad after a specified ammount of time.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      warning: {
        required: false,
        description:
          'If enabled SquadJS will warn a player once before kicking them. To disable remove the message (`""`)',
        default: 'Players not in a squad are unassigned and will be kicked in 3 minutes'
      },
      updateInterval: {
        required: false,
        description: 'How frequently to check if players are AFK in minutes. If the warning is enabled a player will be kicked after 2x this value otherwise they will be kicked immediately.',
        default: 3
      },
      playerThreshold:{
        required: false,
        description: 'Player count required for Auto Kick to start kicking players to disable set to above max player count',
        default: 93
      },
      queueThreshold:{
        required: false,
        description: 'The number of players in the queue before Auto Kick starts kicking players set to -1 to disable',
        default: -1
      }/*,
      ignoreAdmins:{
        required: false,
        description: 'Whether or not admins will be auto kicked for being unassigned',
        default: false
      }*/
    };
  }

  constructor(server, options) {
    super();

    this.playerDict = {};
    //for initial testing
    this.auditMode = true;

    const intervalMS = options.updateInterval * 60 * 1000;

    setInterval( async ()=>{
      if(server.players.count <= options.playerCountThreshold || (server.publicQueue > options.queueThreshold > 0) ){
        // clear tracking vlaues so if the player count indreases/decreases past any threshold stale players arent counted again if they happen to be unassigned
        this.playerDict = {};
        return;
      }

      // loop through players on server an start tracking players not in a squad
      for (const player of server.players) {
        if(player.squadID === null){ // player not in a squad
          if(player.steamID in this.playerDict){ // player already tracked
            this.playerDict[player.steamID] += 1; // mark player for kick
          }else{
            this.playerDict[player.steamID] = 0; // start tracking player 
          }
        }else if(player.steamID in this.playerDict){
          delete this.playerDict[player.steamID]; // tracked player joined a squad remove them
        }
      }
  
      // debug log
      console.log(this.playerDict);
  
      const copy = Object.assign({}, this.playerDict);
      for(const [steamID, warnings] of Object.entries(copy)){
        if(warnings >= 1 || options.warning === ''){
          if(this.auditMode){
            console.log(`[AUTO AFK] kick ${steamID} for AFK`)
          }else{
            // kick player
            await server.rcon.kick(steamID, 'UNASSIGNED - automatically removed');
            delete this.playerDict[steamID];
          }
        }else{
          if(this.auditMode){
            console.log(`[AUTO AFK] warn player ${steamID} for AFK`);
          }else{
            // warn player
            server.rcon.warn(steamID, options.warning);
          }
          
        }
      }
    } , intervalMS );


    //clean up every 20 minutes, removes players no longer on the server that may be stuck in the tracking dict
    const cleanupMS = 20*60*1000;
    setInterval( ()=> {
      for(steamID of Object.keys(this.playerDict))
        if(!steamID in server.players.map(p => p.steamID))
          delete this.playerDict[steamID];
    }, cleanupMS);

  }
}
