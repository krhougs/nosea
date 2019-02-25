import { autorun, toJS, extendObservable } from 'mobx'
import { diff } from 'deep-object-diff'
import { NoseaPluginBase } from '@nosea/core'

import debounce from './debounce'

const S_INITILIZED = Symbol('storeInitilized')
const E_INITILIZED = new Error('NoseaMobxBindPlugin is already initilized.')

class NoseaMobxBindPlugin extends NoseaPluginBase {
  constructor (options) {
    super()
    this.options = Object.assign({
      delayOnPage: 0,
      delayOnPageProxy: 0,
      autorunOptions: {}
    }, options)
  }

  installApp (app) {
    throwIfInitilized(this, app)

    markAppAsInitilized(this, app)
  }

  installPage (page) {
    const _this = this

    page.__mobxNames = []
    page.__mobxData = {}

    extendObservable(page, {
      get $data () {
        const ret = {}
        for (const name in page.$mobx.values) {
          if (name !== '$data') {
            ret[name] = toJS(page[name])
          }
        }
        return ret
      }
    })

    for (const n in page.__mobxDecorators) {
      page.__mobxNames.push(n)
    }

    page.hooks.hookBeforeLoad(() => {
      autorun(page::reactOnMobxValueChange, {
        delay: _this.delayOnPage
      })
    })
  }

  installPageProxy (proxy) {
    autorun(proxy.proxy::reactOnMobxValueChange, {
      delay: this.delayOnPageProxy
    })
  }
}

const debounced = debounce(function (reaction) {
  const toSet = {}
  for (const name in this.__mobxData) {
    const newData = this.__mobxData[name]
    const oldData = this.$minaPage.__viewData__
    if (
      typeof newData === typeof oldData &&
      typeof newData === 'object'
    ) {
      if (!oldData || Object.getOwnPropertyNames(
        diff(oldData, newData)
      ).length) {
        toSet[name] = newData
      }
    } else {
      if (newData !== oldData) {
        toSet[name] = newData
      }
    }
  }

  if (Object.getOwnPropertyNames(toSet).length) {
    this.$minaPage.setData(toSet)
  }
}, 240)

function reactOnMobxValueChange (reaction) {
  const mobx = this.$mobx || this.$noseaPage.$mobx
  this.__mobxData = this.$data

  this::debounced(reaction)
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
