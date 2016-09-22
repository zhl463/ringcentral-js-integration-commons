import Subscribable from './subscribable';
import SymbolMap from 'data-types/symbol-map';
import uuid from 'uuid';

const symbols = new SymbolMap([
  'key',
  'localStorage',
  'handler',
  'id',
]);

class MemoryStorage {
  getItem() {
    return this.data;
  }
  setItem(key, data) {
    this.data = data;
  }
}

export default class NamedStorage extends Subscribable {
  constructor({
    key,
  }) {
    super();
    if (!key) {
      throw Error('NameLocalStorage must be created with a key');
    }
    this[symbols.key] = key;
    this[symbols.id] = uuid.v4();
    if (typeof localStorage !== 'undefined' && typeof window !== 'undefined') {
      this[symbols.handler] = event => {
        if (event.key === this[symbols.key]) {
          try {
            const {
              setter,
            } = JSON.parse(event.newValue);
            if (setter && setter !== this.id) {
              this.trigger();
            }
          } catch (e) {
            /* ignore error */
          }
        }
      };
      this[symbols.localStorage] = localStorage;
      window.addEventListener('storage', this[symbols.handler]);
    } else {
      this[symbols.localStorage] = new MemoryStorage();
    }
  }
  getData() {
    try {
      const {
        data,
      } = JSON.parse(this[symbols.localStorage].getItem(this[symbols.key]));
      return data;
    } catch (e) {
      /* ignore error */
      return undefined;
    }
  }
  setData(data) {
    this[symbols.localStorage].setItem(
      this[symbols.key],
      JSON.stringify({
        setter: this.id,
        data,
      }),
    );
  }
  destroy() {
    if (this[symbols.handler]) {
      window.removeEventListener('storage', this[symbols.handler]);
    }
  }
  get id() {
    return this[symbols.id];
  }
}
