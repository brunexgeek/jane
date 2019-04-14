
/// <reference path="tree.ts" />
/// <reference path="Scanner.ts" />
/// <reference path="Parser.ts" />
/// <reference path="context.ts" />
// / <reference path="AstPrinter.ts" />
/// <reference path="generator.ts" />


class MyListener implements beagle.compiler.CompilationListener
{
	onStart() {

	}
	onError(location: beagle.compiler.SourceLocation, message: string): boolean {
		throw new Error(message + " at " + location.line + ":" + location.column);
	}
	onWarning(location: beagle.compiler.SourceLocation, message: string): boolean {
		throw new Error(message + " at " + location.line + ":" + location.column);
	}
	onFinish() {

	}

}


declare var require: any;
require('source-map-support').install();
let fs = require("fs");
let util = require("util");
let process = require("process");

let fileName = 'input.txt';
if (process.argv.length == 3)
	fileName = process.argv[2];

let content = fs.readFileSync(fileName);

let ctx = new beagle.compiler.CompilationContext();
ctx.listener = new MyListener();

//let body = document.getElementsByTagName("body")[0];
let ss = new beagle.compiler.ScanString(ctx, "bla", content.toString() /*"function abobrinha { }"*/);
let sc = new beagle.compiler.Scanner(ctx, ss);

let tokenize = false;
if (tokenize)
{
	let tarr = new beagle.compiler.TokenArray(sc);
	let tok : beagle.compiler.Token = null;
	while ((tok = tarr.read()) != null)
	{
		if (tok.type == beagle.compiler.TokenType.TOK_EOF) break;
		let text = '[' + ((tok.type === null) ? "???" : tok.type.token) + '] ';
		if (tok.value != null) text += "'" + tok.value + "'";
		if (tok.location != null) text += ' at ' + tok.location.line + ':' + tok.location.column;
		console.log(text);
		///let tmp = document.createElement("span");
		//tmp.innerHTML = tok.value;
		//body.appendChild(tmp);
	}
}
else
{
	let pa = new beagle.compiler.Parser(ctx, sc);
	let unit = pa.parse();

	console.log(util.inspect(unit, {showHidden: false, depth: null}))
	//beagle.compiler.printCompilationUnit(unit);

	//beagle.compiler.generator.generate(ctx, unit);
	//console.log(ctx.generated);
}
