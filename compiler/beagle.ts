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
	CompilationListener,
	CompilationContext,
	SourceLocation,
	Scanner,
	Token,
	TokenType } from './tokenizer';
import { Unit } from './types';
import { Parser } from './parser';
import { SvgPrinter } from './visitor';
import { TypeUID } from './typeinf';

class MyListener implements CompilationListener
{

	onStart() {
	}

	onError(location: SourceLocation, message: string): boolean {
		console.error(location.fileName + ':' + location.line + ":" + location.column + ': ERROR - ' + message);
		process.exit(1);
		return true;
	}

	onWarning(location: SourceLocation, message: string): boolean {
		console.error(location.fileName + ':' + location.line + ":" + location.column + ': WARN - ' + message);
		return true;
	}

	onFinish() {
	}

}

declare var require: any;
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

let content = fs.readFileSync(inputFileName);

let ctx = new CompilationContext(new MyListener());


//let body = document.getElementsByTagName("body")[0];
let ss = new Scanner(ctx, inputFileName, content.toString() );
let tk = new Tokenizer(ctx, ss );

if (mode == 'tokenize')
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
else
{
	let pa = new Parser(tk, ctx);
	let unit : Unit;
	try {
		unit = pa.parseTopLevel();
	} catch (error)
	{
		process.exit(1);
	}

	let visitor = new TypeUID(ctx);
	visitor.visitUnit(unit);

	/*if (mode == 'generate')
	{
		//console.log("<html><body><pre>");
		let generator = new beagle.compiler.generator.CppGenerator(ctx);
		console.log(generator.generate(unit));
		//console.log("</pre></body></html>");
	}
	else*/
	if (mode == 'ast')
	{
		//console.log(util.inspect(unit, {showHidden: false, depth: null}))
		let visitor = new SvgPrinter();
		visitor.visitUnit(unit);
	}
}
