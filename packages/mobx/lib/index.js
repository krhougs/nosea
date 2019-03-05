import { autorun, extendObservable } from 'mobx'
import { diff } from 'deep-object-diff'
import { NoseaPluginBase } from '@nosea/core'

import { toJS } from './utils'

const S_INITILIZED = Symbol('storeInitilized')
const E_INITILIZED = new Error('NoseaMobxBindPlugin is already initilized.')

class NoseaMobxBindPlugin extends NoseaPluginBase {
  constructor (options) {
    super()
    this.options = Object.assign({
      delayOnPage: 0,
      setDataDelay: 320,
      autorunOptions: {}
    }, options)
  }

  installApp (app) {
    throwIfInitilized(this, app)
    markAppAsInitilized(this, app)
  }

  installPage (page) {
    const _this = this

    extendObservable(page, {}) // trigger mobx create page.$mobx accessor

    const handlers = Object.getOwnPropertyNames(page.$mobx.values)
      .map(name => {
        const handler = function (reaction) {
          let toSet
          const newData = toJS(this[name])
          const oldData = this.$minaPage.data[name]
          if (
            typeof newData === typeof oldData &&
            typeof newData === 'object'
          ) {
            if (!oldData || (!!newData && !!Object.getOwnPropertyNames(diff(oldData, newData)).length)) {
              toSet = newData
            }
          } else {
            if (newData !== oldData) {
              toSet = newData
            }
          }
          if (typeof toSet !== 'undefined') {
            this.$minaPage.setData({ [name]: toSet })
          }
        }
        return page::handler
      })

    const disposers = handlers.map(h => autorun(h), {
      delay: this.options.setDataDelay
    })
    page.hooks.hookOnUnload(() => disposers.forEach(i => i()))
  }
}

function markAppAsInitilized (store, app) {
  app[S_INITILIZED] = true
  store[S_INITILIZED] = true
}

function throwIfInitilized (store, app) {
  if (store[S_INITILIZED] || app[S_INITILIZED]) {
    throw E_INITILIZED
  }
}

function noop () {}

export default NoseaMobxBindPlugin
