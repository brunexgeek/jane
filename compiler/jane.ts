/*
 *   Copyright 2019-2021 Bruno Ribeiro
 *   <https://github.com/brunexgeek/jane>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import {
    Tokenizer,
    Scanner,
    Token,
    TokenType } from './tokenizer';
import {
    Compiler,
    CompilationListener,
    CompilationContext,
    SourceLocation } from './compiler';
import { Unit } from './types';
import { Parser } from './parser';
import { WebAstPrinter } from './astprinter';
import { Logger, readfile, realpath, StringBuffer } from './utils';
import { PortableGenerator } from './codegen';

declare let require: any;
require('source-map-support').install();
let fs = require("fs");
let process = require("process");
const yargs = require('yargs');

class MyListener implements CompilationListener
{
    failed = false;

    onStart() {
    }

    onError(location: SourceLocation, error : Error): boolean {
        if (location)
            Logger.writeln(location.fileName + ':' + location.line + ":" + location.column + ': ERROR - ' + error.message);
        else
            Logger.writeln('<unkown source>:0:0: ERROR - ' + error.message);
        //Logger.writeln(error.stack);
        //process.exit(1);
        this.failed = true;
        return false;
    }

    onWarning(location: SourceLocation, message: string): boolean {
        Logger.writeln(location.fileName + ':' + location.line + ":" + location.column + ': WARN - ' + message);
        return true;
    }

    onFinish() {
    }

}

function parse_arguments( args : string[] )
{
    return yargs
    .command('generate', 'Transpiles Jane to ANSI C89', {
        input: {
            description: 'Source filename',
            alias: 'i',
            type: 'string',
            demandOption: true
        },
        output: {
            description: 'Output C89 file',
            alias: 'o',
            type: 'string',
            demandOption: true
        }
    })
    .command('ast', 'Generate an HTML representation of the AST', {
        input: {
            description: 'Source filename',
            alias: 'i',
            type: 'string',
            demandOption: true
        },
        output: {
            description: 'Output HTML file',
            alias: 'o',
            type: 'string',
            demandOption: true
        }
    })
    .command('tokenize', 'Generate an HTML file with every token', {
        input: {
            description: 'Source filename',
            alias: 'i',
            type: 'string',
            demandOption: true
        },
        output: {
            description: 'Output HTML file',
            alias: 'o',
            type: 'string',
            demandOption: true
        }
    })
    .demandCommand(1, 'No command specified')
    .help()
    .alias('help', 'h')
    .argv;
}

function main( args : string[] )
{
    let config = parse_arguments(args);
    let listener = new MyListener();

    if (config._ == 'tokenize')
    {
        let ctx = new CompilationContext(listener);
        let source : string = readfile(config.input);
        let scanner = new Scanner(ctx, config.input, source);
        let tk = new Tokenizer(ctx, scanner);
        let sbuf : StringBuffer = new StringBuffer();
        let tok : Token = null;

        sbuf.writeln('<html><body>');
        while ((tok = tk.next()).type != TokenType.EOF)
        {
            let text = '<strong>' + ((tok.type === null) ? "???" : tok.type.name) + '</strong> ';
            if (tok.lexeme)
            {
                let color = '#070';
                if (tok.type == TokenType.SSTRING ||
                    tok.type == TokenType.DSTRING ||
                    tok.type == TokenType.TSTRING)
                    color = '#f70';
                text += `<span style='color: ${color}'><i>${tok.lexeme}</i></span>`;
            }
            if (tok.location) text += ' at ' + tok.location.line + ':' + tok.location.column;
            sbuf.writeln('<p>' + text + '</p>');
            ///let tmp = document.createElement("span");
            //tmp.innerHTML = tok.value;
            //body.appendChild(tmp);
        }
        sbuf.writeln('</body></html>');

        fs.writeFileSync(config.output, sbuf.toString(), {flags:'w'});
    }
    else
    {
        let comp = new Compiler(listener);
        let units = comp.compile(realpath(config.input));

        //for (let type of comp.ctx.types.values())
        //	Logger.writeln(`Defined type '${type.name}'`);
        for (let unit of comp.ctx.units.values())
        {
            Logger.writeln(`Unit ${unit.fileName}`);
            if (unit.variables.size > 0)
            {
                Logger.writeln(`   Variables`);
                for (let item of unit.variables.values())
                    Logger.writeln(`      ${item.toString()}`);
            }
            if (unit.functions.size > 0)
            {
                Logger.writeln(`   Functions`);
                for (let item of unit.functions.values())
                    Logger.writeln(`      ${item.toString()}`);
            }
            if (unit.types.size > 0)
            {
                Logger.writeln(`   Types`);
                for (let item of unit.types.values())
                    Logger.writeln(`      ${item.toString()}`);
            }
            if (unit.generics.size > 0)
            {
                Logger.writeln(`   Generics`);
                for (let item of unit.generics.values())
                    Logger.writeln(`      ${item.toString()}`);
            }
        }

        if (config._ == 'ast' && comp.ctx.units.size > 0)
        {
            //console.log(util.inspect(unit, {showHidden: false, depth: null}))
            let visitor = new WebAstPrinter();
            let html = visitor.renderModule(comp.ctx.units.values());
            fs.writeFileSync(config.output, html, {flags:'w'});
        }
        else
        if (config._ == 'generate' && comp.ctx.units.size > 0)
        {
            let codegen = new PortableGenerator(comp.ctx);
            let i = 0;
            for (let unit of comp.ctx.units.values())
            {
                let code = codegen.generate(unit);
                fs.writeFileSync(`${config.output}-${i++}.c`, code, {flags:'w'});
            }
        }
        console.error(Logger.toString());
        if (listener.failed)
            process.exit(1);
        else
            process.exit(0);
    }
}

main(process.argv);