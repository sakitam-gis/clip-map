import * as path from 'path';
import fs from 'fs-extra';

let DOMAIN;

/**
 * resolve path
 * @param _path
 */
const resolve = (_path: string) => path.resolve(__dirname, '..', _path);

/**
 * 可写流转换为可读流
 * @param name
 * @param dataBuffer
 * @returns {Promise<any>}
 */
function getFileBuffer(name: string, dataBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // const read = fs.createReadStream(pdfPath);

    fs.writeFile(name, dataBuffer, function(err) {
      if (err) {
        reject(err);
      } else {
        const stream = fs.createReadStream(name);
        const responseData: any[] = [];
        if (stream) {
          stream.on('data', function(chunk) {
            responseData.push(chunk);
          });
          stream.on('end', function() {
            const finalData = Buffer.concat(responseData);
            resolve(finalData);
          });
        }
      }
    });
  });
}

function buildParams(params: any) : string {
  let str = '?';
  Object.keys(params).forEach(key => {
    const items = params[key];
    if (Array.isArray(items)) {
      // items.reduce((pre, next) => {
      //   return pre + `${key}=${next}`;
      // }, str);
      items.forEach(v => {
        if (str === '?') {
          str += `${key}=${v}`;
        } else {
          str += `&${key}=${v}`;
        }
      });
    } else {
      if (str === '?') {
        str += `${key}=${items}`;
      } else {
        str += `&${key}=${items}`;
      }
    }
  });
  return str;
}

function getDomain(that: any) {
  const { ctx } = that;
  if (!DOMAIN) {
    const host = ctx.host;
    const protocol = ctx.protocol;
    DOMAIN = `${protocol}://${host}`;
  }
  return DOMAIN;
}

export {
  resolve,
  getDomain,
  buildParams,
  getFileBuffer,
};
