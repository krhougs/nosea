import {
  S_MINA_APP,
  S_NOSEA_APP,
  S_MINA_PAGE,
  S_NOSEA_PAGE,
  S_LOAD_OPTIONS,
  S_PAGE_PROXIES
} from './constants'

import {
  noseaPageDefaultLifecyclePromises,
  getNoseaPageHooks,
  getMinaPageLifecycles
} from './lifecycle'

import { initPlugins } from './plugin'

class PageProxy {
  static isNoseaPageProxy = true

  constructor (noseaPage, mixin) {
    this[S_NOSEA_PAGE] = noseaPage
    this.name = mixin.name || null
    this.mMethods = mixin.methods
    this.mData = mixin.data

    this.initProxy()

    if (typeof mixin.onMount === 'function') {
      this.proxy::mixin.onMount(noseaPage)
    }

    initPlugins(this)
  }

  get $minaApp () { return this[S_NOSEA_PAGE][S_MINA_APP] }
  get $noseaApp () { return this[S_NOSEA_PAGE][S_NOSEA_APP] }
  get $minaPage () { return this[S_NOSEA_PAGE][S_MINA_PAGE] }
  get $noseaPage () { return this[S_NOSEA_PAGE] }

  get loadOptions () { return this[S_NOSEA_PAGE][S_LOAD_OPTIONS] }

  get data () { return this.$minaPage.data }

  setData (data) {
    let ret = data
    if (this.name) {
      ret = {}
      for (const key in data) {
        ret[`${this.name}.${key}`] = data[key]
      }
    }
    return this._setData(ret)
  }

  _setData (data) {
    return new Promise((resolve, reject) => {
      this.$minaPage.setData(data, () => {
        resolve()
      })
    })
  }

  getMinaPageMethods () {
    const ret = {}
    for (const key in this.mMethods) {
      const keyName = this.name
        ? `${this.name}.${key}`
        : key
      ret[keyName] = this.proxy::this.mMethods[key]
    }
    return ret
  }

  getMinaPageData () {
    return this.name
      ? { [this.name]: this.mData }
      : this.mData
  }

  getMethod (name) {
    let ret

    if (this.name) {
      ret = this.mMethods[name]
        ? this.$minaPage[`${this.name}.${name}`]
        : this.$minaPage[name]
    } else {
      ret = this.$minaPage[name]
    }

    return ret || undefined
  }

  callMethod (name, ...args) {
    return this.getMethod(name)(...args)
  }

  initProxy () {
    const target = {}
    const props = {}

    const thisNames = [
      ...Object.getOwnPropertyNames(this.constructor.prototype),
      ...Object.getOwnPropertyNames(this)
    ]
    const pageNames = [
      ...Object.getOwnPropertyNames(this.$noseaPage.constructor.prototype),
      ...Object.getOwnPropertyNames(this.$noseaPage)
    ]

    for (const n of pageNames) {
      props[n] = {
        configurable: true,
        get: () => this.$noseaPage[n],
        set: this.$noseaPage::(function (value) {
          this[n] = value
          return value
        })
      }
    }

    for (const n of thisNames) {
      props[n] = {
        configurable: true,
        get: () => Reflect.get(this, n)
      }
    }

    props['$pageProxy'] = {
      configurable: true,
      get: () => this
    }

    Object.defineProperties(target, props)
    this.proxy = target
  }
}
class NoseaPage {
  static isNoseaPage = true

  static data = {}
  static methods = {}
  static mixins = []

  ;[S_MINA_APP] = getApp()
  ;[S_NOSEA_APP] = null
  ;[S_MINA_PAGE] = null
  ;[S_LOAD_OPTIONS] = null

  ;[S_PAGE_PROXIES] = []

  ;lifecyclePromises = { ...noseaPageDefaultLifecyclePromises }
  hooks = getNoseaPageHooks()

  constructor (minaPage) {
    this[S_MINA_PAGE] = minaPage
    this.hooks.hookBeforeLoad((noseaPage, minaPage, wxRes) => {
      Object.defineProperties(minaPage, {
        '$noseaPage': {
          get () { return noseaPage }
        }
      })

      this[S_NOSEA_APP] = wx.$app
      this[S_MINA_PAGE] = minaPage
      this[S_LOAD_OPTIONS] = wxRes
    })

    initPlugins(this)

    for (const m of this.constructor.mixins) {
      this[S_PAGE_PROXIES].push(
        new PageProxy(this, m)
      )
    }

    Object.assign(this.$minaPage, this.minaPageMethods)
    this.$minaPage.setData(this.minaPageData)
  }

  get minaPageMethods () {
    return Object.assign(
      {},
      ...this[S_PAGE_PROXIES].map(i => i.getMinaPageMethods()))
  }

  get minaPageData () {
    return Object.assign(
      {},
      ...this[S_PAGE_PROXIES].map(i => i.getMinaPageData())
    )
  }

  get $minaApp () { return this[S_MINA_APP] }
  get $noseaApp () { return this[S_NOSEA_APP] }
  get $minaPage () { return this[S_MINA_PAGE] }

  get loadOptions () { return this[S_LOAD_OPTIONS] }

  get data () { return this.$minaPage.data }

  static get builder () {
    this.mixins.push({
      methods: this.methods,
      data: this.data
    })
    return {
      $constructor: this,
      ...getMinaPageLifecycles()
    }
  }
}

function useMixinDecorator (...mixins) {
  return function (target) {
    for (const mixin of mixins) {
      target.mixins.push({
        ...mixin[0],
        name: mixin[1] || mixin[0].name
      })
    }
  }
}

export default NoseaPage
export { NoseaPage, useMixinDecorator }
