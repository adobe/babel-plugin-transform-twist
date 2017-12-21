# babel-plugin-transform-react-twist

This babel plugin enhances React-compatible JSX with additional features inspired by Torq (Adobe's internal framework),
including structural components, style and class attribute shorthands, and event handler migration assistance.

This plugin can be used with React as-is; it's included with [react-twist](https://git.corp.adobe.com/torq/react-twist)
by default.

## Quick Reference

Plugin Options (WIP):

```js
{
    autoImport: {
        'spectrum:button': {
            module: 'react-spectrum',
            export: 'SpectrumButton'
        }
    }
}
```

### Structural Components

```jsx
// Use if/elseif/else:
<if condition={isEnglish}>
    hello!
</if>
<elseif condition={isFrench}>
    bonjour!
</elseif>
<else>
    :wave:
</else>

// Iterate over items in a collection:
<repeat for={item in collection}>
    <Item item={item} />
</repeat>

// The opposite of <if>:
<unless condition={dontSayHi}>
    Hi
</unless>

// Alias variables with <using>:
<using value={this.long.path.to.item} as={item}>
    {item}
</using>

// Use <g> to group items without wrapping them in a real DOM element:
render() {
    return <g>
        <div>One</div>
        <div>Two</div>
    <g>;
}
```

### Enhanced Attributes

```jsx

// Use "style-" shorthand, in addition to React's style object:
<div style={{ color: 'white' }} style-font-size={32} style-font-weight="bold" />

// Use "class-" shorthand:
<button class-primary={true} class-large={isLarge} />

// Pass an array to className (or "class", which is also converted to className):
<button className={[ 'class1', 'class2' ]} />

// Hyphenated event attributes, for ease of migration:
<button on-mouse-down={(evt) => doSomething()} />
// (Note: passing an expression, as in Torq, is supported, but emits a warning.)
```

## Detailed Enhancements

- Structural Components
    - Supports all Torq structural components (`<if>`, `<elseif>`, `<else>`, `<repeat>`, `<unless>`, `<using>`, `<g>`).
- Styles
    - `style` accepts a string (or an object as usual).
    - `style-____` shorthand for setting individual properties. React automatically adds "px" if necessary.
- Classes
    - `class` accepts an array or an object (or a string as usual); For arrays, non-truthy values are removed. For objects, only truthy keys add each property.
    - `class-____={true}` shorthand to enable/disable individual classes.
- Automatic Imports

#### Temporary Migration Support Features

- Event Compatibility Migration Support (intended to ease migration temporarily)
    - Converts `on-event-name` to `onEventName` (and emits a warning).
    - Emits a warning if the event handler is not a function. Torq supported expressions as event handlers (which were
      impliclty wrapped in functions); this is designed to provide assistance while migrating.
    - NOTE: React [wraps DOM events](https://reactjs.org/docs/events.html) with a supporting class. If you rely on
      certain properties of native event objects, you may need to adjust your code to be compatible. React exposes
      the `nativeEvent` property on events; you can access that if necessary.
- Ref Migration Support
    - Emits a warning if the `ref` attribute is not a function. Torq uses `ref={this.el}`, but React needs a function like
      `ref={(el) => this.el = el}`.
    - Emits a warning when the `define-ref` attribute is used (which is unsupported).
