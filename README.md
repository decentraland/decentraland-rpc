[![CircleCI](https://circleci.com/gh/decentraland/script/tree/master.svg?style=svg&circle-token=33a7ab6330a3c900c456c0367c118d912e48f484)](https://circleci.com/gh/decentraland/script/tree/master)

This repository contains a WIP version of the

* Compiler
* Scripting client
* Scripting host

And the tests.

# Basic Concepts

## Scripting
Scripts are pieces of logic that run inside the context of a Web Worker. They are meant to provide the user a way to run custom logic inside the player's client, allowing the creation of rich experiences inside Decentraland. To achieve this, low level hooks are exposed from the scripting host and consumed by the scripting client.

## Scripting Host
The term `host` refers to an instance of the VR client running on a user's pc. It contains a set of `plugins` created and mantained by the Decentraland Team and their collaborators.

## Plugins
Plugins work as a bridge between user-created scripts and the lower level APIs of the VR client (communication, 3D entity management, etc). It provides a set of exposed methods that can be accessed from the Web Worker context. These methods are `async` by default and Promises are used as hooks for events that may be triggered in the future (HTTP Responses, entity collisions, etc).

The `exposeMethod` decorator is provided as means of exposing Plugin methods to the Scripting Client.

An example implementation can be found at https://github.com/decentraland/script/blob/master/test/scenarios/3.Class.spec.ts

## Scripting Client
The scripting client refers to the instance of a user-created script running inside a Web Worker. To access a Plugin instance the `getPlugin(pluginName)` function is used. From then on, the user will be able to call all exposed methods and `await` the promises returned by them.

An example implementation can be found at https://github.com/decentraland/script/blob/master/test/fixtures/3.Class.ts


