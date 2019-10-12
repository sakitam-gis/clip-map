import * as fs from 'fs-extra';
import * as maptalks from 'maptalks.node';
import * as sendToWormhole from 'stream-wormhole';
import { createCanvas } from 'canvas';
import { Controller } from 'egg';

import { resolve as utilResolve, getDomain } from '../utils/common';

/**
 * 计算真实视图宽高
 * @param zoom
 * @param extent
 * @param pixelRatio
 */
function mathRealWH (zoom: number, extent: any, pixelRatio?: number) {
  pixelRatio = pixelRatio || 1;
  const canvas = createCanvas(100, 100);
  const map = new maptalks.Map(canvas, {
    center: [116.3949, 40.2073],
    zoom: zoom,
    devicePixelRatio: 1,
    zoomAnimationDuration: 0
  });

  const max = extent.getMin();
  const min = extent.getMax();
  const pixelMin = map.coordinateToContainerPoint(min);
  const pixelMax = map.coordinateToContainerPoint(max);
  const width = Math.abs(pixelMax.x - pixelMin.x);
  const height = Math.abs(pixelMax.y - pixelMin.y);
  return {
    width: width * Math.pow(<number>pixelRatio, 2) + 50,
    height: height * Math.pow(<number>pixelRatio, 2) + 50,
  }
}

export default class HomeController extends Controller {
  public async exportArea() {
    const { ctx } = this;
    const { zoom = 1, name, devicePixelRatio } = {
      zoom: Number(ctx.request.query.zoom),
      name: ctx.request.query.name,
      devicePixelRatio: Number(ctx.request.query.devicePixelRatio || 1),
    };

    const boundary = await ctx.service.maskData.getData();

    const mask = new maptalks.Polygon(boundary.coordinates, {
      'symbol': [
        {
          'lineColor': '#ccc',
          'lineWidth': 8,
          'polygonFillOpacity': 0
        },
      ]
    });

    const extent = mask.getExtent();

    const { width, height } = mathRealWH(zoom, extent, devicePixelRatio);
    const canvas = createCanvas(width, height);

    // const mapWarp = document.createElement('div');
    canvas.width = width;
    canvas.height = height;
    // canvas.style.width = `${width}px`;
    // canvas.style.height = `${height}px`;

    const map = new maptalks.Map(canvas, {
      center: [116.3949, 40.2073],
      zoom: zoom,
      devicePixelRatio: devicePixelRatio,
      zoomAnimationDuration: 0,
      seamlessZoom: false,
      // spatialReference: {
      //   projection: 'baidu',
      // },
    });

    map.fitExtent(extent, 0);

    const layer = new maptalks.TileLayer('base', {
      // spatialReference: {
      //   projection: 'baidu',
      // },
      // urlTemplate: 'https://online{s}.map.bdimg.com/tile/?qt=vtile&x={x}&y={y}&z={z}&styles=pl&scaler=2&udt=20190821',
      // subdomains: [4],
      urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/streets-zh-v1/tiles/{z}/{x}/{y}${devicePixelRatio > 1.5 ? '@2x' : ''}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejh2N21nMzAxMmQzMnA5emRyN2lucW0ifQ.jSE-g2vsn48Ry928pqylcg`,
    }).setMask(mask);

    const data: {
      name: string;
      imageData: Buffer;
    } = await (new Promise((resolve, reject) => {
      layer.on('layerload', () => {
        const _name = `${name}_${zoom}_maptalks_${Date.now()}${devicePixelRatio > 1 ? '@2x' : ''}.png`;
        const out = fs.createWriteStream(utilResolve(`public/images/${_name}`));

        const stream = canvas.createPNGStream();
        const data: any[] = [];

        stream.on('error', function(error) {
          reject(error);
        });

        stream.on('data', function(chunk) {
          data.push(chunk);
          out.write(chunk);
        });

        stream.on('end', function() {
          const finalData = Buffer.concat(data);
          resolve({
            name: _name,
            imageData: finalData,
          });
          sendToWormhole(stream, true)
            .then(() => console.log('done'));
        });
      });

      map.addLayer(layer);
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

