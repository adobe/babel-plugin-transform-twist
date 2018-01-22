/*
 *  Copyright 2017 Adobe Systems Incorporated. All rights reserved.
 *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License. You may obtain a copy
 *  of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under
 *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 *  OF ANY KIND, either express or implied. See the License for the specific language
 *  governing permissions and limitations under the License.
 *
 */

const PathUtils = require('../PathUtils');
const t = require('babel-types');

module.exports = class DecoratorImporter {

    /**
     * @typedef {object} DecoratorDefinition
     * @property {string} module
     *   The module from which to import the decorator.
     * @property {string?} export
     *   The export name from `module`; if not provided, "default" is assumed.
     * @property {{ module: string, export: string }} inherits
     *   If provided, import the superclass defined by module/export and make the decorated class inherit from it.
     * @property {boolean?} needsClassName
     *   If true, the name of the class will be passed as the first extra argument to the decorator (after `target`).
     * @property {boolean?} interceptsSuper
     *   If true, add a class in between the given class and its superclass. (Used to dynamically
     *   insert methods into the class.)
     * @property {string?} hotReload
     *   If true, insert the HotReload decorator from this path (used by @Component).
     *
     * For legacy reasons, the following variants are supported:
     *   - `inherits` may be a string (implies `{ module: ___, export: 'default' }`).
     *   - A plain string, or a definition containing `classPath` or `path`, will be converted properly.
     */

    /**
     * Load a bunch of decorator definitions.
     * @param {{ decoratorName: DecoratorDefinition }} definitions
     */
    constructor(definitions) {
        this.definitions = {};
        for (let name in definitions) {
            let dec = definitions[name];
            this.definitions[name] = {
                module: dec.module || dec.classPath || dec.path || dec,
                export: dec.export || 'default',
                inherits: typeof dec.inherits === 'string' ? { module: dec.inherits, export: 'default' } : dec.inherits,
                needsClassName: dec.needsClassName,
                interceptsSuper: dec.interceptsSuper,
                hotReload: dec.hotReload,
            };
        }
    }

    /**
     * Automatically import decorators referenced from this file, matching the provided definitions.
     */
    apply(path) {
        if (path.node.decorators) {
            path.node.decorators.forEach((decorator, index) => {
                this.visitDecorator(path.get('decorators.' + index), path);
            });
        }
    }

    /** Sanity-check the syntax of decorator import definitions. */
    assertDefinitionFormat(def, decoratorName) {
        if (!def || !def.module || !def.export) {
            throw new Error(`DecoratorImporter received an invalid definition for @${decoratorName
            }. Expected an object with "module" and "export" string keys; got ${JSON.stringify(def)}`);
        }
        if (def.inherits) {
            if (!def.inherits.module || !def.inherits.export) {
                throw new Error(`DecoratorImporter received an invalid definition for @${decoratorName
                }'s "inherits" property. Expected an object with "module" and "export"; got ${JSON.stringify(def)}`);
            }
        }
    }

    /** Given this decorator, automatically import the necessary module(s). */
    visitDecorator(decoratorPath, path) {
        const decorator = decoratorPath.node;
        const identifier = DecoratorImporter.getLeftmostIdentifier(decorator.expression);

        // First, check that the decorator isn't already imported
        if (decoratorPath.scope.hasBinding(identifier.name)) {
            return;
        }

        // Look up the decorator to see if it should be imported automatically
        const def = this.definitions[identifier.name];
        if (!def) {
            // A decorator with no definition. This is fine; they might have imported a decorator manually.
            return;
        }
        this.assertDefinitionFormat(def, identifier.name);

        // Change the name to the import, but also remember the original name - because some of the other transforms may need to know this!
        decoratorPath.setData('originalName', identifier.name);
        identifier.name = PathUtils.addImportOnce(path, def.export, def.module).name;

        const className = t.isClass(path.node) && path.node.id.name;

        if (def.inherits && !path.node.superClass) {
            path.node.superClass = PathUtils.addImportOnce(path, def.inherits.export, def.inherits.module);
        }

        if (def.needsClassName) {
            if (!t.isCallExpression(decorator.expression)) {
                decorator.expression = t.callExpression(decorator.expression, []);
            }
            decorator.expression.arguments.unshift(t.stringLiteral(className));
        }
        if (def.hotReload && className) {
            decorator.expression = t.callExpression(PathUtils.addImportOnce(path, 'default', def.hotReload),
                [ decorator.expression, t.identifier('module'), t.stringLiteral(className) ]);
        }
        if (def.interceptsSuper) {
            // We need to put an empty class between this class and it's parent. That's needed for classes like import that will use
            // the intercept class to inject more methods as they are received from a different thread.
            const oldSuperClass = path.node.superClass;
            path.node.superClass = path.scope.generateUidIdentifier(className + 'SuperIntercept');

            // Queue the new class for conversion.
            path.requeue(path.getStatementParent().insertBefore([ t.classDeclaration(path.node.superClass, oldSuperClass, t.classBody([]), []) ])[0]);
        }
    }

    /** Given a decorator expression, find the root identifier -- the one we want to import. */
    static getLeftmostIdentifier(node) {
        switch (node.type) {
        case 'CallExpression': return DecoratorImporter.getLeftmostIdentifier(node.callee);
        case 'ArrayExpression': return DecoratorImporter.getLeftmostIdentifier(node.elements[0]);
        case 'MemberExpression': return DecoratorImporter.getLeftmostIdentifier(node.object);
        case 'Identifier': return node;
        default: throw new Error(`DecoratorImporter.getLeftmostIdentifier() doesn't know what '${node.type}' is.`);
        }
    }
};
