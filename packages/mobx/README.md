@nosea/mobx
=========
Mobx@4 binding for @nosea/core.

小程序框架 `@nosea/core` 之 `mobx` binding.

## 使用方法
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

  export default ThinkieApp
```

In page entry:
```javascript
  import { NoseaPage } from '@nosea/core'
  import { observable, computed } from 'mobx'

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

  export default TabPagesView
```

In page template:
```html
  <view>{{ bar[0] }}</view>
  <view>{{ bar[1] }}</view>
```

## 其他
使用 MIT 协议开源。
