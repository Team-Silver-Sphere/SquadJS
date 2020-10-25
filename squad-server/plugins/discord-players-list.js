import DiscordIntervalUpdatedMessage from "./discord-interval-updated-message.js";
import { COPYRIGHT_MESSAGE } from '../utils/constants.js';

export default class DiscordPlayersList extends DiscordIntervalUpdatedMessage {

    TEAM_ONE_ID = '1';

    static get description() {
        return '<code>DiscordPlayerList</code> is a discord plugin displaying players currentley in each team. Two columns, each named by theyr fraction shorctcut.\
        Side accent color can be modified.'
    }

    static get defaultEnabled() {
        return false;
    }
    
    static get optionsSpecification() {
        return {
          ...super.optionsSpecification,
          embedColor: {
            description: "Color to use on small stuff to make things look cool",
            default: '#FFFFFF'
          }
        }
      }
  
    constructor(server, options) {
        super(server, options)

        this.embedColor = options.embedColor;
    }

    buildPlayerListByTeam(playerArrayMixed) {
        let playerByTeam = { teamOne: '', teamTwo: '', teamOneCount: 0, teamTwoCount: 0 };

        playerArrayMixed.forEach(player => {
            if (player.teamID === this.TEAM_ONE_ID) {
                playerByTeam.teamOne += player.name + '\n';
                playerByTeam.teamOneCount++;
            } else {
                playerByTeam.teamTwo += player.name + '\n';
                playerByTeam.teamTwoCount++;
            }
        });

        if (playerByTeam.teamOneCount === 0) playerByTeam.teamOne = 'Empty';
        if (playerByTeam.teamTwoCount === 0) playerByTeam.teamTwo = 'Empty';

        return playerByTeam;
    }

    buildMessage(server) {
        const playerListByTeam = this.buildPlayerListByTeam(server.players);

        return {
            embed: {
                color: this.embedColor,
                timestamp: new Date().toISOString(),
                fields: [
                    { name: `${server.layerHistory[0].teamOne.faction}  (${playerListByTeam.teamOneCount} players)`, value: `\`\`\`${playerListByTeam.teamOne}\`\`\``, inline: true },
                    { name: `${server.layerHistory[0].teamTwo.faction}  (${playerListByTeam.teamTwoCount} players)`, value: `\`\`\`${playerListByTeam.teamTwo}\`\`\``, inline: true }
                ],
                footer: { text: COPYRIGHT_MESSAGE }
            }
        };
    }
}