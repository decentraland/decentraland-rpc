import {
  registerComponent,
  Component,
  ComponentOptions,
  exposeMethod
} from '../../lib/host'
import { testInWorker } from './support/Helpers'

@registerComponent('Greeter')
export class Greeter extends Component {
  greet(name: string) {
    return `Hello ${name}`
  }
}

@registerComponent('Instancer')
export class Instancer extends Component {
  private Greeter: Greeter

  constructor(options: ComponentOptions) {
    super(options)
    this.Greeter = this.options.getComponentInstance(Greeter)
  }

  @exposeMethod
  async doSomething() {
    return this.Greeter.greet('World')
  }
}

describe('Intance a Component from another Component', function() {
  testInWorker('test/out/9.ComponentInstancing.js', {
    plugins: [Instancer],
    log: true
  })
})
