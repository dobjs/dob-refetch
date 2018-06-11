import { AddTodoItemStore } from "./AddTodoItem";
import TodoList, { TodoListStore } from "./TodoList";
import * as ReactDOM from "react-dom";
import * as React from "react";
import { Provider, BaseStore, ReturnState } from "../../src/index";
import { StatusBarStore } from "./StatusBar";

const globalStore = {
  addTodoItem: AddTodoItemStore,
  todoList: TodoListStore,
  statusBar: StatusBarStore
};

export type GlobalState = ReturnState<typeof globalStore>;

ReactDOM.render(
  <Provider store={globalStore}>
    <TodoList />
  </Provider>,
  document.getElementById("app")
);
