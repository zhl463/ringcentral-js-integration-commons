import moduleStatus from '../../enums/moduleStatus';

export default function getModuleStatusReducer(types) {
  return (state = moduleStatus.pending, { type }) => {
    switch (type) {

      case types.init:
        return moduleStatus.initializing;

      case types.initSuccess:
        return moduleStatus.ready;

      case types.reset:
        return moduleStatus.resetting;

      case types.resetSuccess:
        return moduleStatus.pending;

      default:
        return state;
    }
  };
}
