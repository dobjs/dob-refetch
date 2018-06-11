import * as React from "react";
import connect, {
  BaseModel,
  BaseStore,
  Provider,
  observable
} from "../../src/index";
import { Status } from "./define";
const classNames = require("classnames");
import { GlobalState } from "./index";

export class StatusBarProps {
  store?: StatusBarStore;
  leftSize: number;
  toggleStatus: (status: Status) => void;
}

@observable
export class StatusBarStore extends BaseStore<StatusBarProps> {
  status = Status.all;

  toggleStatus(status: Status) {
    this.status = status;
  }
}

const STATUS_ITEMS = [
  {
    text: "All",
    value: Status.all
  },
  {
    text: "Active",
    value: Status.active
  },
  {
    text: "Completed",
    value: Status.completed
  }
];

@connect<GlobalState>(state => state.statusBar)
export default class StatusBar extends React.Component<StatusBarProps, any> {
  handleToggle(status: Status) {
    const { toggleStatus, store } = this.props;

    toggleStatus(status);
    store.toggleStatus(status);
  }

  renderStatusItem(item: typeof STATUS_ITEMS[0]) {
    const { store } = this.props;
    const className = classNames("status-item", store.status);

    return (
      <div
        className={className}
        key={item.value}
        onClick={this.handleToggle.bind(this, item.value)}
      >
        {item.text}
      </div>
    );
  }

  render() {
    const { store, leftSize } = this.props;

    return (
      <div className="status-bar">
        <span className="left-size">{leftSize} items left</span>
        <div className="statu-switchs">
          {STATUS_ITEMS.map(item => this.renderStatusItem(item))}
        </div>
      </div>
    );
  }
}
