import uuid from 'uuid';
import TransportBase from '../TransportBase';

/* global chrome */

export default class ServerTransport extends TransportBase {
  constructor(options) {
    super({
      ...options,
      name: 'ChromeTransport',
    });
    this._ports = new Set();
    this._requests = new Map();
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'transport') {
        this._ports.add(port);
        port.onMessage.addListener(({ type, requestId, payload }) => {
          if (type === this._events.request && requestId && payload) {
            this._requests.set(requestId, port);
            this.emit(this._events.request, {
              requestId,
              payload,
            });
          }
        });
        port.onDisconnect.addListener(() => {
          this._ports.delete(port);
        });
      }
    });
  }
  response({ requestId, result, error }) {
    const port = this._requests.get(requestId);
    if (port) {
      this._requests.delete(requestId);
      port.postMessage({
        type: this._events.response,
        requestId,
        result,
        error,
      });
    }
  }
  push({ payload }) {
    this._ports.forEach((port) => {
      port.postMessage({
        type: this._events.push,
        payload,
      });
    });
  }
}
