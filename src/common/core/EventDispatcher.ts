export interface Dictionary<T = any> {
  [key: string]: T;
}

const eventSplitter = /\s+/g;

export class EventDispatcherBinding {
  enabled: boolean = true;
  constructor(
    public id: number,
    public cb: Function | null,
    public event: string,
    public sharedList: EventDispatcherBinding[],
    public object: EventDispatcher<any> | null
  ) { }

  off() {
    if (this.object) {
      this.cb && this.object.off(this);
      this.cb = null;
      this.object = null;
      if (this.sharedList)
        delete this.sharedList;
    }
  }

  enable() {
    if (this.sharedList) {
      for (let i = 0; i < this.sharedList.length; i++)
        this.sharedList[i].enabled = true;
    } else this.enabled = true;
  }


  disable() {
    if (this.sharedList) {
      for (let i = 0; i < this.sharedList.length; i++) {
        this.sharedList[i].enabled = false;
      }
    } else {
      this.enabled = false;
    }
  }
}

function turnOffCallback(f: EventDispatcherBinding) {
  delete f.cb;
}

export interface EventDispatcherEventsBase {
  [key: string]: Function;
}

export class EventDispatcher<T = EventDispatcherEventsBase> {
  private ed_bindings: Dictionary<EventDispatcherBinding[]> = {};
  private ed_bindCount = 0;

  on<K extends keyof T>(event: K, callback: T[K], once?: boolean): EventDispatcherBinding;
  on(event: string, callback: (...args: any[]) => void, once?: boolean): EventDispatcherBinding;
  on(event: string, callback: any, once?: boolean): EventDispatcherBinding {
    this.ed_bindCount++;

    let events = event.split(eventSplitter);

    let bindList: EventDispatcherBinding[] = [];
    let latest: EventDispatcherBinding | null = null;

    for (let evt of events) {
      let tmp = new EventDispatcherBinding(
        this.ed_bindCount,
        null,
        evt,
        bindList,
        this
      );

      bindList && bindList.push(tmp);

      if (once) {
        tmp.cb = (function (this: EventDispatcher<T>) {
          callback.apply(this, arguments);
          tmp.cb = null;
        }).bind(this);
      } else {
        tmp.cb = callback.bind(this);
      }

      this.ed_bindings[evt] = this.ed_bindings[evt] || [];
      this.ed_bindings[evt].push(tmp);

      latest = tmp;
    }

    return latest as EventDispatcherBinding;
  }

  once<K extends keyof T>(event: K, callback: T[K]): EventDispatcherBinding;
  once(event: string, callback: Function): EventDispatcherBinding;
  once(event: string, callback: any) {
    return this.on(event, callback, true);
  }

  off(binding: EventDispatcherBinding): void;
  off(eventName: string, boundCallback?: Function): void;
  off(boundCallback: Function): void;
  off(arg0?: string | Function | EventDispatcherBinding, arg1?: Function): void {
    if (arguments.length == 0) {
      for (let i in this.ed_bindings) {
        for (let e in this.ed_bindings[i])
          delete this.ed_bindings[i][e].cb;
        this.ed_bindings[i].length = 0;
      }

    } else if (arg0 instanceof EventDispatcherBinding) {
      arg0.cb = null;
      arg0.sharedList && arg0.sharedList.length && arg0.sharedList.forEach(turnOffCallback);
    } else if (typeof arg0 === 'string') {
      if (typeof arg1 == 'function') {
        for (let i in this.ed_bindings[arg0]) {
          if (this.ed_bindings[arg0][i].cb === arg1) {
            this.ed_bindings[arg0][i].cb = null;
          }
        }
      } else if (typeof arg0 == 'string') {
        this.ed_bindings[arg0 as string] = [];
      }
    } else if (typeof arg0 === 'function') {
      for (let evt in this.ed_bindings) {
        for (let i in this.ed_bindings[evt]) {
          if (this.ed_bindings[evt][i].cb === arg0) {
            this.ed_bindings[evt][i].cb = null;
          }
        }
      }
    }
  }

  emit(event: 'error', error: any): void;
  emit<K extends keyof T>(event: K, ...params: any[]): void;
  emit(event: string, ...params: any[]): void;
  emit(event: string) {
    if (event in this.ed_bindings) {

      if (arguments.length == 1) {
        for (let i = 0; i < this.ed_bindings[event].length; i++) {
          let e = this.ed_bindings[event][i];
          e && e.cb && e.enabled && e.cb();
        }
      } else if (arguments.length == 2) {
        for (let i = 0; i < this.ed_bindings[event].length; i++) {
          let e = this.ed_bindings[event][i];
          e && e.cb && e.enabled && e.cb(arguments[1]);
        }
      } else if (arguments.length == 3) {
        for (let i = 0; i < this.ed_bindings[event].length; i++) {
          let e = this.ed_bindings[event][i];
          e && e.cb && e.enabled && e.cb(arguments[1], arguments[2]);
        }
      } else if (arguments.length == 4) {
        for (let i = 0; i < this.ed_bindings[event].length; i++) {
          let e = this.ed_bindings[event][i];
          e && e.cb && e.enabled && e.cb(arguments[1], arguments[2], arguments[3]);
        }
      } else if (arguments.length == 5) {
        for (let i = 0; i < this.ed_bindings[event].length; i++) {
          let e = this.ed_bindings[event][i];
          e && e.cb && e.enabled && e.cb(arguments[1], arguments[2], arguments[3], arguments[4]);
        }
      } else if (arguments.length > 4) {
        let args = Array.prototype.slice.call(arguments, 1);

        for (let i = 0; i < this.ed_bindings[event].length; i++) {
          let e = this.ed_bindings[event][i];
          e && e.cb && e.enabled && e.cb.apply(this, args);
        }
      }
    } else if (event === 'error') {
      console.error('EventDispatcher: Unhandled error event', arguments);

      if (arguments[1] instanceof Error) {
        throw arguments[1];
      }

      if (typeof arguments[1] == 'string') {
        throw new Error(arguments[1]);
      }

      throw arguments[1];
    }
  }
}
