import Emitter from './Emitter';
import SymbolMap from 'data-types/symbol-map';
import ActionMap from './ActionMap';
import uuid from 'uuid';

/* global chrome */

const TIMEOUT = 90 * 1000;

const events = new ActionMap([
  'push',
  'reponse',
  'request',
]);

const symbols = new SymbolMap([
  'ports',
  'port',
  'deferred',
]);

export class ChromeExtensionServerTransport extends Emitter {
  constructor() {
    super();
    this[symbols.ports] = new Set();
    this[symbols.deferred] = new Map();
    chrome.runtime.onConnect.addListener(port => {
      if (port.name === 'transport') {
        this[symbols.ports].add(port);
        port.onMessage.addListener(({ type, requestId, payload }) => {
          if (type === events.request && requestId && payload) {
            this[symbols.deferred].set(requestId, port);
            this.emit(events.request, {
              requestId,
              payload,
            });
          }
        });

        port.onDisconnect.addListener(() => {
          this[symbols.ports].delete(port);
        });
      }
    });
  }
  get events() {
    return events;
  }
  response({ requestId, result, error }) {
    if (this[symbols.deferred].has(requestId)) {
      const port = this[symbols.deferred].get(requestId);
      this[symbols.deferred].delete(requestId);
      port.postMessage({
        type: events.response,
        requestId,
        result,
        error,
      });
    }
  }
  push({ payload }) {
    this[symbols.ports].forEach(port => {
      port.postMessage({
        type: events.push,
        payload,
      });
    });
  }
}

export class ChromeExtensionClientTransport extends Emitter {
  constructor() {
    super();
    this[symbols.deferred] = new Map();
    this[symbols.port] = chrome.runtime.connect({ name: 'transport' });
    this[symbols.port].onMessage.addListener((msg) => {
      const {
        type,
        payload,
        requestId,
        result,
        error,
      } = msg;
      switch (type) {
        case events.push:
          if (payload) {
            this.emit(events.push, payload);
          }
          break;
        case events.response:
          if (requestId && this[symbols.deferred].has(requestId)) {
            if (error) {
              this[symbols.deferred].get(requestId).reject(error);
            } else {
              this[symbols.deferred].get(requestId).resolve(result);
            }
          }
          break;
        default:
          break;
      }
    });
  }
  async request({ payload }) {
    const requestId = uuid.v4();
    const promise = new Promise((resolve, reject) => {
      this[symbols.port].postMessage({
        type: events.request,
        requestId,
        payload,
      });
      this[symbols.deferred].set(requestId, {
        resolve,
        reject,
      });
    });
    let timeout = setTimeout(() => {
      timeout = null;
      this[symbols.deferred].get(requestId).reject(new Error('Response Timeout'));
    }, TIMEOUT);
    promise.then(result => {
      if (timeout) clearTimeout(timeout);
      this[symbols.deferred].delete(requestId);
      return Promise.resolve(result);
    }).catch(error => {
      if (timeout) clearTimeout(timeout);
      this[symbols.deferred].delete(requestId);
      return Promise.reject(error);
    });
    return promise;
  }
  get events() {
    return events;
  }
}
