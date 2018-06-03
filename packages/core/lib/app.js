import { initPlugins } from './plugin'
import { MINA_APP_LIFECYCLES, noop } from './constants'

const minaAppConstructSymbol = Symbol('minaAppConstruct')
const minaAppSymbol = Symbol('minaApp')
const pluginsSymbol = Symbol('plugins')

class NoseaApp {
  /*
    this.plugins, Array[PluginInstance]
    this.pageMethods, Object{Function}, Array[Object]
    this.pageData, Object{any}
   */
  constructor () {
    this[minaAppConstructSymbol] = null
    this[minaAppSymbol] = null
    this[pluginsSymbol] = initPlugins(this)
  }

  get minaAppStruct () {
    return this[minaAppConstructSymbol]
      ? Object.assign({}, this[minaAppConstructSymbol]) : null
  }

  get $minaApp () { return this[minaAppSymbol] }

  get isConstructed () { return !!this[minaAppConstructSymbol] }

  get isNoseaApp () { return true }

  get methods () {
    const raw = this.constructor.pageMethods
    if (typeof raw === 'object') {
      if (raw.constructor.name === 'Array') {
        return raw.reduce((acc, current) => Object.assign(acc, current), {})
      }
      return Object.assign({}, raw)
    }
    return {}
  }

  get pageData () { return this.constructor.pageData || {} }

  get plugins () { return this[pluginsSymbol] }

  construct () {
    if (this.isConstructed) { return this.minaAppStruct }

    const _this = this
    const ret = {}

    ret['onLaunch'] = function (options) {
      _this[minaAppSymbol] = this

      Object.defineProperties(this, {
        '$noseaApp': {
          get () { return _this }
        },
        'isMinaApp': {
          get () { return true }
        }
      })

      return _this.plugins.commitAppHook('onLaunch').then(() => {
        return (_this['onLaunch'] || noop).bind(this, options)()
      })
    }

    MINA_APP_LIFECYCLES.forEach((key, i) => {
      ret[key] = ret[key] || function (...args) {
        return _this.plugins.commitAppHook(key).then(() => {
          return (_this[key] || noop).bind(this, ...args)()
        })
      }
    })

    this[minaAppConstructSymbol] = ret
    return this.minaAppStruct
  }

  static init () {
    const app = new this()
    Object.defineProperty(wx, '$app', {
      get () { return app }
    })
    return app.construct()
  }
}

export { NoseaApp }
