import RcModule from '../../lib/RcModule';

export default class Brand extends RcModule {
  constructor({ id, name, fullName, ...options }) {
    super(options);
    this._reducer = (state = {
      id,
      name,
      fullName,
    }) => state;
  }
  get id() {
    return this.state.id;
  }
  get name() {
    return this.state.name;
  }
  get fullName() {
    return this.state.fullName;
  }
}
