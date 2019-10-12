import { EggPlugin } from 'egg';

const plugin: EggPlugin = {
  static: {
    enable: true
  },
  // security: {
  //   enable: false,
  //   package: 'egg-security',
  // },
  cors: {
    enable: true,
    package: 'egg-cors',
  },
  // nunjucks: {
  //   enable: true,
  //   package: 'egg-view-nunjucks',
  // },
};

export default plugin;
