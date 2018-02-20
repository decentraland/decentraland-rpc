# Component Systems

Component Systems are the glue between an external System (that could run on a Web Worker, or even on another server) and a local Component. By design each instance of a System is associated to an individual instance of a Component System and to an individual instance of the Component it's trying to consume. This is done due to the need to support different Transport mechanisms (JSON-RPC over Worker messages or WebSockets), and to keep the state of each Component isolated.

To summarize, a Component System serves the following purposes:

* Mounting and unmounting Components and Systems on-demand.
* Providing communication over a given transport layer.
* Providing abstractions over notifications.

In practice, Component Systems are transparent and you will rarely find youself interacting with their API.
