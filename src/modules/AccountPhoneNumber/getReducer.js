import removeUri from '../../lib/removeUri';

export function getDataReducer(types) {
  return (state = null, { type, data }) => {
    switch (type) {
      case types.fetchSuccess:
        return data && data.map(item => ({
          ...item,
          extension: removeUri(item.extension),
        }));
      case types.resetSuccess:
        return null;
      default:
        return state;
    }
  };
}
