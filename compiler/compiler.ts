import { IStmt, Unit, Name, ClassStmt } from './types';
import { readfile, dirname, realpath, Map } from './io';
import { Scanner, Tokenizer } from './tokenizer';
import { Parser } from './parser';
import { TypeUID } from './typeinf';

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
        if (this.namespaceStack.length == 0) return null;

        let result : string[] = [];
        for (let name of this.namespaceStack)
            result.concat(name.lexemes);

        return new Name(result);
    }

    get currentNamespaceString() : string
    {
        if (this.namespaceStack.length == 0) return '';

        let result : string = '';
        let first = true;
        for (let name of this.namespaceStack)
        {
            if (!first) result += '.';
            first = false;
            result += name.lexemes;
        }
        return result;
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
    }

    compile( fileName : string )
    {
        if (this.ctx.units.contains(fileName)) return;
        console.error(`Compiling ${fileName}`);
        let source : string = readfile(fileName);
        let scanner = new Scanner(this.ctx, fileName, source);
        let tok = new Tokenizer(this.ctx, scanner);
        let parser = new Parser(tok, this.ctx);
        let unit : Unit;
        unit = parser.parseTopLevel();
        this.ctx.units.insert(fileName, unit);

        if (unit.imports)
        {
            let cdir = dirname(fileName);
            for (let imp of unit.imports)
            {
                let path = realpath(cdir + imp.source + '.ts');
                this.compile(path);
            }
        }

        //let typeuid = new TypeUID(this.ctx);
        //typeuid.process(unit);
    }

}