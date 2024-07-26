//Plugin by PSG - Ignis
import BasePlugin from './base-plugin.js';

export default class KnifeKills extends BasePlugin {
  static get description() {
    return 'The <code>KnifeKills</code> plugin Broadcasts when a player gets a knife kill.';
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      messages: {
        required: false,
        description: 'Array of messages to choose from for the broadcast text.',
        default: [
          'Knife Kill\n${attackerName} got a Knife Kill!',
          'Knife Kill\n${attackerName} slashed their way to victory!',
          'Knife Kill\n${attackerName} delivered a deadly blow!',
          'Knife Kill\n${attackerName} demonstrated their knife skills!',
          'Knife Kill\n${attackerName} claimed a silent victim!',
          "Knife Kill\n${attackerName} showed ${victimName} why you shouldn't run with scissors!",
          "Knife Kill\n${attackerName} showed ${victimName} their knife collection!",
          "Knife Kill\n${attackerName} caught ${victimName} with their pants down!",
          "Knife Kill\n${attackerName} was trying to reach ${victimName} about their car's extended warranty."
        ]
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onWound = this.onWound.bind(this);
  }

  async mount() {
    this.server.on('PLAYER_WOUNDED', this.onWound);
  }

  async unmount() {
    this.server.removeEventListener('PLAYER_WOUNDED', this.onWound);
  }

  async onWound(info) {
    if (!info.attacker) return;

    if (info.teamkill === true) return;

    const knives = [
      'BP_AK74Bayonet',
      'BP_AKMBayonet',
      'BP_Bayonet2000',
      'BP_G3Bayonet',
      'BP_M9Bayonet',
      'BP_OKC-3S',
      'BP_QNL-95_Bayonet',
      'BP_SA80Bayonet',
      'BP_SKS_Bayonet',
      'BP_SKS_Optic_Bayonet',
      'BP_SOCP_Knife_AUS'
    ];

    if (knives.includes(info.weapon)) {
      const messages = this.options.messages;
      const message = messages[Math.floor(Math.random() * messages.length)];
      const broadcastText = this.replaceVariables(message, { attackerName: info.attacker.name, victimName: info.victim.name });
      this.server.rcon.broadcast(broadcastText);
    }
  }

  replaceVariables(message, variables) {
    for (const [variableName, variableValue] of Object.entries(variables)) {
      const placeholder = '${' + variableName + '}';
      message = message.replace(placeholder, variableValue);
    }
    return message;
  }
}