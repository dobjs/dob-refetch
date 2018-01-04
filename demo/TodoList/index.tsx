import { AddTodoItemStore } from './AddTodoItem';
import TodoList, { TodoListStore } from './TodoList';
import * as ReactDOM from 'react-dom';
import * as React from 'react';
import { Provider, fixStoreType, BaseStore } from '../../';
import { StatusBarStore } from './StatusBar';
import { globalState } from '_dob@2.5.7@dob';

const globalStore = fixStoreType({
  addTodoItem: AddTodoItemStore,
  todoList: TodoListStore,
  statusBar: StatusBarStore,
});

export type GlobalState = typeof globalStore;

ReactDOM.render(
  <Provider store={globalStore}>
    <TodoList />
  </Provider>,
  document.getElementById('app'),
);
