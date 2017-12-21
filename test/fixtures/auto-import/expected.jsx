import { MyComponent as _MyComponent } from 'my-library';
import { Store as _Store } from '@twist/core';
import { StoreDecorator as _StoreDecorator } from '@twist/core';
import { FunctionDecorator as _FunctionDecorator } from 'function-decorator-module';
import { Decorator as _Decorator } from 'decorator-module';
import { Something } from 'function-decorator-module';

@_Decorator
class Foo {

    @_FunctionDecorator({ foo: true })
    render() {
        <div>
            <_MyComponent />
            <_MyComponent>foo</_MyComponent>
        </div>
    }
}

@_StoreDecorator
class MyStore extends _Store {
}

@_StoreDecorator
class MySubStore extends MyStore {
}
