import { IStmt, Unit } from './types';
import { readfile, dirname } from './io';
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

	onError( location : SourceLocation, message : string ) : boolean;

	onWarning( location : SourceLocation, message : string ) : boolean;

	onFinish() : void;
}

class StmtMap
{
    keys : string[] = [];
    values : IStmt[] = [];

    find( key : string ) : IStmt
    {
        let idx = this.keys.indexOf(key);
        if (idx == -1) return null;
        return this.values[idx];
    }

    insert( key : string, value : IStmt )
    {
        this.keys.push(key);
        this.values.push(value);
    }
}

export class CompilationContext
{
	listener : CompilationListener;
	stringTable : string[];
    generated : string;
    types : StmtMap = new StmtMap();

	constructor( listener : CompilationListener )
	{
		this.listener = listener;
		this.stringTable = [];
		this.generated = "";
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

    compile( fileName : string ) : Unit[]
    {
        let result : Unit[] = [];
        let source : string = readfile(fileName);
        let scanner = new Scanner(this.ctx, fileName, source);
        let tok = new Tokenizer(this.ctx, scanner);
        let parser = new Parser(tok, this.ctx);
        let unit : Unit;
        unit = parser.parseTopLevel();

        if (unit.imports)
        {
            let cdir = dirname(fileName);
            for (let imp of unit.imports)
            {
                let path = cdir + imp.source;
                result.concat( this.compile(path) );
            }
        }

        //let typeuid = new TypeUID(this.ctx);
        //typeuid.process(unit);
        result.push(unit);

        return result;
    }

}