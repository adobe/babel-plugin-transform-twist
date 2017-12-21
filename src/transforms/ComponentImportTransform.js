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

const IGNORED_COMPONENTS = new Set([ 'repeat', 'g', 'if', 'elseif', 'else', 'using', 'unless', 'svg', 'iframe', 'object', 'embed' ]);

/**
 * Using item definitions from the configuration, automatically import declarations for JSX elements
 * and/or decorators.
 */
module.exports = class ComponentImportTransform {

    constructor(definitions) {
        this.definitions = {};
        for (let name in definitions) {
            let dec = definitions[name];
            this.definitions[name] = {
                module: dec.module || dec.classPath || dec.path || dec,
                export: dec.export || 'default'
            };
        }
    }

    apply(path) {
        if (!t.isJSXElement(path)) {
            return;
        }
        const elementName = PathUtils.getJSXElementName(path);
        if (IGNORED_COMPONENTS.has(elementName)) {
            return;
        }
        const def = this.definitions[elementName];
        if (!def) {
            return;
        }
        const localName = PathUtils.addImportOnce(path, def.export, def.module).name;
        path.node.openingElement.name = t.jSXIdentifier(localName);
        if (path.node.closingElement) {
            path.node.closingElement.name = t.jSXIdentifier(localName);
        }
    }
};
