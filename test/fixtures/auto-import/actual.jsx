import { Something } from 'function-decorator-module';

@Decorator
class Foo {

    @FunctionDecorator({ foo: true })
    render() {
        <div>
            <autoimported:component />
            <autoimported:component>foo</autoimported:component>
        </div>
    }
}
