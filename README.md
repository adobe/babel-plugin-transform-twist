# babel-plugin-transform-twist

This babel plugin provides support for the syntax features of [twist](https://github.com/adobe/twist) that are common to any UI framework that you might use twist with. Specifically, it implements:

* Configuring decorators for auto-import.
* Allowing
* Configuring JSX tags for auto-import.

## Quick Reference

Plugin Options:

```js
{
    autoImport: {
        'Store': {
            module: '@twist/core',
            export: 'StoreDecorator',
            inherits: {
                module: '@twist/core',
                export: 'Store'
            }
        }
        'ui:button': {
            module: 'my-ui-library',
            export: 'Button'
        }
    }
}
```

With the above options, the following code:

```js
@Store
class MyStore {
    getView() {
        return <ui:button>My Button</ui:button>;
    }
}
```

becomes:

```js
import { StoreDecorator, Store } from '@twist/core';
import { Button } from 'my-ui-library';

@StoreDecorator
class MyStore extends Store {
    getView() {
        return <Button>My Button</Button>;
    }
}
```
