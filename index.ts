import { observable, Atom, Action } from 'dob';
import { Connect as DAConnect } from 'dob-react';
import * as React from 'react';
import { computedAsync } from './computedAsyncDO';
import { Provider as DobProvider } from 'dob-react';
import { injectFactory, inject } from 'dependency-inject';

const isCycle = Symbol('isCycle');

export class BaseStore<Props> {
  protected getProps() {
    return {} as Props;
  }

  public reset() {
    const instInitialize = new (this as any).__proto__.constructor();

    Object.keys(this).forEach(property => {
      if (typeof this[property] !== 'function') {
        this[property] = instInitialize[property];
      }
    });
  }
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
  constructor(data: any, fetchData?: (...args: any[]) => Promise<T>) {
    this.loading = false;
    this.data = data;
    this.fetchData = fetchData;
  }

  [isCycle]() {}
}

function getValue(inst: any) {
  return Object.keys(inst)
    .filter(key => {
      return typeof inst[key] !== 'function';
    })
    .reduce((result, key) => {
      return {
        ...result,
        [key]: inst[key],
      };
    }, {});
}

export function bindStore(inst: any) {
  const tsMethods: any = Object.getPrototypeOf(inst);
  const methodNames = Object.getOwnPropertyNames(tsMethods);
  const filters = ['constructor'];

  const actionMap = methodNames
    .filter(str => filters.indexOf(str) < 0)
    .forEach(methodName => {
      if (inst[methodName] && inst[methodName].bind) {
        const originMethod = inst[methodName];

        const method = (...args: any[]) => {
          if (shouldUseDebug) {
            console.log(
              '%c action ',
              'color: #03A9F4; font-weight: bold',
              `${inst.constructor.name}.${methodName}`,
              ...args.slice(0, originMethod.length),
            );
            console.log(
              '%c prev state    ',
              'color: #9E9E9E; font-weight: bold',
              getValue(inst),
            );
          }

          Action(() => originMethod.apply(inst, args));

          if (shouldUseDebug) {
            console.log(
              '%c next state    ',
              'color: #4CAF50; font-weight: bold',
              getValue(inst),
            );
          }
        };

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

function DObservable<T extends { new (...args: any[]): {} }>(
  target: T = {} as any,
): T {
  return class extends observable(target) {
    constructor(...args: any[]) {
      super(...args);
      bindStore(this);
    }
  };
}

type BaseConstructor<T> = new () => T;

type DictionaryOfConstructors<T> = {
  [K in keyof T]: BaseConstructor<T[K]> | T[K]
};

function fixStoreType<T>(stores: DictionaryOfConstructors<T>): T {
  return (stores as any) as T;
}

export { inject, DObservable as observable, fixStoreType };

function isReactFunction(obj: any) {
  if (typeof obj === 'function') {
    if (
      (obj.prototype && obj.prototype.render) ||
      obj.isReactClass ||
      React.Component.isPrototypeOf(obj)
    ) {
      return true;
    }
  }

  return false;
}

export default function connect(WrappedComponent: any): any;
export default function connect<GlobalState>(
  storeSelector: (state: GlobalState) => any,
): any;
export default function connect(target?: any): any {
  if (isReactFunction(target)) {
    return DAConnect(target);
  }

  const storeSelector = target;

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

        if (store.init) {
          store.init(this.props);
        }

        // // 让 store 的 this 绑定 store 本身
        // bindStore(store);

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
