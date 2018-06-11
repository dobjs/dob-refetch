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
import connect, {
  BaseModel,
  BaseStore,
  Provider,
  observable,
  useDebug
} from "dob-refetch";
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

- init 用对应 View 的 Props 初始化

```typescript
@observable
class AppStore extends BaseStore<AppProps> {
  num = number;

  init(props: AppProps) {
    this.num = props.num;
  }
}
```

- getProps 获取对应 View 的 Props

```typescript
@observable
class AppStore extends BaseStore<AppProps> {
  num = number;

  addNum() {
    this.num = this.getProps().num + this.num;
  }
}
```

- BaseModel 使用 BaseModel 来做 refetch

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

  data = new BaseModel("");

  @bindField("data")
  private fetchData() {
    // dependencies;
    const num = this.num;

    return mockFetch("I am response data");
  }
}
```

其中 fetchData 也支持 async await 的方式

- inject 依赖注入

当需要全局通信是，可以在本地 Store 中，注入其它 Store 的实例，以进行通信。

```typescript
@observable
class AppStore extends BaseStore<AppProps> {
  num = 1;

  addNum(num: number) {
    this.num = this.otherStore.num + num;
  }

  otherStore = this.inject(state => state.otherStore);
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
        {data.loading ? "loading..." : data.data}
      </div>
    );
  }
}
```

### Provider

- GlobalState

```typescript
// 与redux 的 combineRedux相似，可以随意组装 globalState
const globalState = {
  app: AppStore,
  other: OtherStore
};

// 拿到 globalState 的类型
type GlobalState = typeof globalState;
```

- Provider

```typescript
ReactDOM.render(
  <Provider store={globalState}>{children}</Provider>,
  document.getElementById("app")
);
```

## devtool

```typescript
useDebug();
```

如图：

![图片](https://img.alicdn.com/tfs/TB1UuB7aWagSKJjy0FgXXcRqFXa-1206-134.png)

## 规范

## import 路径

```typescript
import connect, {
  observable,
  // Store 基类
  BaseStore,
  // 自动请求功能
  BaseModel,
  // 类似于 combineReducer，但只做类型转换，不做实事。
  fixStoreType
} from "dob-refetch";
```

## Store 规范

```js
@observable
class XStore extends BaseStore<XProps> {
  // 属性区
  a = 'a';
  b = 'b';

  // 复杂属性区
  complicatedProp = { a: 'a' };

  /*
   * 依赖注入
   * 因为单实例的应用都会传到 Provider 里。所以所有的单实例都可以用如下方法注入其它单实例。
   */
  @inject(AStore) a: AStore;

  // get 方法区
  get computedName() {
      return a + b;
  }

  // constructor，在实例创建时，如果有逻辑写在这里。
  constructor() {}

  /*
   * 只在单实例中使用。
   * 单实例中，父级组件 willMount 时，传入父级的 props 进行该 store 的实例初始化。
   * 单实例的初始化使用 init。动态实例使用 constructor
   * /
  init(props: XProps) {}

  // set 方法区
  changeA() {
    this.a = a;
  }

  // set 方法区可以使用 async await
  async changeA() {
    await promise1;

    return value;
  }

  async changeB() {
    // async 方法之间调用和传值
    const value = await this.changeA();
  }
}
```

以上属性、方法的排序，可以在 tslint members-order 进行配置。

注意：

- store 中的属性，只能通过调用 store 方法来修改。
  如果直接用 store.a = 'a2'; 这种方式来修改，dob 会报错。

- 一种方法是，把属性置为 private 。其优点是是外部既无法直接修改。但是其缺点也是无法读取该属性，可能需要自己写一些重复的 get 方法，比如有些业务直接读取原生数据的 case 不多，更多的是读取衍生数据，那么用这种方法非常优雅。这里用哪种方法，要视业务情况而定，没有固定规定。

## Store 单实例

Store 规范不变。

View 规范如下：

```js
@connect < GlobalState > (state => state.a.b)
class View extends Component<Props> {}
```

## Store 动态实例

### 含义

Store 实例在运行时动态生成。比如一个 TODOList 的 TODOListItemStore。onedata 中每个 Tab 的 Store。由于，我们的全局 Store 树始终是静态的，因此这些动态实例，可以动态挂载在 静态树的叶子节点上。

```js
@observable
class TabStore extends BaseStore<TabStore> {
  sql = '';

  submitSql() {
    postSql.request({ sql: this.sql }).then(() => {
      message.success(...);
    }, e => {
      message.error(e.message || I18N.message.error);
    })
  }
}

@observable
class Tabs extends BaseStore<TabsProps> {
  tabItems = [] as TabStore[];

  createTab(tab: TabStore) {
    this.tabItems.push(tab);
  }
}

// 静态全局 Store 树：
const globalStore = {
  menu: MenuStore,
  header: HeaderStore,
  frame: FrameStore,
  tabs: TabStore
});

type GlobalStore = ReturnState<typeof globalStore>;
```

ReturnState 做了一件神奇的事情，转换之前，比如 menu 的类型是一个 Class 。转换之后，它是一个实例。可以通过源码了解一下原理。

### 规范

Store 规范不变。

View 规范如下：

区别是，connect 不需要任何参数。因为多实例的 Store 不应该绑定任何 store 示例，而是父级在 Props 中传入一个动态的 store，该 store 应该由对应的 Store 创建。

```js
@connect
class View extends Component<Props, xx> {
    render() {
        const { store } = this.props.store;

        return ...;
    }
}

<View store={new Store()}>
```

## 业务组件复用

### 怎样写可复用业务组件

```typescript
// 不需要 @observable
class MyStore extends BaseStore<Props> {
  // Store 逻辑不变
}

// 不需要 @connect
class MyView extends React.Component<Props, any> {
  // View 逻辑不变
}
```

### 如何复用组件

```typescript
@observable
export class AStore extends MyStore {
  // 特殊逻辑
}

const AView = connect<GlobalState>(state => state.a)(MyView);
```
