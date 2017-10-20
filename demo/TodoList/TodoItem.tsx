import * as React from 'react';
import connect, {
  BaseModel,
  BaseStore,
  Provider,
  observable,
  useDebug,
} from '../../';
import { Status } from './define';
import { Checkbox } from 'antd';
import { Connect } from 'dob-react';
const classNames = require('classnames');

export class TodoItemProps {
  store: TodoItemStore;
}

@observable
export class TodoItemStore extends BaseStore<TodoItemProps> {
  status = Status.active;
  text = '';

  obj = {
    key: 0,
  };

  constructor(text: string) {
    super();
    this.text = text;
  }

  changeStatus() {
    if (this.status === Status.active) {
      this.status = Status.completed;
    } else {
      this.status = Status.active;
    }
  }
}

@Connect
export default class TodoItem extends React.Component<TodoItemProps, any> {
  render() {
    const { store } = this.props;
    const className = classNames('pull-left', {
      completed: store.status === Status.completed,
    });

    return (
      <div className="clearfix">
        <div className="pull-left">
          <Checkbox
            checked={store.status === Status.completed}
            onChange={store.changeStatus}
          />
        </div>
        <div className={className}>{store.text}</div>
      </div>
    );
  }
}
