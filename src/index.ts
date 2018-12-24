import { observable, Atom, Action, inject, combineStores, observe } from 'dob';
import { Connect as DAConnect, Provider as DobProvider } from 'dob-react';
import { computedAsync } from './computedAsyncDO';
import * as React from 'react';
import * as PropTypes from 'prop-types';

const InjectedSymbol = Symbol('Injected');

export class BaseStore<Props> {
  public getProps() {
    return {} as Props;
  }

  public reset() {
    const instInitialize = new (this as any).__proto__.constructor();

    Object.keys(this).forEach(property => {
      if (typeof (this as any)[property] !== 'function') {
        (this as any)[property] = instInitialize[property];
      }
    });
  }

  public a: string;

  public inject<T>(mapper: (state: any) => T) {
    return (new Injected(mapper) as any) as T;
  }
}

export class BaseModel<T> {
  public loading = true;
  public error: any;
  public data: T;
  private fetchData: () => Promise<T>;
  constructor(data: T, fetchData?: (...args: any[]) => Promise<T>) {
    this.loading = false;
    this.data = data;
    this.fetchData = fetchData;
  }
}

export function bindStore(inst: any) {
  const tsMethods: any = Object.getPrototypeOf(inst);
  const methodNames = Object.getOwnPropertyNames(tsMethods);
  const filters = ['constructor'];

  const actionMap = methodNames
    .filter(str => filters.indexOf(str) < 0)
    .forEach(methodName => {
      if (inst[methodName] && inst[methodName].bind) {
        inst[methodName] = inst[methodName].bind(inst);
      }
    });
}

const identity = (el: any) => el;

class ProviderProps {
  store: any;
}
export class Provider extends React.Component<ProviderProps> {
  render() {
    const finalStore: any = combineStores(this.props.store);
    return React.createElement(DobProvider as any, {
      ...finalStore,
      children: this.props.children
    });
  }
}

export const bindField = (field: string, autoFetch = true) => (
  target,
  propertyKey: string
) => {
  if (!target.bindFields) {
    target.bindFields = {};
  }
  if (!target.autoFetchMap) {
    target.autoFetchMap = {};
  }
  target.bindFields[propertyKey] = field;
  target.autoFetchMap[propertyKey] = autoFetch;
};

function handleFetch(promise, target) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      Action(() => {
        target.loading = true;
        target.error = false;
      });

      Promise.resolve(promise).then(
        data => {
          Action(() => {
            target.data = data;
            target.loading = false;
            target.error = false;
          });
          resolve(data);
        },
        e => {
          Action(() => {
            target.loading = false;
            target.error = e;
          });
          reject(e);
        }
      );
    });
  });
}

function DObservable<T extends { new (...args: any[]): {} }>(
  target: T = {} as any
): T {
  return class extends observable(target) {
    bindFields: any;
    constructor(...args: any[]) {
      super(...args);
      bindStore(this);

      if (this.bindFields) {
        const propertyKeys = Object.keys(this.bindFields) || [];

        propertyKeys.forEach(propertyKey => {
          const bundField = this.bindFields[propertyKey];
          if (!(this[bundField] instanceof BaseModel)) {
            throw new Error(
              `${
                target.name
              } 中 ${bundField} 被 ${propertyKey}方法绑定，但不是 BaseModel 的实例`
            );
          }
          const originFetchMethod = this[propertyKey].bind(this);

          this[propertyKey] = (...args) => {
            let result = null;
            this[bundField].unobserve = observe(() => {
              result = handleFetch(originFetchMethod(...args), this[bundField]);
            }).unobserve;

            return Promise.resolve(result);
          };
        });
      }
    }
  };
}

type BaseConstructor<T> = new (...args: any[]) => T;

type DictionaryOfConstructors<T> = {
  [K in keyof T]: BaseConstructor<T[K]> | DictionaryOfConstructors<T[K]>
};

type ReturnState<StoreMap> = {
  [key in keyof StoreMap]: StoreMap[key] extends new (...args: any[]) => infer R
    ? R
    : ReturnState<StoreMap[key]>
};

export { inject, DObservable as observable, ReturnState };

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

class Injected {
  [InjectedSymbol]() {}

  mapper;
  constructor(mapper) {
    this.mapper = mapper;
  }
}

export default function connect(
  target: any,
  propertyKey?: string,
  descriptor?: PropertyDescriptor
): any;
export default function connect<GlobalState>(
  storeSelector: (state: GlobalState) => any
): any;
export default function connect(target?: any): any {
  if (isReactFunction(target)) {
    return DAConnect(target);
  }

  const storeSelector = target;

  return function(WrappedComponent: any): any {
    return class extends React.Component<any, any> {
      static contextTypes: React.ValidationMap<any> = {
        router: PropTypes.func.isRequired,
        location: PropTypes.object.isRequired,
        dyStores: PropTypes.object
      };
      store: any;
      FinalComp: any;

      componentWillMount() {
        const globalState = this.context.dyStores;
        const store = storeSelector(globalState);

        Object.keys(store).forEach(propName => {
          const { [propName]: value } = store;
          if (value && value[InjectedSymbol]) {
            store[propName] = value.mapper(globalState);
          }
        });

        if (store.init) {
          store.init(this.props);
        }

        store.getProps = () => {
          return this.props;
        };

        // store.getState = () => globalState;

        // 绑定 refetch
        Object.keys(store).forEach(propName => {
          const baseModel = store[propName];

          if (baseModel instanceof BaseModel) {
            if ((baseModel as any).fetchData) {
              store[propName] = computedAsync(
                baseModel,
                (baseModel as any).fetchData.bind(store)
              );
            } else if (store.bindFields && store.autoFetchMap) {
              const fetchName = Object.keys(store).find(
                key => store.bindFields[key] === propName
              );
              if (store.autoFetchMap[fetchName]) {
                store[fetchName]();
              }
            }
          }
        });

        // 绑定 store 和 state
        this.FinalComp = DAConnect({
          store
        })(WrappedComponent);
      }

      componentWillUnmount() {
        const globalState = this.context.dyStores;
        const store = storeSelector(globalState);
        Object.keys(store).forEach(propName => {
          const baseModel = store[propName];

          if (baseModel instanceof BaseModel) {
            if (store.bindFields && store.autoFetchMap) {
              if (store[propName].unobserve) {
                store[propName].unobserve();
              }
            }
          }
        });
      }

      render() {
        const FinalComp = this.FinalComp;
        const router = this.context.router;
        const location = this.context.location;

        return React.createElement(FinalComp, {
          router,
          location,
          ...this.props
        });
      }
    };
  };
}
