export default function proxify(prototype, property, descriptor) {
  const {
    configurable,
    enumerable,
    value,
  } = descriptor;

  function proxyFn(...args) {
    const functionPath = `${this.modulePath}.${property}`;
    return this._transport.request({
      payload: {
        type: this._proxyActionTypes.execute,
        functionPath,
        args,
      },
    });
  }
  return {
    configurable,
    enumerable,
    get() {
      if (!this._transport) {
        return value;
      }
      return proxyFn;
    },
  };
}
