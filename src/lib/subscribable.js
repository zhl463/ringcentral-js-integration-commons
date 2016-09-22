import SymbolMap from 'data-types/symbol-map';

const symbols = new SymbolMap([
  'handlers',
]);

export default class Subscribable {
  constructor() {
    this[symbols.handlers] = new Set();
  }
  subscribe(handler) {
    this[symbols.handlers].add(handler);
    return () => {
      this.unsubscribe(handler);
    };
  }
  unsubscribe(handler) {
    this[symbols.handlers].delete(handler);
  }
  trigger(...args) {
    [...this[symbols.handlers]].forEach(handler => {
      try {
        handler(...args);
      } catch (e) {
        /* ignore error */
      }
    });
  }
}
