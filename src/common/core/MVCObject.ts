import { EventDispatcherBinding, EventDispatcher, Dictionary } from "./EventDispatcher";

export const MVCOBJECT_VALIDATOR_SYMBOL = Symbol("mvcobject-validators");

export interface IMVCObjectEvents {
  /** Triggered when the method setValues is called */
  setValues: (newValues: any) => any;
  /** Triggered when a value is setted */
  valueChanged: (key: string, newValue, prevValue) => void;
}

export class MVCObject extends EventDispatcher {
  static Exception_RollbackOperation = new Error("The change operation has been rolled back");
  static Exception_PreventPropagation = new Error("The propagation events has been aborted");

  protected data: Dictionary<any> = {};

  constructor(args?) {
    super();
    args && this.setValues(args);
  }

  getAll() { return Object.create(this.data); }

  setValues(values: any | MVCObject, emit?: boolean) {
    if (values instanceof MVCObject) {
      values = values.getAll();
    }

    for (let i in values) {
      this.set(i, values[i], !emit);
    }

    this.emit('setValues', this.data, values);
  }

  set(field: string, value: any, preventPropagation?: boolean) {
    if (typeof field === "undefined") return;

    let viejo = this.data[field];

    let _preventPropagation = false;

    this.data[field] = value;

    let ch = field + '_changed';
    let result;

    if (MVCOBJECT_VALIDATOR_SYMBOL in this && field in this[MVCOBJECT_VALIDATOR_SYMBOL]) {
      let array = this[MVCOBJECT_VALIDATOR_SYMBOL][field];
      for (let i = 0; i < array.length; i++) {
        let validator = array[i];

        try {
          if (validator instanceof ModelValidator) {
            result = (validator as ModelValidator).validate(value, viejo);
          } else {
            result = validator(value, viejo);
          }

          if (typeof result !== "undefined") {
            value = this.data[field] = result;
          }
        } catch (e) {
          if (e === MVCObject.Exception_RollbackOperation) {
            this.data[field] = viejo;
            return;
          } else if (e === MVCObject.Exception_PreventPropagation)
            _preventPropagation = true;
          else
            throw e;
        }
      }
    }

    if (ch in this && typeof this[ch] === 'function') {
      try {
        result = this[ch](value, viejo);
      } catch (e) {
        if (e === MVCObject.Exception_RollbackOperation) {
          this.data[field] = viejo;
          return;
        } else if (e === MVCObject.Exception_PreventPropagation)
          _preventPropagation = true;
        else
          throw e;
      }
    }

    if (_preventPropagation)
      return;

    if (typeof result !== "undefined") {
      value = this.data[field] = result;
    }

    this.emit(ch, this.data[field], viejo);

    !preventPropagation && this.emit('valueChanged', this.data, field, this.data[field], viejo);
  }

  get(field: string) {
    return this.data[field];
  }

  touch(fieldName: string) {
    this.set(fieldName, this.get(fieldName));
  }

  toJSON() {
    return this.getAll();
  }
}

export class ModelValidator {
  constructor(private target: MVCObject, private propertyKey: string | symbol, public props: any) {

  }

  validate(newVal, prevVal) {
    return newVal;
  }
}



export namespace MVCObject {
  export interface IModelValidator {
    <T>(newVal: T, prevVal: T): T;
  }

  export type TModelValidator = IModelValidator | ModelValidator;

  export function proxy(target: MVCObject, propertyKey: string | symbol) {
    if (delete target[propertyKey]) {
      Object.defineProperty(target, propertyKey.toString(), {
        get: function () {
          return this.data[propertyKey];
        },
        set: function (value) {
          this.set(propertyKey, value);
        },
        enumerable: true
      });
    }
  }

  export function ModelProp(props: {
    validators: TModelValidator[],
    /** If the assigned value is a MVCObject, then we listen the changes in the inner props */
    deep?: boolean;
  }) {
    return function (target: MVCObject, propertyKey: string | symbol) {
      if (delete target[propertyKey]) {
        if (!target[MVCOBJECT_VALIDATOR_SYMBOL]) {
          target[MVCOBJECT_VALIDATOR_SYMBOL] = {};
        }

        // ensure list
        let list: TModelValidator[] = target[MVCOBJECT_VALIDATOR_SYMBOL][propertyKey] = target[MVCOBJECT_VALIDATOR_SYMBOL][propertyKey] || [];
        target[MVCOBJECT_VALIDATOR_SYMBOL][propertyKey] = list.concat(props.validators);

        Object.defineProperty(target, propertyKey.toString(), {
          get: function () {
            return this.data[propertyKey];
          },
          set: function (value) {
            this.set(propertyKey, value);
          },
          enumerable: true
        });
      }
    };
  }

  export function proxyDeep(target: MVCObject, propertyKey: string | symbol) {
    if (delete target[propertyKey]) {
      let listener: EventDispatcherBinding = null;
      Object.defineProperty(target, propertyKey.toString(), {
        get: function () {
          return this.data[propertyKey];
        },
        set: function (value) {
          if (listener && listener.object == value) {
            this.set(propertyKey, value);
          } else {
            listener && listener.off();

            if (value instanceof MVCObject) {
              listener = value.on('valueChanged', () => this.touch(propertyKey));
            } else {
              listener = null;
            }
          }
        },
        enumerable: true
      });
    }
  }
}
