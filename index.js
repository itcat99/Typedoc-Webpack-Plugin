/*
 *  Typedoc Webpack Plugin
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

const typedoc = require("typedoc");
const clone = require("lodash.clone");
const merge = require("lodash.merge");
const path = require("path");

class TypedocWebpackPlugin {
  constructor(options, input) {
    this.inputFiles = ["./"];
    if (input) {
      this.inputFiles = input.constructor === Array ? input : [input];
    }

    this.defaultTypedocOptions = {
      module: "commonjs",
      target: "es5",
      exclude: "**/node_modules/**/*.*",
      experimentalDecorators: true,
      excludeExternals: true,
    };

    // merge user options into default options and assign
    merge(this.defaultTypedocOptions, options);
    this.typeDocOptions = this.defaultTypedocOptions;

    //only set default output directory if neither out or json properties are set
    if (!this.typeDocOptions.out && !this.typeDocOptions.json) {
      this.typeDocOptions.out = "./docs";
    }
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync(
      "TypedocWebpackPlugin",
      (_compilation, callback) => {
        const typedocOptions = clone(this.typeDocOptions);
        const { json, out } = this.typeDocOptions;
        const { output } = compiler.options;

        if (json) {
          if (path.isAbsolute(json)) {
            typedocOptions.json = json;
          } else if (output && output.path) {
            typedocOptions.json = path.join(output.path, json);
          }
        } else {
          if (path.isAbsolute(out)) {
            typedocOptions.out = out;
          } else if (output && output.path) {
            typedocOptions.out = path.join(output.path, out);
          }
        }

        const typedocApp = new typedoc.Application(typedocOptions);
        const src = typedocApp.expandInputFiles(this.inputFiles);
        const project = typedocApp.convert(src);

        if (project) {
          if (typedocOptions.json) {
            console.log("Generating typedoc json");
            typedocApp.generateJson(project, typedocOptions.json);
          } else {
            console.log("Generating updated typedocs");
            typedocApp.generateDocs(project, typedocOptions.out);
          }
        }

        callback();
      }
    );

    compiler.hooks.done.tap("TypedocWebpackPlugin", (stats) => {
      console.log("Typedoc finished generating");
    });
  }
}

module.exports = TypedocWebpackPlugin;
