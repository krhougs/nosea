import Hookable from 'hable'

import {
  MINA_APP_LIFECYCLES, MINA_PAGE_LIFECYCLES,
  E_CONTEXT_NOT_INITILIZED,
  MINA_APP_HOOK_PROPS,
  MINA_PAGE_HOOK_PROPS,
  flat,
  capitalize,
  noop
} from './constants'

function getHooks (lifecycles) {
  class ContextHooks extends Hookable {
    static hookNames = [
      ...flat(
        lifecycles.async
          .map(i => ['on', 'before', 'after']
            .map(ii => ii + i))),
      ...lifecycles.sync
        .map(i => 'on' + i)
    ]

    constructor () {
      super()
      this.constructor.hookNames
        .forEach(name => {
          this[`hook${capitalize(name)}`] = function (...args) {
            return this.hook(name, ...args)
          }
        })
    }
  }
  return new ContextHooks()
}

function getMinaLifecycles (lifecycles, noseaContext, hookContexts) {
  const lifecycleCallbacks = {}
  for (const name of lifecycles.async) {
    const lcName = `on${name}`
    lifecycleCallbacks[lcName] = function (wxRes) {
      let context = noseaContext || this.$noseaPage
      if (!context) {
        context = new this.$constructor(this)
      }
      const retPromise = (async () => {
        await context.hooks.callHook(`before${name}`, context, this, wxRes)
        await context.hooks.callHook(`on${name}`, context, this, wxRes)
        const ret = await (context::(context[`on${name}`] || noop)(wxRes))
        context.hooks.callHook(`after${name}`, context, this, wxRes)
        return ret
      })()
      context.lifecyclePromises[lcName] = retPromise
      return retPromise
    }
  }
  for (const name of lifecycles.sync) {
    const lcName = `on${name}`
    lifecycleCallbacks[lcName] = function (wxRes) {
      let context = noseaContext || this.$noseaPage
      if (!context) {
        context = new this.$constructor(this)
      }
      context.hooks.callHook(`on${name}`, context, this, wxRes)
      return context::(context[`on${name}`] || noop)(wxRes)
    }
  }
  if (lifecycles.share) {
    const lcName = `on${lifecycles.share}`
    lifecycleCallbacks[lcName] = function (wxRes) {
      let context = noseaContext || this.$noseaPage
      if (!context) {
        context = new this.$constructor(this)
      }
      return context::(context[lcName])(wxRes)
    }
  }
  return lifecycleCallbacks
}

function getDefaultLifecyclePromise (lifecycles) {
  const lifecyclePromises = {}
  for (const name of lifecycles.async) {
    Object.defineProperty(lifecyclePromises, `on${name}`, {
      configurable: true,
      get () {
        throw E_CONTEXT_NOT_INITILIZED
      }
    })
  }
  return lifecyclePromises
}

export function getNoseaAppHooks () {
  return getHooks(MINA_APP_LIFECYCLES, MINA_APP_HOOK_PROPS)
}
export function getNoseaPageHooks () {
  return getHooks(MINA_PAGE_LIFECYCLES, MINA_PAGE_HOOK_PROPS)
}

export function getMinaAppLifecycles (noseaApp) {
  return getMinaLifecycles(MINA_APP_LIFECYCLES, noseaApp, MINA_APP_HOOK_PROPS)
}
export function getMinaPageLifecycles () {
  return getMinaLifecycles(MINA_PAGE_LIFECYCLES, null, MINA_PAGE_HOOK_PROPS)
}

export const noseaAppDefaultLifecyclePromises = getDefaultLifecyclePromise(MINA_APP_LIFECYCLES)
export const noseaPageDefaultLifecyclePromises = getDefaultLifecyclePromise(MINA_PAGE_LIFECYCLES)
