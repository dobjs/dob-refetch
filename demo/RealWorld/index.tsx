import * as React from "react";
import * as ReactDOM from "react-dom";
import connect, {
  BaseModel,
  BaseStore,
  Provider,
  observable,
  bindField,
  ReturnState
} from "../../src/index";
import { Input } from "antd";

class AppProps {
  store?: AppStore;
}

function mockFetch(data: any, ttl = 3000) {
  return new Promise<string>(resolve => {
    setTimeout(() => resolve(data + Math.random()), ttl);
  });
}

@observable
class AppStore extends BaseStore<AppProps> {
  num = 1;

  addNum(num: number) {
    this.num = this.num + num;
  }

  text = "";

  changeText(text: string) {
    this.text = text;
  }

  @bindField("data")
  private fetchData() {
    // dependencies;
    const num = this.num;

    return mockFetch("I am response data");
  }
  data = new BaseModel("");
}

class OtherStore extends BaseStore<any> {}

const globalState = {
  app: AppStore,
  other: OtherStore
};
type GlobalState = ReturnState<typeof globalState>;

@connect<GlobalState>(state => state.other)
class Other extends React.Component<any, any> {
  render() {
    const { store } = this.props;

    return <div />;
  }
}

@connect<GlobalState>(state => state.app)
class App extends React.Component<AppProps, any> {
  render() {
    const { store } = this.props;
    const data = store.data;

    return (
      <div>
        num: {store.num}
        <Input
          value={store.text}
          onChange={e => store.changeText(e.target.value)}
        />
        <button onClick={store.addNum.bind(null, 3)}>addNum</button>
        {data.loading ? "loading..." : data.data}
        <Other />
      </div>
    );
  }
}

ReactDOM.render(
  <Provider store={globalState}>
    <div>
      <App />
    </div>
  </Provider>,
  document.getElementById("app")
);
