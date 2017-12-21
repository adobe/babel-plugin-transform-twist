import { MyComponent as _MyComponent } from 'my-library';
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
