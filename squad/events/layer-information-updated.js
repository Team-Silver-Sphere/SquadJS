import Event from '../../core/event.js';

export default class LayerInformationUpdated extends Event {
  constructor(server, data = {}) {
    super(server, data);

    this.currentLevel = data.currentLevel;
    this.currentLayer = data.currentLayer;
    this.nextLevel = data.nextLevel;
    this.nextLayer = data.nextLayer;

    this.oldValues = data.oldValues;
    this.newValues = data.newValues;
  }
}
