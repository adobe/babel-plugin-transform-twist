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

const ComponentImportTransform = require('./transforms/ComponentImportTransform');
const DecoratorImportTransform = require('./transforms/DecoratorImportTransform');

const OPTIONS = {
    autoImport: {}
};

function normalizeOptions(opts = {}) {
    return Object.assign({}, OPTIONS, opts);
}

module.exports = () => {
    return {
        visitor: {
            Program(path, state) {
                const options = state.opts = normalizeOptions(state.opts);
                const decoratorTransform = new DecoratorImportTransform(options.autoImport);

                // Any plugins which need to run first-ish (before common transpilations) need to traverse the Program
                // node here. Otherwise, other plugins that run in-between these might lose some of the source-code
                // context that we need to apply our own transformations (e.g. arrow functions becoming normal functions
                // without accompanying AST information, or decorators being transpiled out).
                path.traverse({
                    ['ClassExpression|ClassDeclaration|ClassProperty|Method'](path) {
                        decoratorTransform.apply(path);
                    },
                });
            },

            JSXElement(path, state) {
                const options = state.opts = normalizeOptions(state.opts);
                new ComponentImportTransform(options.autoImport).apply(path, state);
            }
        }
    };
};
