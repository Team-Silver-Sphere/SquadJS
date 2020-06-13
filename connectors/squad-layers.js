import fs from 'fs';

import didYouMean from 'didyoumean';

class SquadLayers {
  constructor(layers) {
    if (Array.isArray(layers)) {
      this.layers = layers;
    } else {
      this.layers = JSON.parse(fs.readFileSync('./connectors/data/layers.json', 'utf8'));
    }

    for (let i = 0; i < this.layers.length; i++) {
      this.layers[i] = {
        ...this.layers[i],
        layerNumber: i + 1
      };
    }
  }

  getLayers() {
    return this.layers;
  }

  getLayerNames() {
    return this.layers.map(layer => layer.layer);
  }

  getLayerByLayerName(layerName) {
    const layer = this.layers.filter(layer => layer.layer === layerName);
    return layer.length === 1 ? layer[0] : null;
  }

  getLayerByLayerClassname(layerClassname) {
    const layer = this.layers.filter(layer => layer.layerClassname === layerClassname);
    return layer.length === 1 ? layer[0] : null;
  }

  getLayerByDidYouMean(layerName) {
    layerName = didYouMean(layerName, this.getLayerNames());

    const layer = this.layers.filter(layer => layer.layer === layerName);
    return layer.length === 1 ? layer[0] : null;
  }

  getLayerByNumber(number) {
    const layer = this.layers.filter(layer => layer.layerNumber === number);
    return layer.length === 1 ? layer[0] : null;
  }
}

export { SquadLayers };
export default new SquadLayers();
