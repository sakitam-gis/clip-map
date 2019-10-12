import * as os from 'os';
import * as path from 'path';
import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';

// app special config scheme
export interface OwnConfig {
  cluster: any;
  static: {};
  cors: any;
  multipart: any;
  security: any;
}

export default (appInfo: EggAppInfo) => {
  const config = {
    cluster: {
      listen: {
        port: Number(process.env.APP_PORT) || 7001,
        hostname: process.env.APP_HOST || '127.0.0.1',
        // path: '/var/run/egg.sock',
      }
    },
    // proxyService: process.env.PROXYSERVICE || 'http://127.0.0.1:8099',
    static: { // https://github.com/koajs/static-cache
      // maxAge: 31536000,
    },
    cors: {
      origin: '*',
      credentials: true,
      allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
    },
    multipart: {
      fileSize: '50mb',
      whitelist: filename => [ '.csv' ].includes(path.extname(filename) || ''),
      mode: 'file',
      tmpdir: path.join(os.tmpdir(), 'egg-multipart-tmp', appInfo.name),
      cleanSchedule: {
        // run tmpdir clean job on every day 04:30 am
        // cron style see https://github.com/eggjs/egg-schedule#cron-style-scheduling
        cron: '0 30 4 * * *',
      },
    },
    security: {
      xframe: {
        enable: false,
      },
      csrf: {
        enable: false,
      }
    },
  } as PowerPartial<EggAppConfig> & OwnConfig;

  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = `${appInfo.name}_1562642258154_9476`;

  // add your egg config in here
  config.middleware = [];

  // add your special config in here
  const bizConfig = {
    sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
  };

  // add your user config here
  const userConfig = {
    myAppName: 'clip-map',
  };

  // the return config will combines to EggAppConfig
  return {
    ...config,
    ...bizConfig,
    ...userConfig,
  };
};
