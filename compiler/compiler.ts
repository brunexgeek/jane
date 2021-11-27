
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

import { IStmt, Unit, Name, ClassStmt, StrClassMap, StrUnitMap, StrClassStmtMap, VariableStmt } from './types';
import { readfile, dirname, realpath, Logger } from './utils';
import { Scanner, Tokenizer } from './tokenizer';
import { Parser, createObject, createCallable, createError, createString } from './parser';
import { TypeInference } from './typeinf';
import { ParseError } from './exception';

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
    units : StrUnitMap = new StrUnitMap();
    //types : StrClassMap = new StrClassMap();
    namespaceStack : Name[] = [];
    array_types: StrClassStmtMap = new StrClassStmtMap();

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
    hasError : boolean = false;

    constructor( listener : CompilationListener )
    {
        this.ctx = new CompilationContext(listener);
        //let type = createObject();
        //this.ctx.types.set(type.name.qualified, type);
        //type = createCallable();
        //this.ctx.types.set(type.name.qualified, type);
        //type = createError();
        //this.ctx.types.set(type.name.qualified, type);
        //type = createString();
        //this.ctx.types.set(type.name.qualified, type);
    }

    error( location : SourceLocation, message : string ) : ParseError
    {
        let result = new ParseError(message, location);
        this.ctx.listener.onError(location, result);
        return result;
    }

    parseSource( fileName : string ) : Unit
    {
        if (this.ctx.units.has(fileName)) return;

        Logger.writeln(`Parsing '${fileName}'`);
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
                    this.parseSource(path);
                }
            }

            //let prom = new NodePromoter();
            //prom.process(unit);
        }
        else
            this.hasError = true;

        return unit;
    }

    findGlobalSymbol( unit : Unit, name : string ) : IStmt
    {
        let stmt = <IStmt> unit.variables.get(name);
        if (stmt) return stmt;
        stmt = <IStmt> unit.functions.get(name);
        if (stmt) return stmt;
        stmt = <IStmt> unit.types.get(name);
        if (stmt) return stmt;
        stmt = <IStmt> unit.enums.get(name);
        if (stmt) return stmt;
        return null;
    }

    processImports()
    {
        for (let unit of this.ctx.units.values())
        {
            // check whether the imported symbols exist
            let dir = dirname(unit.fileName);
            for (let imp of unit.imports)
            {
                let source = realpath(dir + imp.source + '.ts');
                let cunit = this.ctx.units.get(source);
                if (!cunit)
                {
                    this.error(imp.location, `Missing symbols for ${source}`); // never should happen
                    this.hasError = true;
                }
                for (let name of imp.names)
                {
                    let stmt = this.findGlobalSymbol(cunit, name.qualified);
                    if (!stmt)
                    {
                        this.error(name.location, `Unable to find symbol ${name.qualified}`);
                        this.hasError = true;
                    }
                    unit.imports_.set(name.qualified, stmt);
                }
            }

            // append the built-in types
            let type = createObject();
            unit.imports_.set(type.name.qualified, type);
            type = createCallable();
            unit.imports_.set(type.name.qualified, type);
            type = createError();
            unit.imports_.set(type.name.qualified, type);
            type = createString();
            unit.imports_.set(type.name.qualified, type);
        }
    }

    typeInference()
    {
        let inf = new TypeInference(this.ctx);
        for (let unit of this.ctx.units.values())
            this.hasError = !inf.typeInference(unit);
    }

    compile( fileName : string ) : boolean
    {
        // generate AST
        this.parseSource(fileName);
        if (this.hasError) return false;
        this.processImports();
        if (this.hasError) return false;
        this.typeInference();
        if (this.hasError) return false;
        // TODO: AST simplification (e.g. for...of -> for)
        // TODO: AST optimizations (e.g. dead code elimination, promote objects to stack)
        // TODO: code generation
        return true;
    }

}
