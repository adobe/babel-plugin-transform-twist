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

const fs = require('fs');
const path = require('path');
const babylon = require('babylon');
const recast = require('recast');
const { transform } = require('babel-core');

module.exports = class Transformer {

    get _indexFile() {
        return path.join(__dirname, 'index.js');
    }

    constructor(transformOptions) {
        this.recastOptions = {
            quote: 'single',
            arrayBracketSpacing: true,
            objectCurlySpacing: true,
            parser: {
                parse(code) {
                    return babylon.parse(code, {
                        sourceType: 'module',
                        // Note: these are not the same as Babel plugins
                        plugins: [
                            'flow',
                            'jsx',
                            'asyncGenerators',
                            'decorators',
                            'classProperties',
                            'doExpressions',
                            'exportExtensions',
                            'functionBind',
                            'functionSent',
                            'objectRestSpread',
                            'dynamicImport'
                        ]
                    });
                }
            }
        };

        this.babelPlugins = [
            require('babel-plugin-syntax-async-generators'),
            require('babel-plugin-syntax-class-properties'),
            require('babel-plugin-syntax-decorators'),
            require('babel-plugin-syntax-do-expressions'),
            require('babel-plugin-syntax-dynamic-import'),
            require('babel-plugin-syntax-export-extensions'),
            require('babel-plugin-syntax-flow'),
            require('babel-plugin-syntax-function-bind'),
            require('babel-plugin-syntax-function-sent'),
            require('babel-plugin-syntax-jsx'),
            require('babel-plugin-syntax-object-rest-spread'),
            [ this._indexFile, transformOptions ]
        ];
    }

    transformFile(fullPath, root) {
        return transform(fs.readFileSync(fullPath), {
            babelrc: false,
            filename: fullPath,
            filenameRelative: root && path.relative(root, fullPath),
            plugins: this.babelPlugins,
            parserOpts: {
                parser: (code) => {
                    return recast.parse(code, this.recastOptions);
                }
            },
            generatorOpts: {
                generator: (x) => recast.print(x, this.recastOptions)
            },
        }).code;
    }
};
