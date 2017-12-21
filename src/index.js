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
                new DecoratorImportTransform(options.autoImport).traverseProgram(path);
            },

            JSXElement(path, state) {
                const options = state.opts = normalizeOptions(state.opts);
                new ComponentImportTransform(options.autoImport).apply(path, state);
            }
        }
    };
};
