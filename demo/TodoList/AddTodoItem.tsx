import * as React from 'react';
import connect, { BaseModel, BaseStore, Provider, observable, bindField } from '../../';
import { Input } from 'antd';
import { GlobalState } from './index';
import { MyBaseStore } from './utils';

export class AddTodoItemProps {
  store?: AddTodoItemStore;
  onSetAll: any;
  onAddItem: (text: string) => void;
}

function mockFetch(data: any, ttl = 300) {
  return new Promise<string>(resolve => {
    setTimeout(() => resolve(data + Math.random()), ttl);
  });
}

@observable
export class AddTodoItemStore extends MyBaseStore<AddTodoItemProps> {
  text = '';

  clearText() {
    this.text = '';
  }

  changeText(text: string) {
    this.text = text;
  }

  num = 3;

  changeNum() {
    this.num = this.num + 1;
  }

  todoListStore = this.inject(state => state.todoList);

  @bindField('data')
  fetchData(la = '32') {
    // dependencies;
    const text = this.num;
    const length = this.todoListStore.todoList.length;

    return mockFetch('I am response data' + la);
  }
  data = new BaseModel<string>('');
}

@connect<GlobalState>(state => state.addTodoItem)
export default class AddTodoItem extends React.Component<
AddTodoItemProps,
any
> {

  handlePressEnter() {
    const { store, onAddItem } = this.props;

    onAddItem(store.text);
    store.clearText();
  }

  render() {
    const { store } = this.props;
    const data = store.data;

    return (
      <div className="add-todo-item">
        {store.num}
        <span className="toggle-item" onClick={this.props.onSetAll}>
          toggle
        </span>
        {data.loading ? 'loading...' : data.data}
        <button onClick={store.changeNum}>sdf</button>
        <Input
          value={store.text}
          onChange={e => store.changeText(e.target.value)}
          onPressEnter={this.handlePressEnter.bind(this)}
        />
      </div>
    );
  }
}
