
/// <reference path="tree.ts" />
/// <reference path="tokenizer.ts" />
/* // <reference path="Parser.ts" /> */
/// <reference path="context.ts" />
/* // <reference path="AstPrinter.ts" /> */
/* // <reference path="generator.ts" /> */


class MyListener implements beagle.compiler.CompilationListener
{

	onStart() {
	}

	onError(location: beagle.compiler.SourceLocation, message: string): boolean {
		console.log(location.fileName + ':' + location.line + ":" + location.column + ': ERROR - ' + message);
		return true;
	}

	onWarning(location: beagle.compiler.SourceLocation, message: string): boolean {
		console.log(location.fileName + ':' + location.line + ":" + location.column + ': WARN - ' + message);
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
	process.exit(0);
}

let mode = process.argv[2];
let inputFileName = process.argv[3];
let outputFileName = process.argv[4];

let content = fs.readFileSync(inputFileName);

let ctx = new beagle.compiler.CompilationContext(new MyListener());


//let body = document.getElementsByTagName("body")[0];
let ss = new beagle.compiler.Scanner(ctx, inputFileName, content.toString() );
let tk = new beagle.compiler.Tokenizer(ctx, ss );

if (mode == 'tokenize')
{
	console.log('<html><body>');
	let tok : beagle.compiler.Token = null;
	while ((tok = tk.next()).type != beagle.compiler.TokenType.EOF)
	{
		let text = '<strong>' + ((tok.type === null) ? "???" : tok.type.name) + '</strong> ';
		if (tok.lexeme)
		{
			let color = '#070';
			if (tok.type == beagle.compiler.TokenType.STRING) color = '#f70';
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
	/*let pa = new beagle.compiler.Parser(ctx, sc);
	let unit = pa.parse();

	if (mode == 'generate')
	{
		//console.log("<html><body><pre>");
		let generator = new beagle.compiler.generator.CppGenerator(ctx);
		console.log(generator.generate(unit));
		//console.log("</pre></body></html>");
	}
	else
	if (mode == 'ast')
	{
		//console.log(util.inspect(unit, {showHidden: false, depth: null}))
		beagle.compiler.printCompilationUnit(unit);
	}*/
}
