import connect, { BaseStore } from "../../src/index";
import { GlobalState } from "./index";

export class MyBaseStore<Props> extends BaseStore<Props> {
  inject<T>(mapper: (state: GlobalState) => T) {
    return super.inject(mapper);
  }
}

export function myConnect(state: GlobalState, ...args) {
  return connect(
    state,
    ...args
  );
}
