const DOMAIN = Symbol('Context#domain');

export default {
  // from https://github.com/eggjs/egg/issues/2912
  get domain() {
    if (!this[DOMAIN]) {
      // @ts-ignore
      const host = this.ctx.host.indexOf(':') ? this.ctx.host.split(':')[0] : this.ctx.host;
      this[DOMAIN] =
        host.split('.').length > 1
          ? host
            .split('.')
            .slice(-2)
            .join('.')
          : host;
    }
    return this[DOMAIN];
  }
}
