import * as React from 'react';
import connect, { BaseModel, BaseStore, Provider, observable } from '../../';
import { Input } from 'antd';
import { GlobalState } from './index';

export class AddTodoItemProps {
  store?: AddTodoItemStore;
  onSetAll: any;
  onAddItem: (text: string) => void;
}

@observable
export class AddTodoItemStore extends BaseStore<AddTodoItemProps> {
  text = '';

  clearText() {
    this.text = '';
  }

  changeText(text: string) {
    this.text = text;
  }
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

    return (
      <div className="add-todo-item">
        <span className="toggle-item" onClick={this.props.onSetAll}>
          toggle
        </span>
        <Input
          value={store.text}
          onChange={e => store.changeText(e.target.value)}
          onPressEnter={this.handlePressEnter.bind(this)}
        />
      </div>
    );
  }
}
