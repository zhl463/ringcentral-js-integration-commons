import RcModule from '../../lib/RcModule';

export default class Brand extends RcModule {
  constructor({ id, name, ...options }) {
    super(options);
    this._reducer = (state = {
      id,
      name,
    }) => state;
  }
  get id() {
    return this.state.id;
  }
  get name() {
    return this.state.name;
  }
}
