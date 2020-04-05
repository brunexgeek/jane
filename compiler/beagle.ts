/*
 *   Copyright 2020 Bruno Ribeiro
 *   <https://github.com/brunexgeek/beagle-lang>
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

class MyListener implements CompilationListener
{

	onStart() {
	}

	onError(location: SourceLocation, error : Error): boolean {
		console.error(location.fileName + ':' + location.line + ":" + location.column + ': ERROR - ' + error.message);
		//console.error(error.stack);
		//process.exit(1);
		return true;
	}

	onWarning(location: SourceLocation, message: string): boolean {
		console.error(location.fileName + ':' + location.line + ":" + location.column + ': WARN - ' + message);
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
	console.log('Usage: beagle.js (generate | tokenize | ast) <input file>');
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
	let units = comp.compile(inputFileName);

	if (mode == 'types')
	{
		for (let type of comp.ctx.types.values())
			console.log(`Defined type '${type.name}'`);
		for (let unit of comp.ctx.units.values())
		{
			console.error(`Unit ${unit.fileName}`);
			if (unit.functions.size > 0)
			{
				console.error(`  Functions`);
				for (let item of unit.functions.values())
					console.error(`  -- ${item.toString()}`);
			}
			if (unit.variables.size > 0)
			{
				console.error(`  Variables`);
				for (let item of unit.variables.values())
					console.error(`  -- ${item.toString()}`);
			}
			if (unit.types.size > 0)
			{
				console.error(`  Types`);
				for (let item of unit.types.values())
					console.error(`  -- ${item.toString()}`);
			}
		}
	}
	if (mode == 'ast')
	{
		//console.log(util.inspect(unit, {showHidden: false, depth: null}))
		let visitor = new SvgPrinter();
		visitor.visitUnit(comp.ctx.units.values().next().value);
	}
}
