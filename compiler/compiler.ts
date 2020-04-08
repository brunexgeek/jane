import { IStmt, Unit, Name, ClassStmt } from './types';
import { readfile, dirname, realpath, Logger } from './utils';
import { Scanner, Tokenizer } from './tokenizer';
import { Parser, NodePromoter, injectObject, injectCallable } from './parser';

export class SourceLocation
{
    fileName : string;
    line : number;
    column : number;

    constructor( fileName : string, line : number = 1, column : number = 1 )
    {
        this.fileName = fileName;
        this.line = line;
        this.column = column;
    }

    clone() : SourceLocation
    {
        return new SourceLocation(this.fileName, this.line, this.column);
    }

    toString() : string
    {
        return this.line + ':' + this.column;
    }
}

export interface CompilationListener
{
	onStart() : void;

	onError( location : SourceLocation, error : Error ) : boolean;

	onWarning( location : SourceLocation, message : string ) : boolean;

	onFinish() : void;
}

export class CompilationContext
{
	listener : CompilationListener;
    units : Map<string, Unit> = new Map();
    types : Map<string, ClassStmt> = new Map();
    namespaceStack : Name[] = [];

	constructor( listener : CompilationListener )
	{
        this.listener = listener;
    }

    get currentNamespace() : Name
    {
        if (this.namespaceStack.length == 0) return new Name([]);

        let result : string[] = [];
        for (let name of this.namespaceStack)
            result = result.concat(name.lexemes);

        return new Name(result);
    }
}

export class CompilerError extends Error
{
	constructor( message : string )
	{
        super(message);
	}
}

export class Compiler
{
    ctx : CompilationContext;

    constructor( listener : CompilationListener )
    {
        this.ctx = new CompilationContext(listener);
        injectObject(this.ctx);
        injectCallable(this.ctx);
    }

    compile( fileName : string )
    {
        if (this.ctx.units.has(fileName)) return;
        Logger.writeln(`Compiling ${fileName}`);
        let source : string = readfile(fileName);
        let scanner = new Scanner(this.ctx, fileName, source);
        let tok = new Tokenizer(this.ctx, scanner);
        let parser = new Parser(tok, this.ctx);
        let unit : Unit;
        unit = parser.parse();
        if (unit)
        {
            this.ctx.units.set(fileName, unit);

            if (unit.imports)
            {
                let cdir = dirname(fileName);
                for (let imp of unit.imports)
                {
                    let path = realpath(cdir + imp.source + '.ts');
                    this.compile(path);
                }
            }

            let prom = new NodePromoter();
            prom.process(unit);
        }
    }

}