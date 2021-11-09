/*
 *   Copyright 2020 Bruno Ribeiro
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
import { SvgPrinter } from './visitor';
import { Logger, realpath } from './utils';
import { PortableGenerator } from './codegen';

class MyListener implements CompilationListener
{

	onStart() {
	}

	onError(location: SourceLocation, error : Error): boolean {
		if (location)
			Logger.writeln(location.fileName + ':' + location.line + ":" + location.column + ': ERROR - ' + error.message);
		else
			Logger.writeln('<unkown source>:0:0: ERROR - ' + error.message);
		//Logger.writeln(error.stack);
		//process.exit(1);
		return false;
	}

	onWarning(location: SourceLocation, message: string): boolean {
		Logger.writeln(location.fileName + ':' + location.line + ":" + location.column + ': WARN - ' + message);
		return true;
	}

	onFinish() {
	}

}


declare let require: any;
require('source-map-support').install();
let fs = require("fs");
let util = require("util");
let process = require("process");

if (process.argv.length != 4)
{
	console.log('Usage: node jane.js (generate | tokenize | ast) <input file>');
	process.exit(1);
}

let mode = process.argv[2];
let inputFileName = process.argv[3];
let outputFileName = process.argv[4];

/*if (mode == 'tokenize')
{
	console.log('<html><body>');
	let tok : Token = null;
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
		console.log('<p>' + text + '</p>');
		///let tmp = document.createElement("span");
		//tmp.innerHTML = tok.value;
		//body.appendChild(tmp);
	}
	console.log('</body></html>');
}
else*/
{
	let comp = new Compiler(new MyListener());
	let units = comp.compile(realpath(inputFileName));

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

	if (mode == 'ast' && comp.ctx.units.size > 0)
	{
		//console.log(util.inspect(unit, {showHidden: false, depth: null}))
		let visitor = new SvgPrinter();
		visitor.visitUnit(comp.ctx.units.values()[0]);
	}
	else
	if (mode == 'generate' && comp.ctx.units.size > 0)
	{
		let codegen = new PortableGenerator(comp.ctx);
		let code = codegen.generate(comp.ctx.units.values()[0]);
		console.log(code);
	}
	console.error(Logger.toString());
}
