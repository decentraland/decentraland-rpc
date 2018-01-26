[![CircleCI](https://circleci.com/gh/decentraland/script/tree/master.svg?style=svg&circle-token=33a7ab6330a3c900c456c0367c118d912e48f484)](https://circleci.com/gh/decentraland/script/tree/master)

# Basic Concepts

## Scripting
Scripts are pieces of logic that run inside the context of a Web Worker. They are meant to provide the user a way to run custom logic inside the player's client, allowing the creation of rich experiences inside Decentraland. To achieve this, low level hooks are exposed from the scripting host and consumed by the scripting client.

## Component System
The `component system` is a core piece of the Client that instanciates Components and handles incoming/outgoing messages from the external Systems.

## Components
Components work as a bridge between user-created scripts and the lower level APIs of the client (communication, 3D entity management, etc). It provides a set of exposed methods that can be accessed from the Web Worker context. These methods are `async` by default and Promises are used as hooks for events that may be triggered in the future (HTTP Responses, entity collisions, etc).

The `@exposeMethod` decorator is provided as means of exposing component methods to the Scripting Client.

An example implementation can be found at https://github.com/decentraland/script/blob/master/test/scenarios/3.Class.spec.ts

## Entities
Entities are all assets that the client will be able to load and users will be able to interact with. They can be audio, 3D objects, etc. They can contain scripts which grants them additional behaviours.

## Systems
The term "system" or "scripting system" refers to the instance of a user-created script running inside a Web Worker. To access a Component instance the decorator `@inject(component: string)` function is used. From then on, the user will be able to call all exposed methods and `await` the promises returned by them.

An example implementation can be found at https://github.com/decentraland/script/blob/master/test/fixtures/7.0.MethodsInjection.ts

# Related documents

[The Entity-Component-System - An awesome gamedesign pattern in C Part 1](https://www.gamasutra.com/blogs/TobiasStein/20171122/310172/The_EntityComponentSystem__An_awesome_gamedesign_pattern_in_C_Part_1.php)  

Why do we create a component based system? [Components](http://gameprogrammingpatterns.com/component.html)
