@nosea/core
=========
`Nosea` （נוסע, 希伯来语旅者之意）是一个`微信小程序`框架。

`Nosea` 解决问题的思路是：
 - 拥抱现代 ECMAScript 开发生态；
 - 不改变、不过度包装小程序本身生命周期；
 - 在框架内为小程序提供一个基于生命周期 hook 的插件系统；
 - 不污染小程序本身的应用、页面实例；
 - 在页面实例中提供 `namespace` 和 `mixin`。


## 快速启动
由于历史原因和微信小程序团队对于其框架维护的态度，本框架需要 `webpack + babel` 进行编译、打包。

推荐使用 [mina-webpack-plugin](https://github.com/oranzhang/mina-webpack-plugin) 进行打包（撰写该部分时该插件还未完成文档编写）。

In app entry: 
```javascript
  import { NoseaApp } from '@nosea/core'
  import NoseaMobxBindPlugin from '@nosea/mobx'

  class MyApp extends NoseaApp {
    static pageData = {}
    static plugins = [
      new NoseaMobxBindPlugin()
    ]

    onLaunch () {
      console.log('app onLaunch')
    }
  }

  export default MyApp // 使用 mina-webpack-plugin

  /*
  /* 如果不使用 mina-webpack-plugin, 则：
  /* App(new MyApp().getInitOptions())
  */
```

In page entry:
```javascript
  import { NoseaPage, useMixin } from '@nosea/core'
  import { observable, computed } from 'mobx'

  const systemInfo = wx.getSystemInfoSync()
  const data = Object.freeze({
    systemInfo,
    isIos: systemInfo.platform === 'ios' || systemInfo.system.toLowerCase().includes('ios'),
    statusBarHeight: systemInfo.statusbarHeight || systemInfo.statusBarHeight || 20,
    isIphoneX: (systemInfo.platform === 'ios' || systemInfo.system.toLowerCase().includes('ios')) &&
      (systemInfo.statusbarHeight > 20 || systemInfo.statusBarHeight > 20),
    ...process.env
  })

  const EnvMixin = {
    name: 'env',
    data,
    methods: {
      noop () {},
      logThis () {
        console.log(this)
      }
    }
  }

  @useMixin(EnvMixin, 'env')
  class TabPagesView extends NoseaPage {
    static data = {}
    static methods = {}

    @observable foo = {
      bar: 114514
    }
    @computed get bar () {
      return [foo.bar, 1919810]
    }

    onLoad (res) {
      console.log('page onLoad', res, this)
    }

    onShow (res) {
      console.log('page onShow', res, this)
    }
  }

  export default TabPagesView // 使用 mina-webpack-plugin

  /*
  /* 如果不使用 mina-webpack-plugin, 则：
  /* Page(TabPagesView.builder)
  */
```

## 框架干了啥
1. 开发者继承 `NoseaApp`，在其中初始化插件。创建其实例，通过实例的 `getInitOptions` 方法获取小程序 `App` 实例的初始化参数；
2. 开发者继承 `NoseaPage`，在其中初始化 `mixin`。使用 `NoseaPage.builder` 初始化小程序 `Page` 实例：

   - 自动创建继承自 `NoseaPage` 的类的实例，并作为页面的 context;
   - 在小程序的 `onLoad` 回调中将上述实例与小程序页面实例绑定；
   - 初始化 `NoseaApp` 实例中的插件；
   - 初始化页面 `mixin`，并使用 `mixin` 创建 `PageProxy`，并动态在小程序页面中初始化被渲染的初始数据和处理模版事件的方法；
   - 初始化完毕，执行生命周期 hooks。

## 插件
本框架的插件及其简单，只需继承 `NoseaPluginBase` 并在其中定义钩子方法即可。

一个例子：
```javascript
  import { NoseaPlugin } from '@nosea/core'
  import ProxyPolyfill from './proxy' // 外部引用 ES6 Proxy Polyfill

  const systemInfo = wx.getSystemInfoSync()

  function asyncDo (api) {
    return (options, ...params) => {
      let task
      function executor (resolve, reject) {
        task = api(Object.assign(options || {}, { success: resolve, fail: reject }), ...params)
      }
      return Object.defineProperty(new Promise(executor), 'task', { value: task })
    }
  }

  Object.assign(asyncDo, wx)

  const asyncDoProxy = new ProxyPolyfill(asyncDo, {
    get (target, property) {
      return target(wx[property])
    }
  })

  const data = Object.freeze({
    systemInfo,
    isIos: systemInfo.platform === 'ios' || systemInfo.system.toLowerCase().includes('ios'),
    statusBarHeight: systemInfo.statusbarHeight || systemInfo.statusBarHeight || 20,
    isIphoneX: (systemInfo.platform === 'ios' || systemInfo.system.toLowerCase().includes('ios')) &&
      (systemInfo.statusbarHeight > 20 || systemInfo.statusBarHeight > 20),
    ...process.env
  })

  const EnvMixin = {
    name: 'env',
    data,
    methods: {
      noop () {},
      logThis () {
        console.log(this)
      }
    }
  }

  class InjectEnvPlugin extends NoseaPlugin {
    constructor () {
      super()
      Object.defineProperty(wx, '$async', {
        get: () => asyncDoProxy
      })
    }

    installPage (page) {
      Object.defineProperty(page, 'env', {
        get () { return data }
      })
      if (page.constructor.mixins.indexOf(EnvMixin) < 0) {
        page.constructor.mixins.push(EnvMixin)
      }
    }
  }

  export default InjectEnvPlugin

  export {
    EnvMixin
  }
```

你可以根据需求，在插件中定义：
 - `installApp(app: NoseaApp)`
 - `installPage(page: NoseaPage)`
 - `installPageProxy(proxy: PageProxy)`
  
三个不需要返回值的同步方法，其将分别在：
 - `NoseaApp`
 - `NoseaPage`
 - `PageProxy`

初始化时（即类的 `constructor` 方法运行时）被执行。

## 生命周期 hook
本框架使用 [hable](https://github.com/jsless/hable) 在应用与页面的不同生命周期中提供了 hook，在对应实例初始化时执行：
```javascript
  this.hooks.hookOnShow(async () => {
    console.log('invoked on page onShow()!')
    await something()
    await happened()
  })
  // like: this.hooks.hook${callbackName}(function: Function)
```

## 其他
时间仓促，本文档尚在完善中，敬请谅解。

本插件使用 MIT 协议开源。
