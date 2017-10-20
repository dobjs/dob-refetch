import * as React from 'react';
import connect, {
  BaseModel,
  BaseStore,
  Provider,
  observable,
  useDebug,
} from '../..';
import TodoItem, { TodoItemStore } from './TodoItem';

import StatusBar from './StatusBar';
import AddTodoItem from './AddTodoItem';
import { Status } from './define';
import { GlobalState } from './index';

export class TodoListProps {
  store?: TodoListStore;
}

@observable
export class TodoListStore extends BaseStore<TodoListProps> {
  todoList = [] as TodoItemStore[];

  get leftLength() {
    return this.todoList.filter(item => item.status === Status.active).length;
  }

  addTodoItem(text: string) {
    const todoItem = new TodoItemStore(text);

    this.todoList.push(todoItem);
  }

  status = Status.all;

  toggleStatus(status: Status) {}

  setAll() {}
}

@connect<GlobalState>(state => state.todoList)
export default class TodoList extends React.Component<TodoListProps, any> {
  render() {
    const { store } = this.props;

    return (
      <div>
        <AddTodoItem onAddItem={store.addTodoItem} onSetAll={store.setAll} />
        {store.todoList.map((todoItem, todoItemIndex) => {
          return <TodoItem store={todoItem} key={todoItemIndex} />;
        })}
        <StatusBar
          leftSize={store.leftLength}
          toggleStatus={store.toggleStatus}
        />
      </div>
    );
  }
}
