import ApiResponse from 'ringcentral/src/http/ApiResponse';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function batchPutApi({ platform, url, query, body }) {
  const boundry = `Boundary_${uuid()}`;
  const options = { headers: {} };
  options.headers[ApiResponse._contentType]
    = `${ApiResponse._multipartContentType}; boundary=${boundry}`;
  body = body.reduce((data, item) => {
    data += `--${boundry}\r\n`;
    data += `${ApiResponse._contentType}: ${ApiResponse._jsonContentType}\r\n\r\n`;
    data += `${JSON.stringify(item.body)}\r\n`;
    return data;
  }, '');
  body += `--${boundry}--`;
  const result = await platform.put(url, body, query, options);
  return result.multipart();
}

export async function batchGetApi({ platform, url, query }) {
  const boundry = `Boundary_${uuid()}`;
  const options = { headers: {} };
  options.headers[ApiResponse._contentType]
    = `${ApiResponse._multipartContentType}; boundary=${boundry}`;
  const result = await platform.get(url, query, options);
  return result.multipart();
}
