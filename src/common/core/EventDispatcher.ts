export interface Dictionary<T = any> {
  [key: string]: T;
}

let eventSplitter = /\s+/g;

export class EventDispatcherBinding {
  id: number;
  cb;
  event: string;
  sharedList: EventDispatcherBinding[];
  object: EventDispatcher;
  enabled: boolean = true;

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
      for (let i = 0; i < this.sharedList.length; i++)
        this.sharedList[i].enabled = false;
    } else this.enabled = false;
  }
}

function turnOffCallback(f) {
  delete f.cb;
}

export class EventDispatcher {
  static EVENTS = {};

  private ed_bindeos: Dictionary<EventDispatcherBinding[]> = {};
  private ed_bindCount = 0;

  on(event: string, callback: Function, once?: boolean): EventDispatcherBinding {
    this.ed_bindCount++;

    let events = event.split(eventSplitter);

    let tmp: EventDispatcherBinding;
    let bindList = [];

    events.forEach(evt => {
      tmp = new EventDispatcherBinding();
      tmp.id = this.ed_bindCount;
      tmp.cb = null;
      tmp.event = evt;
      tmp.sharedList = bindList;
      tmp.object = this;

      bindList && bindList.push(tmp);

      if (once) {
        tmp.cb = function () {
          callback.apply(this, arguments);
          tmp.cb = null;
        };
      } else {
        tmp.cb = callback;
      }

      tmp.cb = tmp.cb.bind(this);

      this.ed_bindeos[evt] = this.ed_bindeos[evt] || [];
      this.ed_bindeos[evt].push(tmp);
    });

    return tmp;
  }

  once(event: string, callback: Function) {
    return this.on(event, callback, true);
  }

  off(bindeo?: string | Function | EventDispatcherBinding, callback?: Function) {
    if (arguments.length == 0) {
      for (let i in this.ed_bindeos) {
        for (let e in this.ed_bindeos[i])
          delete this.ed_bindeos[i][e].cb;
        this.ed_bindeos[i].length = 0;
      }

    } else if (bindeo instanceof EventDispatcherBinding) {
      bindeo.cb = null;
      bindeo.sharedList && bindeo.sharedList.length && bindeo.sharedList.forEach(turnOffCallback);
    } else if (typeof bindeo === 'string') {
      if (typeof callback == 'function') {
        for (let i in this.ed_bindeos[bindeo]) {
          if (this.ed_bindeos[bindeo][i].cb === callback) {
            this.ed_bindeos[bindeo][i].cb = null;
          }
        }
      } else if (typeof bindeo == 'string') {
        this.ed_bindeos[bindeo as string] = [];
      }
    } else if (typeof bindeo === 'function') {
      for (let evt in this.ed_bindeos) {
        for (let i in this.ed_bindeos[evt]) {
          if (this.ed_bindeos[evt][i].cb === bindeo) {
            this.ed_bindeos[evt][i].cb = null;
          }
        }
      }
    }
  }

  // cleanup the disposed events
  protected cleanupTurnedOffEvents() {
    for (let evt in this.ed_bindeos) {
      let list = [];
      for (let i in this.ed_bindeos[evt]) {
        if (this.ed_bindeos[evt][i] && this.ed_bindeos[evt][i] instanceof EventDispatcherBinding && this.ed_bindeos[evt][i].cb) {
          list.push(this.ed_bindeos[evt]);
        }
      }
      this.ed_bindeos[evt] = list;
    }
  }

  emit(event: string, ...params: any[]);
  emit(event: string) {
    if (event in this.ed_bindeos) {

      if (arguments.length == 1) {
        for (let i = 0; i < this.ed_bindeos[event].length; i++) {
          let e = this.ed_bindeos[event][i];
          e && e.cb && e.enabled && e.cb();
        }
      } else if (arguments.length == 2) {
        for (let i = 0; i < this.ed_bindeos[event].length; i++) {
          let e = this.ed_bindeos[event][i];
          e && e.cb && e.enabled && e.cb(arguments[1]);
        }
      } else if (arguments.length == 3) {
        for (let i = 0; i < this.ed_bindeos[event].length; i++) {
          let e = this.ed_bindeos[event][i];
          e && e.cb && e.enabled && e.cb(arguments[1], arguments[2]);
        }
      } else if (arguments.length == 4) {
        for (let i = 0; i < this.ed_bindeos[event].length; i++) {
          let e = this.ed_bindeos[event][i];
          e && e.cb && e.enabled && e.cb(arguments[1], arguments[2], arguments[3]);
        }
      } else if (arguments.length == 5) {
        for (let i = 0; i < this.ed_bindeos[event].length; i++) {
          let e = this.ed_bindeos[event][i];
          e && e.cb && e.enabled && e.cb(arguments[1], arguments[2], arguments[3], arguments[4]);
        }
      } else if (arguments.length > 4) {
        let args = Array.prototype.slice.call(arguments, 1);

        for (let i = 0; i < this.ed_bindeos[event].length; i++) {
          let e = this.ed_bindeos[event][i];
          e && e.cb && e.enabled && e.cb.apply(this, args);
        }
      }
    }
  }
}
