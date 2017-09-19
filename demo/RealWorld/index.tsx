import * as React from 'react';
import * as ReactDOM from 'react-dom';
import connect, {
  BaseModel,
  BaseStore,
  Provider,
  observable,
  useDebug,
} from '../../';

useDebug();
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

  private fetchData() {
    // dependencies;
    const num = this.num;

    return mockFetch('I am response data');
  }
  data = new BaseModel<string>('', this.fetchData);
}

const globalState = {
  app: AppStore,
};
type GlobalState = typeof globalState;

@connect<GlobalState>(state => state.app)
class App extends React.Component<AppProps, any> {
  render() {
    const { store } = this.props;
    const data = store.data;

    return (
      <div>
        num: {store.num}
        <button onClick={store.addNum.bind(null, 3)}>addNum</button>
        {data.loading ? 'loading...' : data.data}
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
  document.getElementById('app'),
);
