import { observable, Atom, Action } from 'dob';
import { Connect as DAConnect } from 'dob-react';
import * as React from 'react';
import { computedAsync } from './computedAsyncDO';
import { Provider as DobProvider } from 'dob-react';
import { injectFactory, inject } from 'dependency-inject';

const isCycle = Symbol('isCycle');

export class BaseStore<Props> {
  private getProps() {
    return {} as Props;
  }
  private init(props: Props) {}
}

let shouldUseDebug = false;

export function useDebug() {
  shouldUseDebug = true;
}

export class BaseModel<T> {
  public loading = true;
  public error: any;
  public data: T;
  private fetchData: () => Promise<T>;
  constructor(data: any, fetchData?: () => Promise<T>) {
    this.loading = false;
    this.data = data;
    this.fetchData = fetchData;
  }

  [isCycle]() {}
}

function bindStore(inst: any) {
  const tsMethods: any = Object.getPrototypeOf(inst);
  const methodNames = Object.getOwnPropertyNames(tsMethods);
  const filters = ['constructor'];

  const actionMap = methodNames
    .filter(str => filters.indexOf(str) < 0)
    .forEach(methodName => {
      if (inst[methodName].bind) {
        const originMethod = inst[methodName];

        function method(...args: any[]) {
          if (shouldUseDebug) {
            const argStrs = args.slice(0, originMethod.length).map(arg => {
              if (typeof arg === 'object') {
                return JSON.stringify(arg);
              }

              return String(arg);
            });
            console.groupCollapsed(
              '%c action ',
              'color: #03A9F4; font-weight: bold',
              `${inst.constructor.name}.${methodName}(${argStrs.join(', ')})`,
            );
            console.log(
              '%c prev state    ',
              'color: #9E9E9E; font-weight: bold',
              { ...inst },
            );
          }

          Action(() => originMethod.apply(inst, args));

          if (shouldUseDebug) {
            console.log(
              '%c prev state    ',
              'color: #4CAF50; font-weight: bold',
              { ...inst },
            );
            console.groupEnd();
          }
        }

        inst[methodName] = method;
      }
    });
}

const identity = (el: any) => el;

class ProviderProps {
  store: any;
}
export class Provider extends React.Component<ProviderProps> {
  render() {
    const finalStore: any = injectFactory(this.props.store);
    return React.createElement(DobProvider, {
      ...finalStore,
      children: this.props.children,
    });
  }
}

export { inject, observable };

export default function connect<GlobalState>(
  storeSelector: (state: GlobalState) => any,
): any {
  return function(WrappedComponent: any): any {
    return class extends React.Component<any, any> {
      static contextTypes: React.ValidationMap<any> = {
        router: React.PropTypes.func.isRequired,
        location: React.PropTypes.object.isRequired,
        dyStores: React.PropTypes.object,
      };
      store: any;
      FinalComp: any;

      componentWillMount() {
        const globalState = this.context.dyStores;
        const store = storeSelector(globalState);

        store.init(this.props);

        // 让 store 的 this 绑定 store 本身
        bindStore(store);

        store.getProps = () => {
          return this.props;
        };

        // 绑定 refetch
        Object.keys(store).forEach(propName => {
          const baseModel = store[propName];

          if (baseModel && baseModel[isCycle]) {
            store[propName] = computedAsync<string>(
              baseModel,
              baseModel.fetchData.bind(store),
            );
          }
        });

        // 绑定 store 和 state
        this.FinalComp = DAConnect({
          store,
          state: globalState,
        })(WrappedComponent);
      }

      render() {
        const FinalComp = this.FinalComp;
        const router = this.context.router;
        const location = this.context.location;

        return React.createElement(FinalComp, {
          router,
          location,
          ...this.props,
        });
      }
    };
  };
}
