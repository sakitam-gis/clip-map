import { set, get } from 'lodash';
// require('@mapbox/flow-remove-types/register');
import { UrlWithStringQuery, parse, format } from 'url';
import axios from 'axios';
import * as sharp from 'sharp';
import * as mbgl from '@mapbox/mapbox-gl-native';
import * as Sphericalmercator from '@mapbox/sphericalmercator';
// import * as sendToWormhole from 'stream-wormhole';
import { Controller } from 'egg';
import { getExtent } from '../utils/geom';
import {
  resolve as utilResolve,
  getDomain
} from '../utils/common';

const token = 'pk.eyJ1Ijoic21pbGVmZGQiLCJhIjoiY2owbDBkb2RwMDJyMTMycWRoeDE4d21sZSJ9.dWlPeAWsgnhUKdv1dCLTnw';
const isMapboxURL = url => url.startsWith('mapbox://');
// const isMapboxStyleURL = url => url.startsWith('mapbox://styles/');

/**
 * 计算真实视图宽高
 * @param zoom
 * @param extent
 */
// @ts-ignore
function mathRealWH (zoom: number, extent: any) {
  const mercator = new Sphericalmercator();

  const max = [extent[0], extent[1]];
  const min = [extent[2], extent[3]];
  const pixelMin = mercator.px(min, zoom);
  const pixelMax = mercator.px(max, zoom);
  const width = Math.abs(pixelMax[0] - pixelMin[0]);
  const height = Math.abs(pixelMax[1] - pixelMin[1]);
  return {
    width: width + 50,
    height: height + 50,
  }
}

const getRequest = (url: string | UrlWithStringQuery, callback: (...args: any[]) => any) => {
  if (typeof url === 'string') {
    axios.get(url)
      .then((res: any) => res.data)
      .then((res: any) => {
        callback(null, {res})
      })
      .catch((error) => {
        callback(error)
      });
  }
};

const normalizeMapboxSourceURL = (url: string, token: string) => {
  const urlObject = parse(url);
  set(urlObject, 'query', urlObject.query || {});
  set(urlObject, 'pathname', `/v4/${url.split('mapbox://')[1]}.json`);
  set(urlObject, 'protocol', 'https');
  set(urlObject, 'host', 'api.mapbox.com');
  set(urlObject, 'query', Object.assign(get(urlObject, 'query'), {
    access_token: token,
    secure: true
  }));
  return format(urlObject);
};

const normalizeMapboxTileURL = (url: string, token: string) => {
  const urlObject = parse(url);
  set(urlObject, 'query', urlObject.query || {});
  set(urlObject, 'pathname', `/v4${urlObject.path}`);
  set(urlObject, 'protocol', 'https');
  set(urlObject, 'host', 'a.tiles.mapbox.com');
  set(urlObject, 'query.access_token', token);
  return format(urlObject);
};

// @ts-ignore
const normalizeMapboxStyleURL = (url: string, token: string) => {
  const urlObject = parse(url);
  set(urlObject, 'query', {
    access_token: token,
    secure: true
  });
  set(urlObject, 'pathname', `styles/v1${urlObject.path}`);
  set(urlObject, 'protocol', 'https');
  set(urlObject, 'host', 'api.mapbox.com');
  return format(urlObject);
};

const normalizeMapboxSpriteURL = (url, token) => {
  const extMatch = /(\.png|\.json)$/g.exec(url);
  const ratioMatch = /(@\d+x)\./g.exec(url);
  const trimIndex = Math.min(ratioMatch != null ? ratioMatch.index : Infinity, get(extMatch, 'index', 0));
  const urlObject = parse(url.substring(0, trimIndex));

  const extPart = get(extMatch, '1');
  const ratioPart = ratioMatch != null ? ratioMatch[1] : '';
  set(urlObject, 'query', urlObject.query || {});
  set(urlObject, 'pathname', `/styles/v1${urlObject.path}/sprite${ratioPart}${extPart}`);
  set(urlObject, 'protocol', 'https');
  set(urlObject, 'host', 'api.mapbox.com');
  set(urlObject, 'query.access_token', token);
  return format(urlObject);
};

