import axios from 'axios';

import Layer from './layer.js';

class Layers {
  constructor() {
    this.layers = [];

    this.pulled = false;
  }

  async pull(force = false) {
    if (this.pulled && !force) return;

    const response = await axios.get(
      'https://raw.githubusercontent.com/Squad-Wiki-Editorial/squad-wiki-pipeline-map-data/dev/completed_output/2.0/finished_2.0.json'
    );

    for (const layer of response.data.Maps) {
      this.layers.push(new Layer(layer));
    }

    return this.layers;
  }

  async getLayerByCondition(condition) {
    await this.pull();

    const matches = this.layers.filter(condition);
    if (matches.length === 1) return matches[0];

    return null;
  }

  getLayerByName(name) {
    return this.getLayerByCondition((layer) => layer.name === name);
  }

  getLayerByClassname(classname) {
    return this.getLayerByCondition((layer) => layer.classname === classname);
  }
}

export default new Layers();
