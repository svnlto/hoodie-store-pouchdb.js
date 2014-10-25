Hoodie Store meets PouchDB
==========================

> Hoodie is going PouchDB. This repo is meant as a place for research and discussion

## Dream API

The API is a merge of Hoodie's current `hoodie.store`
and `hoodie.remote` API.

```js
// all methods return promises
hoodie.store.add(properties)
hoodie.store.find(id)
hoodie.store.find(object) // with id property
hoodie.store.findOrAdd(id, properties)
hoodie.store.findOrAdd(object)
hoodie.store.findAll()
hoodie.store.findAll(filterFunction)
hoodie.store.update(id, changedProperties)
hoodie.store.update(id, updateFunction)
hoodie.store.update(object)
hoodie.store.updateOrAdd(id, properties)
hoodie.store.updateOrAdd(object)
hoodie.store.updateAll(changedProperties)
hoodie.store.updateAll(updateFunction)
hoodie.store.remove(id)
hoodie.store.removeAll()
hoodie.store.clear()

// sync with remote store
hoodie.store.pull()
hoodie.store.push(/*objects*/)
hoodie.store.sync(/*objects*/)
hoodie.store.disconnect()

// returns true or false
hoodie.store.hasLocalChanges()
// returns all objects witch changes that have not been synced yet.
hoodie.store.changedObjects()

// events
hoodie.store.on(event, handler)
hoodie.store.off(event /*, handler */)

// returns a custom store
hoodie.store(typeOrOptions)
```

### List of events

- *change* -> eventName, object, options
  _eventName_: add || update || remove
  _options_:
    - remote: true || false
- *add* -> object, options
  new object added to local store
  _options_:
    - remote: true || false
- *update* -> object, options
  object updated in local store
  _options_:
    - remote: true || false
- *remove* -> object, options
  object removed from local store
  _options_:
    - remote: true || false
- *sync* -> object
  local change synced to remote
- *clear*
  All objects got removed at once

Besides `clear`, all events get also triggered
with "type:" and "type:id:" namespaces. So when
an object gets removed which had these properties:
`{type: 'todo', id: '123', name: 'Do this!'}`,
6 events are triggered in total.

1. `change`
2. `todo:change`
3. `todo:123:change`
1. `remove`
2. `todo:remove`
3. `todo:123:remove`

If an object has no `type` property, no namespaced
events are triggered.

### Custom store

```js
// example
var todoStore = hoodie.store('todo')
todoStore.add({name: 'Rule the world'})
todoStore.on('change', renderList)
```

When calling `hoodie.store()` as a function, a custom
store is returned. When a string is passed, the returned
store is automatically "namespaced". The code above would
store a new object with the properties:

- `type`: todo
- `id`: uuid4567
- `name`: Rule the world

The `renderList` callback would only be called if objects
with `type: 'todo'` are changed.

### Internal properties

We store timestamps and the user's `hoodie.id()` with every
change:

- `createdAt`: "2014-10-25T10:00:00+02:00" (ideally with timezone offset)
- `updatedAt`: "2014-10-25T10:00:00+02:00"
- `createdBy`: "uuid123"


## Implementation plan

The plan is to build the new PouchDB powered `hoodie.store` module
isolated from the current Hoodie codebase.

### Setup

- As there is no `hoodie.id()`, we hardcoded it to "hoodieid"
- As there is no Remote store or CouchDB, use the system CouchDB
  and create a new database "user/hoodieid", then hard code the
  remote location to http://localhost:5984/user%2fhoodieid

### Step 1

Implement the basic store methods

```js
hoodie.store.add(properties)
hoodie.store.find(id)
hoodie.store.findOrAdd(id, properties)
hoodie.store.findAll()
hoodie.store.update(id, changedProperties)
hoodie.store.updateOrAdd(id, properties)
hoodie.store.updateAll(changedProperties)
hoodie.store.remove(id)
hoodie.store.removeAll()
hoodie.store.clear()
```

### Step 2

Implement sync methods

```js
hoodie.store.pull()
hoodie.store.push(/*objects*/)
hoodie.store.sync(/*objects*/)
hoodie.store.disconnect()
```

### Step 3

Implement events

### Step 4

Implement `hasLocalChanges` and `changedObjects`

### Step 5

Implement custom stores

### Step 6

Think & Dream on

- separated local databases
- syncing with other remote databases
- validations
- views
- ...

## Questions / Ideas?

https://github.com/gr2m/hoodie-store-pouchdb.js/issues/new
