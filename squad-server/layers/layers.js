import axios from 'axios';

import Logger from 'core/logger';

import Layer from './layer.js';

class Layers {
  constructor() {
    this.layers = [];

    this.pulled = false;
  }

  async pull(force = false) {
    if (this.pulled && !force) {
      Logger.verbose('Layers', 2, 'Already pulled layers.');
      return;
    }
    if (force) Logger.verbose('Layers', 1, 'Forcing update to layer information...');

    this.layers = [];

    Logger.verbose('Layers', 1, 'Pulling layers...');
    const response = await axios.get(
      'https://raw.githubusercontent.com/fantinodavide/SquadLayerList/main/layers.json'
    );

    for (const layer of response.data.Maps) {
      this.layers.push(new Layer(layer));
    }
    this.units = response.data.Units;

    Logger.verbose('Layers', 1, `Pulled ${this.layers.length} layers and ${Object.keys(this.units).length} units.`);

    this.pulled = true;

    return this.layers;
  }

  async getLayerByCondition(condition) {
    await this.pull();

    const matches = this.layers.filter(condition);
    if (matches.length === 1) return matches[0];

    return null;
  }

  convertFactionToUnit(layer, factionName, teamIndex) {
    // From factionName, in format "ADF+Mechanized", return the correct
    // "ADF_XX_Mechanized" for current layer.
    const factionParts = factionName.split("+");
    const matches = layer.factions.filter((f) =>
      f.factionId === factionParts[0] &&
        f.availableOnTeams.includes(teamIndex + 1)
    );
    if (matches.length === 1) {
      const faction = matches[0];
      if (factionParts.length === 1) {
        return faction.defaultUnit;
      }
      else {
        const unitParts = faction.defaultUnit.split('_', 2);
        if (faction.types.includes(factionParts[1]))
          return `${unitParts[0]}_${unitParts[1]}_${factionParts[1]}`;
        else
          return faction.defaultUnit;
      }
    }
  }

  async getLayerById(layerId, factionOne, factionTwo) {
    const layer = await this.getLayerByCondition((layer) => layer.layerid === layerId);
    if (layer) {
      const factions = [factionOne, factionTwo];
      let teams = [];
      for (const teamIdx of [0, 1]) {
        const faction = factions[teamIdx];
        const unitName = this.convertFactionToUnit(layer, faction, teamIdx);
        const unit = this.units[unitName];
        teams[teamIdx] = {
          faction: unit.factionID,
          name: unit.displayName,
          unitID: unitName,
          unit: unit,
          tickets: layer.tickets[teamIdx],
          commander: layer.commander,
          vehicles: unit.vehicles,
        };
      }
      return [layer, teams]
    }
  }
}

export default new Layers();
