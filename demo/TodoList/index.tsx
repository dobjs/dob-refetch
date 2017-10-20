import { AddTodoItemStore } from './AddTodoItem';
import TodoList, { TodoListStore } from './TodoList';
import * as ReactDOM from 'react-dom';
import * as React from 'react';
import { Provider } from '../../';
import { StatusBarStore } from './StatusBar';

const globalStore = {
  addTodoItem: AddTodoItemStore,
  todoList: TodoListStore,
  statusBar: StatusBarStore,
};

export type GlobalState = typeof globalStore;

ReactDOM.render(
  <Provider store={globalStore}>
    <TodoList />
  </Provider>,
  document.getElementById('app'),
);
