/* global document */

import {EventEmitter} from 'events';
import ol from 'openlayers';
import AppDispatcher from '../dispatchers/AppDispatcher.js';
import MapConstants from '../constants/MapConstants.js';

let config = {
  layers: []
};

class LayerStore extends EventEmitter {
  bindMap(map) {
    if (map !== this._map) {
      this._map = map;
      config.layers = this._map.getLayers().getArray();
      this.emitChange();
      this._map.getLayers().on('add', this.emitChange, this);
      this._map.getLayers().on('remove', this.emitChange, this);
    }
  }
  _forEachLayer(layer, layers, id) {
    if (layer.get('id') === id) {
      layers.push(layer);
    } else {
      if (layer instanceof ol.layer.Group) {
        layer.getLayers().forEach(function(groupLayer) {
          this._forEachLayer(groupLayer, layers, id);
        }, this);
      }
    }
  }
  findLayer(id) {
    var layers = [];
    this._forEachLayer(this._map.getLayerGroup(), layers, id);
    if (layers.length === 1) {
      return layers[0];
    } else {
      return undefined;
    }
  }
  getMap() {
    return this._map;
  }
  getState() {
    return config;
  }
  emitChange() {
    this.emit('CHANGE');
  }
  addChangeListener(cb) {
    this.on('CHANGE', cb);
  }
  removeChangeListener(cb) {
    this.removeListener('CHANGE', cb);
  }
}

let _LayerStore = new LayerStore();

export default _LayerStore;

AppDispatcher.register((payload) => {
  let action = payload.action;
  let layers, index;
  switch(action.type) {
    case MapConstants.REMOVE_LAYER:
      layers = _LayerStore.getMap().getLayers();
      layers.remove(action.layer);
      break;
    case MapConstants.MOVE_LAYER_UP:
      layers = _LayerStore.getMap().getLayers();
      index = layers.getArray().indexOf(action.layer);
      if (index < layers.getLength() - 1) {
        var next = layers.item(index + 1);
        layers.removeAt(index);
        layers.setAt(index + 1, action.layer);
        layers.setAt(index, next);
      }
      break;
    case MapConstants.MOVE_LAYER_DOWN:
      layers = _LayerStore.getMap().getLayers();
      index = layers.getArray().indexOf(action.layer);
      if (index > 1) {
        var prev = layers.item(index - 1);
        layers.removeAt(index);
        layers.setAt(index - 1, action.layer);
        layers.setAt(index, prev);
      }
      break;
    case MapConstants.ZOOM_TO_LAYER:
      _LayerStore.getMap().getView().fit(
        action.layer.getSource().getExtent(),
        _LayerStore.getMap().getSize()
      );
      break;
    default:
      break;
  }
});
