import {
  S_PLUGINS,
  E_INVALID_CONTEXT
} from './constants'

function initPlugins (context) {
  if (context.constructor.isNoseaApp) {
    return hookApp(context)
  }
  if (context.constructor.isNoseaPage) {
    return hookPage(context)
  }
  if (context.constructor.isNoseaPageProxy) {
    return hookPageProxy(context)
  }
  throw E_INVALID_CONTEXT
}

function hookApp (app) {
  if (!app.constructor.isNoseaApp) {
    throw E_INVALID_CONTEXT
  }
  app[S_PLUGINS] = app.constructor.plugins
    .map(p => {
      if (p.installApp) {
        p::p.installApp(app)
      }
      return p
    })
}

function hookPage (page) {
  if (!page.constructor.isNoseaPage) {
    throw E_INVALID_CONTEXT
  }
  wx.$app.constructor.plugins
    .forEach(p => {
      if (p.installPage) {
        p::p.installPage(page)
      }
      return p
    })
}

function hookPageProxy (proxy) {
  if (!proxy.constructor.isNoseaPageProxy) {
    throw E_INVALID_CONTEXT
  }
  wx.$app.constructor.plugins
    .forEach(p => {
      if (p.installPageProxy) {
        p::p.installPageProxy(proxy)
      }
      return p
    })
}

class NoseaPluginBase {
  static isNoseaPlugin = true
}

export {
  NoseaPluginBase,
  NoseaPluginBase as NoseaPlugin,
  initPlugins
}
