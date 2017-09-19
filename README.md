# dob-refetch

dob-refetch 是基于 dob 封装的 dob 的一种实践方案。dob-refetch 类型完美，请求方式简单轻便。

[![npm version](https://badge.fury.io/js/dob-refetch.png)](https://badge.fury.io/js/dob-refetch)
[![npm downloads](https://img.shields.io/npm/dt/dob-refetch.svg?style=flat-square)](https://www.npmjs.com/package/dob-refetch)


## install

```sh
$ npm i -S dob-refetch
```

## usage

### 引用方式

```typescript
import connect, { BaseModel, BaseStore,
  Provider, observable, useDebug } from 'dob-refetch';
```

### Store

在 Store 中，可以定义待监听的数据、以及改变数据的 action。每个 Store 都和一个 View 一一对应。

其中，AppProps 类型是该 Store 对应的 View 的 Props 类型

```typescript
@observable
class AppStore extends BaseStore<AppProps> {
  num = 1;

  addNum(num: number) {
    this.num = this.num + num;
  }
}
```

* init 用对应 View 的 Props 初始化


```typescript
@observable
class AppStore extends BaseStore<AppProps> {
  num = number;

  init(props: AppProps) {
    this.num = props.num;
  }
}
```

* getProps 获取对应 View 的 Props

```typescript
@observable
class AppStore extends BaseStore<AppProps> {
  num = number;

  addNum() {
    this.num = this.getProps().num + this.num;
  }
}
```

* BaseModel 使用 BaseModel 来做 refetch

BaseModal<返回值类型>(返回值初始值, 对应的请求方法);

如下代码所示，data 是 BaseModel 的实例，fetchData 是对应的请求方法。

其中，data 会自动用请求方法发送请求，并自动处理 loading、success、error，自动触发 rerender。并且，由于 data 对应的请求方法 fetchData 依赖了 this.num，因此当 this.num 改变之后，fetchData 会自动再次执行，触发 data 的更新及 rerender。

```typescript

@observable
class AppStore extends BaseStore<AppProps> {
  num = 1;

  addNum(num: number) {
    this.num = this.num + num;
  }

  private fetchData() {
    // dependencies;
    const num = this.num;

    return mockFetch('I am response data');
  }
  data = new BaseModel<string>('', this.fetchData);
}
```

其中 fetchData 也支持 async await 的方式

* inject 依赖注入

当需要全局通信是，可以在本地 Store 中，注入其它 Store 的实例，以进行通信。

```typescript
@observable
class AppStore extends BaseStore<AppProps> {
  num = 1;

  addNum(num: number) {
    this.num = this.otherStore.num + num;
  }
  
  @inject(OtherStore) otherStore: OtherStore;
}
```

### View

View 需要用 connect 来绑定，connect 第一个参数是从 GlobalState 拿到对应 Store 的 selector。

GlobalState 稍后介绍。

```typescript
@connect<GlobalState>(state => state.app)
class App extends React.Component<AppProps, any> {
  render() {
    const { store, state } = this.props;
    const data = store.data;
    
    // 使用全局 state
    const otherNum = state.other.num;
    
    return (
      <div>
        num: {store.num}
        <button onClick={store.addNum.bind(null, 3)}>addNum</button>
        {data.loading ? 'loading...' : data.data}
      </div>
    );
  }
}
```

### Provider

* GlobalState

```typescript
// 与redux 的 combineRedux相似，可以随意组装 globalState
const globalState = {
  app: AppStore,
  other: OtherStore,
};

// 拿到 globalState 的类型
type GlobalState = typeof globalState;
```

* Provider

```typescript
ReactDOM.render(
  <Provider store={globalState}>
    {children}
  </Provider>,
  document.getElementById('app'),
);

```

## devtool

```typescript
useDebug();
```

如图：

![图片](https://img.alicdn.com/tfs/TB1UuB7aWagSKJjy0FgXXcRqFXa-1206-134.png)

