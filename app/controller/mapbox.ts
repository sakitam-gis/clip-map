// import * as fs from 'fs-extra';
// require('@mapbox/flow-remove-types/register');
import * as sharp from 'sharp';
import * as mbgl from '@mapbox/mapbox-gl-native';
// import * as sendToWormhole from 'stream-wormhole';
import { Controller } from 'egg';
import { getExtent } from '../utils/geom';
import {
  resolve as utilResolve,
  getDomain, getFileBuffer,
} from '../utils/common';

// mapboxgl.accessToken = 'pk.eyJ1Ijoic21pbGVmZGQiLCJhIjoiY2owbDBkb2RwMDJyMTMycWRoeDE4d21sZSJ9.dWlPeAWsgnhUKdv1dCLTnw';

/**
 * 计算真实视图宽高
 * @param zoom
 * @param extent
 */
function mathRealWH (zoom: number, extent: any) {
  const mapWarp = document.createElement('div');
  mapWarp.style.width = `${100}px`;
  mapWarp.style.height = `${100}px`;
  const map = new mapboxgl.Map({
    center: [116.3949, 40.2073],
    zoom: zoom,
    container: mapWarp, // container id
    style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
  });

  const max = [extent[0], extent[1]];
  const min = [extent[2], extent[3]];
  const pixelMin = map.project(min);
  const pixelMax = map.project(max);
  const width = Math.abs(pixelMax.x - pixelMin.x);
  const height = Math.abs(pixelMax.y - pixelMin.y);
  return {
    width: width + 50,
    height: height + 50,
  }
}

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

    const mapWarp = document.createElement('div');
    // canvas.width = width;
    // canvas.height = height;
    mapWarp.style.width = `${width}px`;
    mapWarp.style.height = `${height}px`;

    const map = new mapboxgl.Map({
      center: [116.3949, 40.2073],
      zoom: zoom,
      container: mapWarp,
      style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
      interactive: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
    });

    map.fitBounds(extent, {
      padding: 10
    });

    const data: {
      name: string;
      imageData: Buffer;
    } = await (new Promise((resolve, reject) => {
      map.on('load', () => {
        const _name = `${name}_${zoom}_mapbox_${Date.now()}${devicePixelRatio > 1 ? '@2x' : ''}.png`;
        const out = utilResolve(`public/images/${_name}`);

        const ll = map.getCanvas().toDataURL('image/png');

        const base64Data = ll.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
        const dataBuffer = Buffer.from(base64Data, 'base64');

        getFileBuffer(out, dataBuffer).then((finalData: Buffer) => {
          resolve({
            name: _name,
            imageData: finalData,
          });
        }).catch(error => {
          reject(error);
        });
      });
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

