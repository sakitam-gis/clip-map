import * as sharp from 'sharp';
import * as pixelmatch from 'pixelmatch';

/**
 * 循环存取坐标
 * @param geojson
 * @returns {*}
 */
function getCoordinatesLoop(geojson) {
  let coords;
  if (geojson.type === 'Point') {
    coords = [geojson.coordinates];
  } else if (geojson.type === 'LineString' || geojson.type === 'MultiPoint') {
    coords = geojson.coordinates;
  } else if (geojson.type === 'Polygon' || geojson.type === 'MultiLineString') {
    coords = geojson.coordinates.reduce((dump, part) => dump.concat(part), []);
  } else if (geojson.type === 'MultiPolygon') {
    coords = geojson.coordinates.reduce((dump, poly) => dump.concat(poly.reduce((points, part) => points.concat(part), [])), []);
  } else if (geojson.type === 'Feature') {
    coords = getCoordinatesLoop(geojson.geometry);
  } else if (geojson.type === 'GeometryCollection') {
    coords = geojson.geometries.reduce((dump, g) => dump.concat(getCoordinatesLoop(g)), []);
  } else if (geojson.type === 'FeatureCollection') {
    coords = geojson.features.reduce((dump, f) => dump.concat(getCoordinatesLoop(f)), []);
  }
  return coords;
}

/**
 * 获取GeoJSON的数据范围
 * @param geojson
 * @returns {*}
 */
export function getExtent(geojson: any): any[] {
  let coords: any = null;
  const extent = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY,
  ];
  if (!geojson.hasOwnProperty('type')) return extent;
  coords = getCoordinatesLoop(geojson);

  if (coords) {
    return coords.reduce((prev, coord) => [
      Math.min(coord[0], prev[0]),
      Math.min(coord[1], prev[1]),
      Math.max(coord[0], prev[2]),
      Math.max(coord[1], prev[3]),
    ], extent);
  } else {
    return extent;
  }
}

/**
 * diff image is same
 * @param imageData
 * @param expectImage
 */
export async function diffImage(imageData, expectImage) {
  const pngImage = await sharp(imageData);
  const { width, height } = await pngImage.metadata();

  const rawData = await pngImage.raw().toBuffer();

  const expected = await sharp(expectImage)
    .raw()
    .toBuffer();

  return pixelmatch(rawData, expected, null, width, height)
}
