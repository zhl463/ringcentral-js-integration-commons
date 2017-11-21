
/**
 * @function
 * @description Decorator function that convert a class method to a getter
 */
export default function selector(prototype, property, { initializer, value, get }) {
  let wrapper;
  return {
    configurable: true,
    enumerable: true,
    get() {
      if (!wrapper) {
        wrapper = {};
        if (initializer) {
          wrapper.target = this::initializer();
        } else {
          wrapper.target = value || get;
        }
        wrapper.fn = typeof wrapper.target === 'function' ?
          () => this::wrapper.target() :
          () => wrapper.target;
      }
      return wrapper.fn();
    }
  };
}