const normalizeMapboxGlyphURL = (url: string, token: string) => {
  const urlObject = parse(url);
  set(urlObject, 'query', urlObject.query || {});
  set(urlObject, 'pathname', `/fonts/v1${urlObject.path}`);
  set(urlObject, 'protocol', 'https');
  set(urlObject, 'host', 'api.mapbox.com');
  set(urlObject, 'query.access_token', token);
  return format(urlObject);
};

export default class MapboxController extends Controller {
  public async exportMapboxMap() {
    const { ctx } = this;
    const { zoom = 1, name, devicePixelRatio } = {
      zoom: Number(ctx.request.query.zoom),
      name: ctx.request.query.name,
      devicePixelRatio: Number(ctx.request.query.devicePixelRatio || 1),
    };

    const boundary = await ctx.service.maskData.getData();

    const extent = getExtent(boundary);

    const { width, height } = mathRealWH(zoom, extent);

    const options = {
      ratio: devicePixelRatio,
      request: (req, callback) => {
        const { url, kind } = req;

        const isMapbox = isMapboxURL(url);

        try {
          switch (kind) {
            case 2: { // source
              if (isMapbox) {
                getRequest(normalizeMapboxSourceURL(url, token), callback)
              } else {
                getRequest(url, callback)
              }
              break
            }
            case 3: { // tile
              if (isMapbox) {
                getRequest(normalizeMapboxTileURL(url, token), callback)
              } else {
                getRequest(url, callback)
              }
              break
            }
            case 4: { // glyph
              getRequest(isMapbox ? normalizeMapboxGlyphURL(url, token) : parse(url), callback);
              break
            }
            case 5: { // sprite image
              getRequest(isMapbox ? normalizeMapboxSpriteURL(url, token) : parse(url), callback);
              break
            }
            case 6: { // sprite json
              getRequest(isMapbox ? normalizeMapboxSpriteURL(url, token) : parse(url), callback);
              break
            }
            default: {
            }
          }
        } catch (err) {
          callback(err)
        }
      }
    };

    const view = {
      zoom,
      center: [116.3949, 40.2073],
      height,
      width,
      bearing: 0,
      pitch: 0,
    };

    const map = new mbgl.Map(options);

    map.load('mapbox://styles/mapbox/streets-v11');

    console.log(extent);

    // map.fitBounds(extent, {
    //   padding: 10
    // });

    const data: {
      name: string;
      imageData: Buffer;
    } = await (new Promise((resolve, reject) => {
      const _name = `${name}_${zoom}_mapbox_${Date.now()}${devicePixelRatio > 1 ? '@2x' : ''}.png`;
      const out = utilResolve(`public/images/${_name}`);
      map.render(
        view,
        (err, buffer) => {
          if (err) {
            return reject(err)
          }

          map.release(); // release map resources to prevent reusing in future render requests

          for (let i = 0; i < buffer.length; i += 4) {
            const alpha = buffer[i + 3];
            const norm = alpha / 255;
            if (alpha === 0) {
              buffer[i] = 0;
              buffer[i + 1] = 0;
              buffer[i + 2] = 0;
            } else {
              buffer[i] = buffer[i] / norm;
              buffer[i + 1] = buffer[i + 1] / norm;
              buffer[i + 2] = buffer[i + 2] / norm;
            }
          }

          try {
            return sharp(
              buffer,
              {
                raw: {
                  width: width * devicePixelRatio,
                  height: height * devicePixelRatio,
                  channels: 4
                }
              })
              .png()
              // .toBuffer()
              // .then(resolve)
              // .catch(reject)
              .toFile(out)
              .then(() => {
                resolve({
                  name: _name,
                  imageData: buffer,
                });
              })
              .catch(reject)
          } catch (error) {
            return reject(error)
          }
        }
      );
    }));

    // ctx.type = 'png';
    // ctx.set('Content-Type', 'image/png');
    const host = getDomain(this);
    const path = `/public/images/${data.name}`;
    ctx.body = {
      code: 200,
      data: {
        host,
        path,
        fullPath: host + path,
      }
    };
  }
}

