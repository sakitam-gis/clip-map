class AppBootHook {
  constructor() {
    // this.app = app;
  }

  // async didLoad() {
  //   // 所有的配置已经加载完毕
  //   // 可以用来加载应用自定义的文件，启动自定义的服务
  //
  //   // 例如：创建自定义应用的示例
  //   this.app.queue = new Queue(this.app.config.queue);
  //   await this.app.queue.init();
  //
  //   // 例如：加载自定义的目录
  //   this.app.loader.loadToContext(path.join(__dirname, 'app/tasks'), 'tasks', {
  //     fieldClass: 'tasksClasses',
  //   });
  // }
  //
  // async willReady() {
  //   // 所有的插件都已启动完毕，但是应用整体还未 ready
  //   // 可以做一些数据初始化等操作，这些操作成功才会启动应用
  //
  //   // 例如：从数据库加载数据到内存缓存
  //   this.app.cacheData = await this.app.model.query(QUERY_CACHE_SQL);
  // }
  //
  // async didReady() {
  //   // 应用已经启动完毕
  //
  //   const ctx = await this.app.createAnonymousContext();
  //   await ctx.service.Biz.request();
  // }

  async serverDidReady() {
    console.log(process.env.APP_HOST);
    console.log(process.env.APP_PORT);
    // http / https server 已启动，开始接受外部请求
    // 此时可以从 app.server 拿到 server 的实例
    // await this.app.context.curl('http://127.0.0.1:7001/area/base?lon=103.87555555555555&lat=27.61777777777778&type=WS');
    // this.app.server.on('timeout', socket => {
    //   // handle socket timeout
    // });
  }
}

export default AppBootHook;
