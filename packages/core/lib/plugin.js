import { MINA_PAGE_LIFECYCLES, MINA_APP_LIFECYCLES } from './constants'

function commitHooks (scope, hookname, noseaPage) {
  // thisArg should be noseaApp
  const pluginsInstances = this.plugins.instances
  return Promise.all(
    Object.values(pluginsInstances).map(i => {
      if (i.hooks && i.hooks[scope] && i.hooks[scope][hookname]) {
        return i.hooks[scope][hookname](this, noseaPage)
      } else {
        return Promise.resolve()
      }
    })
  )
}

function initPlugins (noseaApp) {
  const ret = {
    commitAppHook (hookname) {
      if (MINA_APP_LIFECYCLES.indexOf(hookname) > -1) {
        return commitHooks.bind(noseaApp, 'app', hookname)()
      }
      throw new Error('Invalid lifecycle hook!')
    },
    commitPageHook (hookname, noseaPage) {
      if (MINA_PAGE_LIFECYCLES.indexOf(hookname) > -1) {
        return commitHooks.bind(noseaApp, 'page', hookname, noseaPage)()
      }
      throw new Error('Invalid lifecycle hook!')
    },
    commitCustomHook (scope, hookname) {
      return commitHooks.bind(noseaApp, scope, hookname)()
    },
    commitPageShareAppMessage (wxOptions, _this) {
      const plugins = Object.values(noseaApp.plugins.instances)
        .filter(i => i.hooks && i.hooks['page'] && i.hooks['page']['onShareAppMessage'])
      if (!plugins.length) { return undefined }
      if (!plugins.length > 1) { console.warn('More than 1 plugin has hooked onShareAppMessage. Only 1 plugin\'s hook could be invoked due to WeChat\'s limit.') }
      return plugins[0].hooks['page']['onShareAppMessage'](noseaApp, _this, wxOptions)
    }
  }

  let pluginsInstances = noseaApp.constructor.plugins

  if (!(noseaApp && noseaApp.isNoseaApp)) { throw Error('Not a NoseaApp or the NoseaApp not initialized!') }
  if (!(pluginsInstances && Object.keys(pluginsInstances).length)) { return ret }

  pluginsInstances = Object.assign({}, pluginsInstances)

  const retAttrs = {
    instances: {
      get () { return pluginsInstances }
    },
    methods: {
      get () {
        return Object.assign(
          {},
          ...Object.values(pluginsInstances).map(p => p.methods || {})
        )
      }
    },
    events: {
      get () {
        return Object.values(pluginsInstances).map(p => p.events || [])
      }
    }
  }

  Object.defineProperties(ret, retAttrs)
  return ret
}

const rawOptionsSymbol = Symbol('rawOptions')
const eventsSymbol = Symbol('events')
const methodsSymbol = Symbol('methods')

class NoseaPlugin {
  /**
    events, Array[String]
    methods, Object{Function}
  */

  constructor (options) {
    this[rawOptionsSymbol] = options
    this[eventsSymbol] = this.constructor.events || []
    this[methodsSymbol] = this.constructor.methods || {}
  }

  get _events () { return [].concat(this[eventsSymbol]) }
  get events () { return this._events }

  get _methods () { return Object.assign({}, this[methodsSymbol]) }
  get methods () { return this._methods }

  get rawOptions () { return Object.assign({}, this[rawOptionsSymbol]) }
}

export { NoseaPlugin, initPlugins }
