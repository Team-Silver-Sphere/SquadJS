import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordFOBHABExplosionDamage extends DiscordBasePlugin {
  static get description() {
    return 'Logs all damage taken or attempted against FOBs/HABs and sends raw line to Discord.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'Discord channel ID to send messages to.',
        default: ''
      },
      color: {
        required: false,
        description: 'Embed color.',
        default: 15844367
      }
    };
  }

  async mount() {
    this._onDeployableDamaged = this.onDeployableDamaged.bind(this);
    this.server.on('DEPLOYABLE_DAMAGED', this._onDeployableDamaged);
    console.log('✅ DiscordFOBHABExplosionDamage plugin mounted.');
  }

  async unmount() {
    if (this._onDeployableDamaged) {
      this.server.removeEventListener('DEPLOYABLE_DAMAGED', this._onDeployableDamaged);
      console.log('🛑 DiscordFOBHABExplosionDamage plugin unmounted.');
    }
  }

  async onDeployableDamaged(info) {
    const { raw, deployable } = info;

    if (!/(FOB|Hab|FobRadio|Radio)/i.test(deployable)) {
      console.log('[DEBUG] Ignored non-FOB/HAB damage line.');
      return;
    }

    console.log('[DEBUG] ✅ Sending FOB/HAB damage log to Discord.');
    console.log(raw);

    const embed = {
      title: '💥 FOB/HAB Damage Log',
      description: `\u0060\u0060\u0060\n${raw}\n\u0060\u0060\u0060`,
      color: this.options.color,
      timestamp: new Date().toISOString()
    };

    try {
      await this.sendDiscordMessage({ embed });
    } catch (err) {
      console.error('[ERROR] Failed to send message to Discord:', err);
    }
  }
}
