import { Server } from "../common/json-rpc/Server";

export class ScriptingHost {
  async loadScript(url: string) {
    const worker = new Worker(url);

    return new Server(worker);
  }
}

export namespace ScriptingHost {

}
