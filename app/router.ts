import * as jsdom from 'jsdom';
import { Image } from 'canvas';
import { Application } from 'egg';

const { JSDOM } = jsdom;

if (global) {
  // @ts-ignore
  global.document = new JSDOM().window.document;
  // @ts-ignore
  global.window = new JSDOM().window;
  // @ts-ignore
  global.Image = Image;
}

export default (app: Application) => {
  const { controller, router } = app;

  router.get('/', controller.home.index);
  router.post('/', controller.home.index);

  router.get('/export/maptalks', controller.maptalks.exportArea);
  // router.get('/tile/:z/:x/:y', controller.tilelive.index);
};
