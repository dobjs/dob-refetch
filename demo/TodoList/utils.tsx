import connect, { BaseStore } from "../../index";
import { GlobalState } from "./index";
import { globalState } from "dependency-inject/built/utils";

export class MyBaseStore<Props> extends BaseStore<Props> {
  inject<T>(mapper: (state: GlobalState) => T) {
    return super.inject(mapper);
  }
}

export function myConnect(state: GlobalState, ...args) {
  return connect(state, ...args);
}
