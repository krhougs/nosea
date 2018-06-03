import { MINA_PAGE_LIFECYCLES, noop } from './constants'

const noseaAppSymbol = Symbol('minaApp')
const minaPageSymbol = Symbol('minaPage')
const minaPageConstructSymbol = Symbol('minaPageConstruct')

class NoseaPage {
  /*
    data, Object{any}
    methods, Object{Function}, Array[Object]
  */

  constructor () {
    this[noseaAppSymbol] = wx.$app
    this[minaPageConstructSymbol] = null
    this[minaPageSymbol] = null
  }

  get $noseaApp () { return this[noseaAppSymbol] }

  get $minaApp () { return this[noseaAppSymbol].$minaApp }

  get $minaPage () { return this[minaPageSymbol] }

  get minaPageStruct () {
    return this[minaPageConstructSymbol]
      ? Object.assign({}, this[minaPageConstructSymbol]) : null
  }

  get isConstructed () { return !!this[minaPageConstructSymbol] }

  get isNoseaPage () { return true }

  get data () { return this.constructor.data || {} }

  get methods () {
    const raw = this.constructor.methods
    if (typeof raw === 'object') {
      if (raw.constructor.name === 'Array') {
        return raw.reduce((acc, current) => Object.assign(acc, current), {})
      }
      return Object.assign({}, raw)
    }
    return {}
  }

  construct () {
    if (this.isConstructed) { return this.minaPageStruct }

    const _this = this
    const ret = {}

    ret['data'] = Object.assign({}, this.$noseaApp.pageData, this.data)

    Object.assign(
      ret,
      this.$noseaApp.plugins.methods,
      this.$noseaApp.methods,
      this.methods
    )

    ret['onLoad'] = function (options) {
      Object.defineProperties(this, {
        '$noseaPage': {
          get () { return _this }
        },
        '$noseaApp': {
          get () { return _this.$noseaApp }
        },
        '$minaApp': {
          get () { return _this.$minaApp }
        },
        'isMinaPage': {
          get () { return true }
        }
      })
      _this[minaPageSymbol] = this

      return _this.$noseaApp.plugins.commitPageHook('onLoad', _this).then(() => {
        return (_this['onLoad'] || noop).bind(this, options)()
      })
    }

    ret['onShow'] = function (options) {
      const route = {
        path: this.__route__,
        noseaPage: _this,
        minaPage: this
      }

      Object.defineProperty(this.$noseaApp, '$route', {
        configurable: true,
        get () { return route }
      })
      Object.defineProperty(this.$noseaApp.$minaApp, '$route', {
        configurable: true,
        get () { return route }
      })

      return _this.$noseaApp.plugins.commitPageHook('onShow', _this).then(() => {
        return (_this['onShow'] || noop).bind(this, options)()
      })
    }

    ret['onShareAppMessage'] = function (options) {
      return (
        (_this['onShareAppMessage'] || noop).bind(_this, options)() ||
        _this.$noseaApp.plugins.commitPageShareAppMessage(options, _this)
      )
    }

    MINA_PAGE_LIFECYCLES.forEach((key, i) => {
      ret[key] = ret[key] || function (...args) {
        return _this.$noseaApp.plugins.commitPageHook(key, _this).then(() => {
          return (_this[key] || noop).bind(this, ...args)()
        })
      }
    })

    this[minaPageConstructSymbol] = ret
    return this.minaPageStruct
  }

  static init () {
    const page = new this()
    return page.construct()
  }
}

export { NoseaPage }
