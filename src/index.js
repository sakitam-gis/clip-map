const fs = require('fs-extra');
const path = require('path');
const jsdom = require('jsdom');
const maptalks = require('maptalks.node');
const sendToWormhole = require('stream-wormhole');

const { createCanvas, Image } = require('canvas');

const boundary = require('./beijing');

const { JSDOM } = jsdom;

global.document = new JSDOM().window.document;
global.window = new JSDOM().window;
global.Image = Image;


/**
 * resolve path
 * @param _path
 */
const utilResolve = _path => path.resolve(__dirname, '.', _path);

const pixelRatio = 2;

/**
 * 计算真实视图宽高
 * @param zoom
 * @param extent
 */
function mathRealWH (zoom, extent) {
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
    width: width * Math.pow(pixelRatio, 2) + 50,
    height: height * Math.pow(pixelRatio, 2) + 50,
  }
}

async function init(zoom) {
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

  const { width, height } = mathRealWH(zoom, extent);
  const canvas = createCanvas(width, height);

  // const mapWarp = document.createElement('div');
  canvas.width = width;
  canvas.height = height;
  // canvas.style.width = `${width}px`;
  // canvas.style.height = `${height}px`;

  const map = new maptalks.Map(canvas, {
    center: [116.3949, 40.2073],
    zoom: zoom,
    devicePixelRatio: 2,
    zoomAnimationDuration: 0,
    seamlessZoom: false,
    // spatialReference: {
    //   projection: 'baidu',
    // },
  });

  map.fitExtent(extent, 0);

  const heightDip = 2;

  const layer = new maptalks.TileLayer('base', {
    // spatialReference: {
    //   projection: 'baidu',
    // },
    // urlTemplate: 'https://online{s}.map.bdimg.com/tile/?qt=vtile&x={x}&y={y}&z={z}&styles=pl&scaler=2&udt=20190821',
    // subdomains: [4],
    urlTemplate: `https://api.mapbox.com/styles/v1/mapbox/streets-zh-v1/tiles/{z}/{x}/{y}${heightDip > 1.5 ? '@2x' : ''}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejh2N21nMzAxMmQzMnA5emRyN2lucW0ifQ.jSE-g2vsn48Ry928pqylcg`,
  }).setMask(mask);

  const data = await (new Promise((resolve, reject) => {
    layer.on('layerload', () => {
      const _name = new Date().getTime() + '.png';
      // const _pathName = utilResolve(`images/${_name}`);
      const out = fs.createWriteStream(utilResolve(`images/${_name}`));
      // const ll = map.toDataURL({
      //   'mimeType': 'image/png', // or 'image/png'
      //   'save': false,             // to pop a save dialog
      //   'fileName': _name        // file name
      // });
      //
      // const base64Data = ll.replace(/^data:image\/\w+;base64,/, '');
      // const dataBuffer = Buffer.from(base64Data, 'base64');
      //
      // fs.writeFile(_pathName, dataBuffer, function(err) {
      //   if (err) {
      //     reject(err);
      //   } else {
      //     const stream = fs.createReadStream(_pathName);
      //     const responseData = [];
      //     if (stream) {
      //       stream.on('data', function(chunk) {
      //         responseData.push(chunk);
      //       });
      //       stream.on('end', function() {
      //         const finalData = Buffer.concat(responseData);
      //         resolve(finalData);
      //       });
      //     }
      //   }
      // });

      const stream = canvas.createPNGStream();
      const data = [];

      stream.on('data', function(chunk) {
        data.push(chunk);
        out.write(chunk);
      });

      stream.on('end', function() {
        console.log('saved png');
        const finalData = Buffer.concat(data);
        resolve(finalData);
        sendToWormhole(stream, true)
          .then(() => console.log('done'));
      });
    });

    map.addLayer(layer);
  }));
}

init(8).then(res => {});
