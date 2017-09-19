"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dob_1 = require("dob");
exports.observable = dob_1.observable;
const dob_react_1 = require("dob-react");
const React = require("react");
const computedAsyncDO_1 = require("./computedAsyncDO");
const dob_react_2 = require("dob-react");
const dependency_inject_1 = require("dependency-inject");
exports.inject = dependency_inject_1.inject;
const isCycle = Symbol('isCycle');
class BaseStore {
    getProps() {
        return {};
    }
    init(props) { }
}
exports.BaseStore = BaseStore;
let shouldUseDebug = false;
function useDebug() {
    shouldUseDebug = true;
}
exports.useDebug = useDebug;
class BaseModel {
    constructor(data, fetchData) {
        this.loading = true;
        this.loading = false;
        this.data = data;
        this.fetchData = fetchData;
    }
    [isCycle]() { }
}
exports.BaseModel = BaseModel;
function bindStore(inst) {
    const tsMethods = Object.getPrototypeOf(inst);
    const methodNames = Object.getOwnPropertyNames(tsMethods);
    const filters = ['constructor'];
    const actionMap = methodNames
        .filter(str => filters.indexOf(str) < 0)
        .forEach(methodName => {
        if (inst[methodName].bind) {
            const originMethod = inst[methodName];
            function method(...args) {
                if (shouldUseDebug) {
                    const argStrs = args.slice(0, originMethod.length).map(arg => {
                        if (typeof arg === 'object') {
                            return JSON.stringify(arg);
                        }
                        return String(arg);
                    });
                    console.groupCollapsed('%c action ', 'color: #03A9F4; font-weight: bold', `${inst.constructor.name}.${methodName}(${argStrs.join(', ')})`);
                    console.log('%c prev state    ', 'color: #9E9E9E; font-weight: bold', Object.assign({}, inst));
                }
                dob_1.Action(() => originMethod.apply(inst, args));
                if (shouldUseDebug) {
                    console.log('%c prev state    ', 'color: #4CAF50; font-weight: bold', Object.assign({}, inst));
                    console.groupEnd();
                }
            }
            inst[methodName] = method;
        }
    });
}
const identity = (el) => el;
class ProviderProps {
}
class Provider extends React.Component {
    render() {
        const finalStore = dependency_inject_1.injectFactory(this.props.store);
        return React.createElement(dob_react_2.Provider, Object.assign({}, finalStore, { children: this.props.children }));
    }
}
exports.Provider = Provider;
function connect(storeSelector) {
    return function (WrappedComponent) {
        return _a = class extends React.Component {
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
                            store[propName] = computedAsyncDO_1.computedAsync(baseModel, baseModel.fetchData.bind(store));
                        }
                    });
                    // 绑定 store 和 state
                    this.FinalComp = dob_react_1.Connect({
                        store,
                        state: globalState,
                    })(WrappedComponent);
                }
                render() {
                    const FinalComp = this.FinalComp;
                    const router = this.context.router;
                    const location = this.context.location;
                    return React.createElement(FinalComp, Object.assign({ router,
                        location }, this.props));
                }
            },
            _a.contextTypes = {
                router: React.PropTypes.func.isRequired,
                location: React.PropTypes.object.isRequired,
                dyStores: React.PropTypes.object,
            },
            _a;
        var _a;
    };
}
exports.default = connect;
