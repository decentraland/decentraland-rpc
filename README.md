Archived. Evolved into https://github.com/decentraland/rpc

---

[![CircleCI](https://circleci.com/gh/decentraland/metaverse-rpc.svg?style=svg&circle-token=33a7ab6330a3c900c456c0367c118d912e48f484)](https://circleci.com/gh/decentraland/metaverse-rpc).
[![Build status](https://ci.appveyor.com/api/projects/status/v2ql8549rfh311go/branch/master?svg=true)](https://ci.appveyor.com/project/decentraland/metaverse-rpc/branch/master)

# `decentraland-rpc`

This repository contains the low-level API that runs the sandboxed code for Decentralands LANDs.

## Scripting

Scripts are pieces of logic that run inside the context of a Web Worker. Although it's not currently used in the Decentraland specification, it also supports scenes remotely run on a server. The scripts provide the logic that is run inside the player's client. These methods are the lowest level communication layer to the scripting host (generally the [kernel](https://github.com/decentraland/kernel/tree/main/packages/shared/apis/host)) and consumed by the scripting client (usually the [runtime deployed](https://github.com/decentraland/kernel/blob/main/packages/scene-system/sdk/SceneRuntime.ts) alongside the code written by users).

## Transports

The scripts communicate with the host application thru a JSON-RPC2 based protocol using a defined transport. We have 3 built in transports.

- [WebWorker](src/common/transports/WebWorker.ts): Used to load a sandboxed script locally, inside a WebWorker
- [WebSocket](src/common/transports/WebSocket.ts): Used to run scripts in remote servers
- [Memory](src/common/transports/Memory.ts): Used to run tests, mainly. The script runs in the same execution context as the host.

## Scripting host

The [ScriptingHost](src/host/ScriptingHost.ts) is a core piece that instanciates APIs and handles incoming/outgoing messages from the scripts.

## APIs

APIs work as a bridge between user-created scripts and the lower level APIs of the client (communication, 3D entity management, etc). It provides a set of exposed methods that can be accessed from the script context. These methods are `async` by default and Promises are used as hooks for events that may be triggered in the future (HTTP Responses, entity collisions, etc).

The `@exposeMethod` decorator is provided as means of exposing API methods to the Script.

An example implementation can be found at [3.Class.spec.ts](test/scenarios/3.Class.spec.ts)

### See also

1.  [APIs introduction](docs/apis/introduction.md)
2.  [Common patterns](docs/apis/common-patterns.md)
3.  [Scripting host](docs/apis/scripting-host.md)

## Scripts

The term "script" or sometimes "system" refers to the instance of a user-created script, normally running inside a Web Worker. To access an API instance the decorator `@inject(apiName: string)` function is used. From then on, the user will be able to call all exposed methods and `await` the promises returned by them.

An example implementation can be found at [7.0.MethodsInjection.ts](test/fixtures/7.0.MethodsInjection.ts)

### See also

1.  [Scripts introduction](docs/scripts/introduction.md)
2.  [Common patterns](docs/scripts/common-patterns.md)

# Related documents

[The Entity-Component-System - An awesome gamedesign pattern in C Part 1](https://www.gamasutra.com/blogs/TobiasStein/20171122/310172/The_EntityComponentSystem__An_awesome_gamedesign_pattern_in_C_Part_1.php)

Why do we create a component based system? [Components](http://gameprogrammingpatterns.com/component.html)

# Decentraland Compiler

The Decentraland Compiler is a task runner used to build both the Decentraland client, as well as the scenes before deployment.

It must be configured though a `build.json` file in the same folder where it's executed.

```json
[
  {
    "name": "Compile systems",
    "kind": "Webpack",
    "file": "./scene.tsx",
    "target": "webworker"
  }
]
```

The following command runs the "webpack" kind of task:

`decentraland-compiler build.json`

It can also be run in watch mode:

`decentraland-compiler build.json --watch`

To use custom loaders (Webpack builds only) refer to https://webpack.js.org/concepts/loaders/#inline

## Licence

This repository is protected with a standard Apache 2 licence. See the terms and conditions in the [LICENCE](https://github.com/decentraland/decentraland-rpc/blob/master/LICENSE) file.
