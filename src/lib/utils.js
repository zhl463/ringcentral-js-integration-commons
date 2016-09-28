export function extractData(model) {
  if (Array.isArray(model)) {
    return model.map(item => extractData(item));
  } else if (typeof model === 'object') {
    const data = {};
    for (const key in model) {
      if (key[0] !== '_' && model.hasOwnProperty(key)) {
        data[key] = extractData(model[key]);
      }
    }
    return data;
  }
  return model;
}

export async function fetchList(fn, params = {}) {
  let fetchedPages = 0;
  let totalPages = 1;
  let list = [];
  while (fetchedPages < totalPages) {
    fetchedPages++;
    const data = await fn({
      ...params,
      page: fetchedPages,
    });
    totalPages = data.paging.totalPages;
    list = list.concat(data.records);
  }
  return list;
}

/**
 * @function
 * @param {Number} t
 */
export async function sleep(t) {
  return new Promise(resolve => {
    setTimeout(resolve, t);
  });
}
