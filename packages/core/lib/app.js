import {
  S_MINA_APP,
  S_LAUNCH_OPTIONS,
  S_SHOW_OPTIONS,
  S_PLUGINS
} from './constants'

import { initPlugins } from './plugin'
import {
  getNoseaAppHooks,
  getMinaAppLifecycles,
  noseaAppDefaultLifecyclePromises
} from './lifecycle'

class NoseaApp {
  static isNoseaApp = true

  static plugins = []

  static pageMethods = []
  static pageData = {}

  constructor (rawOptions) {
    this.lifecyclePromises = { ...noseaAppDefaultLifecyclePromises }
    this.hooks = getNoseaAppHooks()
    this.minaLifecycles = getMinaAppLifecycles(this)

    this[S_MINA_APP] = null
    this[S_LAUNCH_OPTIONS] = null
    this[S_SHOW_OPTIONS] = null
    this[S_PLUGINS] = []

    this.init()
  }

  getInitOptions () {
    return Object.assign({}, this.minaLifecycles)
  }

  init () {
    wx.$app = this

    this.hooks.hookBeforeLaunch((noseaApp, minaApp, wxRes) => {
      Object.defineProperties(minaApp, {
        '$noseaApp': {
          get () { return noseaApp }
        }
      })

      this[S_MINA_APP] = minaApp
      this[S_LAUNCH_OPTIONS] = wxRes
    })

    this.hooks.hookBeforeShow((noseaApp, minaApp, wxRes) => {
      this[S_SHOW_OPTIONS] = wxRes
    })

    initPlugins(this)
  }

  get $minaApp () {
    return this[S_MINA_APP]
  }

  get currentPages () {
    return getCurrentPages()
  }

  get launchOptions () {
    return this[S_LAUNCH_OPTIONS]
  }

  get showOptions () {
    return this[S_SHOW_OPTIONS]
  }
}

export default NoseaApp
export { NoseaApp }
