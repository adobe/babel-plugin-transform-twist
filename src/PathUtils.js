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

const t = require('babel-types');
const template = require('babel-template');
const { addNamed } = require('babel-helper-module-imports');

module.exports = class PathUtils {

    /**
     * Return the string name of the given element.
     * @param {Path<JSXElement>} path
     * @return {string}
     */
    static getJSXElementName(path) {
        t.assertJSXElement(path.node);
        const nameRoot = path.node.openingElement.name;
        if (nameRoot.namespace) {
            return nameRoot.namespace.name + ':' + nameRoot.name.name;
        }
        else {
            return nameRoot.name;
        }
    }

    static getJSXAttributeName(attr) {
        t.assertJSXAttribute(attr);
        if (attr.name.namespace) {
            return attr.name.namespace.name + ':' + attr.name.name.name;
        }
        return attr.name.name;
    }

    static getAttribute(path, attributeName) {
        t.assertJSXElement(path.node);
        const attributes = path.node.openingElement.attributes;
        for (let i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            if (t.isJSXAttribute(attr) && this.getJSXAttributeName(attr) === attributeName) {
                return attr;
            }
        }
    }

    static deleteAttribute(path, attributeName) {
        t.assertJSXElement(path.node);
        const attributes = path.node.openingElement.attributes;
        for (let i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            if (t.isJSXAttribute(attr) && this.getJSXAttributeName(attr) === attributeName) {
                attributes.splice(i, 1);
                break;
            }
        }
    }

    static getAttributeValue(path, attributeName) {
        const attr = PathUtils.getAttribute(path, attributeName);
        return attr && attr.value;
    }

    static addGlobalOnce(path, readableName, fn) {
        const parent = path.scope.getProgramParent().path;
        let fnName = parent.scope.getData(readableName);
        if (!fnName) {
            fnName = path.scope.generateUidIdentifier(readableName);
            parent.scope.setData(readableName, fnName);
            parent.unshiftContainer('body', template(fn.toString().replace(/.*?\(/, 'function ' + fnName.name + '('))());
        }
        return fnName;
    }

    static addImportOnce(path, exportName, moduleName) {
        const parent = path.scope.getProgramParent().path;
        const importKey = exportName + '@' + moduleName;
        let localName = parent.scope.getData(importKey);
        if (!localName) {
            localName = addNamed(path, exportName, moduleName);
            parent.scope.setData(importKey, localName);
        }
        return localName;
    }

    /**
     * Adds a new global symbol declaration.
     *
     * @param {Path} path
     * @param {string} readableName The readable name of the variable holding the symbol.
     * @return {Identifier} The identifier of the variable we just declared.
     */
    static addGlobalSymbol(path, readableName) {
        const parent = path.scope.getProgramParent().path;
        let declName = path.scope.generateUidIdentifier(readableName);
        if (!parent.scope.hasGlobal('Symbol')) {
            // We need to add Symbol as a global, otherwise it might not get imported properly
            parent.scope.addGlobal(t.identifier('Symbol'));
        }
        parent.scope.push({ id: declName, init: template(`Symbol('${readableName}')`)().expression });
        return declName;
    }

    /**
     * Test whether "this" is defined for the given path - we walk up the parent functions, until we find a
     * function that's not an arrow function (in which case this is defined), or we hit the program (in which
     * case it isn't).
     *
     * @param {Path} path
     * @return {Boolean} Whether or not the given path has a defined "this" context.
     */
    static hasThisContext(path) {
        if (!path || path.isProgram()) {
            return false;
        }
        if (path.isFunction() && !path.isArrowFunctionExpression()) {
            return true;
        }
        return PathUtils.hasThisContext(path.getFunctionParent());
    }

    /**
     * Push the given expression(s) to the start of the body of the given function. This handles arrow functions too
     * (it converts the arrow function body to a block with a return statement, if it's an expression).
     *
     * @param {Path} path
     * @return {Statement|Array.<Statement>} Statement(s) to push to the start of the function body.
     */
    static pushToFunctionBody(path, expressions) {
        t.assertFunction(path.node);
        let body = path.node.body;
        if (!t.isBlockStatement(body)) {
            // It must be an arrow function, if the body isn't a block (i.e. it's an expression)
            // Convert it to a block with a return.
            body = t.blockStatement([ t.returnStatement(body) ]);
            path.node.body = body;
        }
        if (expressions instanceof Array) {
            body.body = expressions.concat(body.body);
        }
        else {
            body.body.unshift(expressions);
        }
    }

    /**
     * Given an array of [children of a JSX component], return an expression that represents the same children.
     * For instance, the contents of a <repeat> might include multiple elements; they must be serialized into a format
     * suitable as a return value within `collection.map()`. This is typically an array, but in cases where only a single
     * element or text node is contained, we can just return that one item. When no items exist, returns a null expression.
     *
     * @param {Array<Node>} children
     * @return {Expression}
     */
    static jsxChildrenToJS(children) {
        if (!children) {
            return t.nullLiteral();
        }

        children = children
            .map(child => t.isJSXExpressionContainer(child) ? child.expression : child)
            .filter(child => !(t.isJSXText(child) && /^\s+$/.test(child.value)))
            .map(child => t.isJSXText(child) ? t.stringLiteral(child.value.trim()) : child);

        return (
            children.length === 0 ? t.nullLiteral()
                : children.length === 1 ? children[0]
                    : t.arrayExpression(children)
        );
    }

    /**
     * If the parent element of the given `path` is a JSX Element, wrap `expression` in a JSXExpressionContainer (braces).
     * @param {Path} path
     * @param {Expression} expression
     * @return {Expression}
     */
    static maybeWrapJSXExpression(path, expression) {
        return t.isJSXElement(path.parent) ? t.jSXExpressionContainer(expression) : expression;
    }

    /**
     * Return the class declaration of a path's parent component, if the path is inside one.
     * @param {Path} path
     * @return {Node<ClassDeclaration> | undefined}
     */
    static findParentComponent(path) {
        const classDeclarationPath = path.findParent(parent => t.isClassDeclaration(parent));

        // See if there's an @Component decorator:
        const decorators = classDeclarationPath && classDeclarationPath.node.decorators;
        const componentDecorator = decorators && decorators.find(d => {
            let expr = d.expression;
            if (t.isCallExpression(expr)) {
                // It could be a call expression, like @Component({ fork: true })
                expr = expr.callee;
            }
            return expr && expr.name === 'Component';
        });
        if (componentDecorator) {
            return classDeclarationPath;
        }
    }

    /**
     * If the given path has an "as" attribute, this removes said attribute and converts it to an array of identifiers
     * @param {Path} path
     * @return {Array<Identifier> | undefined}
     */
    static stripAsIdentifiers(path) {
        const asAttr = PathUtils.getAttributeValue(path, 'as');
        if (!asAttr) {
            return;
        }

        let args = t.isSequenceExpression(asAttr.expression) ? asAttr.expression.expressions : [ asAttr.expression ];

        if (!args.every(t.isIdentifier)) {
            PathUtils.warning(path, `Ignoring 'as' attribute that's not an identifier, or sequence of identifiers.`);
            return;
        }

        this.deleteAttribute(path, 'as');
        return args;
    }

    static warning(path, message) {
        console.warn(`WARNING: ${message}\n   at ${path.scope.hub.file.opts.filenameRelative}:${path.node.loc.start.line}`);
    }

};
