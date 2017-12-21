import { someExport as _autoimportedComponent2 } from 'some-module';
import { someExport as _autoimportedComponent } from 'some-module';
import { StoreDecorator as _StoreDecorator2 } from '@twist/core';
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
            <_autoimportedComponent />
            <_autoimportedComponent2>foo</_autoimportedComponent2>
        </div>
    }
}

@_StoreDecorator
class MyStore extends _Store {
}

@_StoreDecorator2
class MySubStore extends MyStore {
}
