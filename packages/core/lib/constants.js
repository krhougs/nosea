export const N_NOSEA_APP = 'NoseaApp'
export const N_NOSEA_PAGE = 'NoseaPage'
export const N_NOSEA_PLUGIN = 'NoseaPlugin'
export const N_MINA_APP = 'MinaApp'
export const N_MINA_PAGE = 'MinaPage'

export const S_NOSEA_APP = Symbol('$noseaApp')
export const S_MINA_APP = Symbol('$minaApp')
export const S_NOSEA_PAGE = Symbol('$noseaPage')
export const S_MINA_PAGE = Symbol('$minaPage')
export const S_LAUNCH_OPTIONS = Symbol('launchOptions')
export const S_LOAD_OPTIONS = Symbol('loadOptions')
export const S_SHOW_OPTIONS = Symbol('showOptions')
export const S_PAGE_PROXY = Symbol('pageProxy')
export const S_PAGE_PROXIES = Symbol('pageProxies')
export const S_PLUGINS = Symbol('plugins')

export const MINA_APP_HOOK_PROPS = ['noseaApp']
export const MINA_PAGE_HOOK_PROPS = ['noseaPage']

export const MINA_APP_LIFECYCLES = {
  async: ['Launch', 'Show'],
  sync: ['Hide', 'Error', 'PageNotFound']
}

export const MINA_PAGE_LIFECYCLES = {
  async: ['Load', 'Show', 'Ready'],
  sync: [
    'Hide', 'Unload',
    'PullDownRefresh', 'ReachBottom',
    'PageScroll', 'Resize', 'TabItemTap'
  ],
  share: 'ShareAppMessage'
}

export const E_CONTEXT_NOT_INITILIZED = new Error('Context is not initilized yet.')
export const E_INVALID_CONTEXT = new Error('Invalid context.')

export function noop () {}
export function noopAsync () { return Promise.resolve() }

export function flat (arr) { return [].concat(...arr) }
export function capitalize (str) { return str.charAt(0).toUpperCase() + str.slice(1) }
