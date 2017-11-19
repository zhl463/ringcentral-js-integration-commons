export function getDataReducer(types) {
  return (state = null, { type, data }) => {
    switch (type) {
      case types.fetchSuccess:
        return data;
      case types.resetSuccess:
        return null;
      default:
        return state;
    }
  };
}
