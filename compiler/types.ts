
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

/*
 * AUTO-GENERATED CODE. DO NOT EDIT!
 */

import { TokenType } from './tokenizer';
import { SourceLocation } from './compiler';

export interface INode
{
    accept<T>( visitor : IVisitor<T> ) : T;
    className(): string;
}

export interface IStmt extends INode { }

export interface IExpr extends INode { }

export class Name implements IExpr
{
	lexemes : string[];
	location : SourceLocation;
	constructor( lexemes : string[], location : SourceLocation = null )
	{
		this.lexemes = lexemes;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitName(this); }
	className() : string { return 'Name'; }
	toString() : string
    {
        let result = '';
        let first = true;
        for (let i of this.lexemes)
        {
            if (!first) result += '.';
            first = false;
            result += i;
        }
        return result;
    }
    get canonical() : string {
        if (this.lexemes.length > 0)
            return this.lexemes[ this.lexemes.length - 1 ];
        else
            return '';
    }
    get qualified() : string { return this.toString(); }
    append( name : Name ) {
        for (let s of name.lexemes) this.lexemes.push(s);
    }
    push( name : string ) { this.lexemes.push(name); }
    clone() : Name { return new Name([...this.lexemes], this.location); }
    get parent() : Name {
        let name = this.clone();
        name.lexemes.pop();
        return name;
    }
}
export class StringLiteral implements IExpr
{
	value : string;
	type : TokenType;
	location : SourceLocation;
	constructor( value : string, type : TokenType, location : SourceLocation = null )
	{
		this.value = value;
		this.type = type;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitStringLiteral(this); }
	className() : string { return 'StringLiteral'; }
}

export class NumberLiteral implements IExpr
{
	value : string;
	converted : number;
	location : SourceLocation;
	constructor( value : string, converted : number, location : SourceLocation = null )
	{
		this.value = value;
		this.converted = converted;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitNumberLiteral(this); }
	className() : string { return 'NumberLiteral'; }
}

export class BoolLiteral implements IExpr
{
	converted : boolean;
	location : SourceLocation;
	constructor( converted : boolean, location : SourceLocation = null )
	{
		this.converted = converted;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitBoolLiteral(this); }
	className() : string { return 'BoolLiteral'; }
}

export class NameLiteral implements IExpr
{
	value : string;
	location : SourceLocation;
	constructor( value : string, location : SourceLocation = null )
	{
		this.value = value;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitNameLiteral(this); }
	className() : string { return 'NameLiteral'; }
}

export class Group implements IExpr
{
	expr : IExpr;
	location : SourceLocation;
	constructor( expr : IExpr, location : SourceLocation = null )
	{
		this.expr = expr;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitGroup(this); }
	className() : string { return 'Group'; }
}

export class NullLiteral implements IExpr
{
	location : SourceLocation;
	constructor( location : SourceLocation = null )
	{
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitNullLiteral(this); }
	className() : string { return 'NullLiteral'; }
}

export class LogicalExpr implements IExpr
{
	left : IExpr;
	oper : TokenType;
	right : IExpr;
	location : SourceLocation;
	constructor( left : IExpr, oper : TokenType, right : IExpr, location : SourceLocation = null )
	{
		this.left = left;
		this.oper = oper;
		this.right = right;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitLogicalExpr(this); }
	className() : string { return 'LogicalExpr'; }
}

export class BinaryExpr implements IExpr
{
	left : IExpr;
	oper : TokenType;
	right : IExpr;
	location : SourceLocation;
	constructor( left : IExpr, oper : TokenType, right : IExpr, location : SourceLocation = null )
	{
		this.left = left;
		this.oper = oper;
		this.right = right;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitBinaryExpr(this); }
	className() : string { return 'BinaryExpr'; }
}

export class AssignExpr implements IExpr
{
	left : IExpr;
	oper : TokenType;
	right : IExpr;
	location : SourceLocation;
	constructor( left : IExpr, oper : TokenType, right : IExpr, location : SourceLocation = null )
	{
		this.left = left;
		this.oper = oper;
		this.right = right;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitAssignExpr(this); }
	className() : string { return 'AssignExpr'; }
}

export class UnaryExpr implements IExpr
{
	oper : TokenType;
	expr : IExpr;
	post : boolean;
	location : SourceLocation;
	constructor( oper : TokenType, expr : IExpr, post : boolean, location : SourceLocation = null )
	{
		this.oper = oper;
		this.expr = expr;
		this.post = post;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitUnaryExpr(this); }
	className() : string { return 'UnaryExpr'; }
}

export class TypeCastExpr implements IExpr
{
	type : TypeRef;
	expr : IExpr;
	location : SourceLocation;
	constructor( type : TypeRef, expr : IExpr, location : SourceLocation = null )
	{
		this.type = type;
		this.expr = expr;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitTypeCastExpr(this); }
	className() : string { return 'TypeCastExpr'; }
}

export class CallExpr implements IExpr
{
	callee : IExpr;
	args : IExpr[];
	location : SourceLocation;
	constructor( callee : IExpr, args : IExpr[], location : SourceLocation = null )
	{
		this.callee = callee;
		this.args = args;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitCallExpr(this); }
	className() : string { return 'CallExpr'; }
}

export class ArrayExpr implements IExpr
{
	values : IExpr[];
	location : SourceLocation;
	constructor( values : IExpr[], location : SourceLocation = null )
	{
		this.values = values;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitArrayExpr(this); }
	className() : string { return 'ArrayExpr'; }
}

export class ArrayAccessExpr implements IExpr
{
	callee : IExpr;
	index : IExpr;
	location : SourceLocation;
	constructor( callee : IExpr, index : IExpr, location : SourceLocation = null )
	{
		this.callee = callee;
		this.index = index;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitArrayAccessExpr(this); }
	className() : string { return 'ArrayAccessExpr'; }
}

export class FieldExpr implements IExpr
{
	callee : IExpr;
	name : Name;
	location : SourceLocation;
	constructor( callee : IExpr, name : Name, location : SourceLocation = null )
	{
		this.callee = callee;
		this.name = name;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitFieldExpr(this); }
	className() : string { return 'FieldExpr'; }
}

export class NewExpr implements IExpr
{
	type : TypeRef;
	args : IExpr[];
	location : SourceLocation;
	constructor( type : TypeRef, args : IExpr[], location : SourceLocation = null )
	{
		this.type = type;
		this.args = args;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitNewExpr(this); }
	className() : string { return 'NewExpr'; }
}

export class Accessor implements INode
{
	values : TokenType[];
	location : SourceLocation;
	constructor( values : TokenType[], location : SourceLocation = null )
	{
		this.values = values;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitAccessor(this); }
	className() : string { return 'Accessor'; }
isStatic() : boolean { return this.values.indexOf(TokenType.STATIC) >= 0; }
}export class BlockStmt implements IStmt
{
	stmts : IStmt[];
	location : SourceLocation;
	constructor( stmts : IStmt[], location : SourceLocation = null )
	{
		this.stmts = stmts;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitBlockStmt(this); }
	className() : string { return 'BlockStmt'; }
}

export class ReturnStmt implements IStmt
{
	expr : IExpr;
	location : SourceLocation;
	constructor( expr : IExpr, location : SourceLocation = null )
	{
		this.expr = expr;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitReturnStmt(this); }
	className() : string { return 'ReturnStmt'; }
}

export class NamespaceStmt implements IStmt
{
	name : Name;
	stmts : IStmt[];
	accessor : Accessor;
	location : SourceLocation;
	constructor( name : Name, stmts : IStmt[], accessor : Accessor = null, location : SourceLocation = null )
	{
		this.name = name;
		this.stmts = stmts;
		this.accessor = accessor;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitNamespaceStmt(this); }
	className() : string { return 'NamespaceStmt'; }
}

export class NameAndGenerics implements INode
{
	name : Name;
	generics : NameAndGenerics[];
	location : SourceLocation;
	constructor( name : Name, generics : NameAndGenerics[], location : SourceLocation = null )
	{
		this.name = name;
		this.generics = generics;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitNameAndGenerics(this); }
	className() : string { return 'NameAndGenerics'; }
	toString( qualified : boolean = true) : string
    {
        let result = '';
        if (qualified)
            result = this.name.qualified;
        else
            result = this.name.canonical;
        if (this.generics && this.generics.length > 0)
        {
            result += '<';
            let first = true;
            for (let i of this.generics)
            {
                if (!first) result += '.';
                first = false;
                result += i.toString(qualified);
            }
            result += '>';
        }
        return result;
    }
    get canonical() : string { return this.toString(false); }
    get qualified() : string { return this.toString(); }
}
export class TypeRef implements INode
{
	name : Name;
	generics : TypeRef[];
	dims : number;
	nullable : boolean;
	location : SourceLocation;
	constructor( name : Name, generics : TypeRef[], dims : number, nullable : boolean, location : SourceLocation = null )
	{
		this.name = name;
		this.generics = generics;
		this.dims = dims;
		this.nullable = nullable;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitTypeRef(this); }
	className() : string { return 'TypeRef'; }
	toString( qualified : boolean = true) : string
    {
        let result = '';
        if (qualified)
            result = this.name.qualified;
        else
            result = this.name.canonical;
        if (this.generics && this.generics.length > 0)
        {
            result += '<';
            let first = true;
            for (let i of this.generics)
            {
                if (!first) result += '.';
                first = false;
                result += i.toString(qualified);
            }
            result += '>';
            let i = this.dims;
            while (i-- > 0) result += '[]';
            return result;
        }
        if (this.nullable) result += ' | null';
        return result;
    }
    get canonical() : string { return this.toString(false); }
    get qualified() : string { return this.toString(); }
}
export class CaseStmt implements IStmt
{
	expr : IExpr;
	stmts : IStmt[];
	location : SourceLocation;
	constructor( expr : IExpr, stmts : IStmt[], location : SourceLocation = null )
	{
		this.expr = expr;
		this.stmts = stmts;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitCaseStmt(this); }
	className() : string { return 'CaseStmt'; }
}

export class SwitchStmt implements IStmt
{
	expr : IExpr;
	cases : IStmt[];
	location : SourceLocation;
	constructor( expr : IExpr, cases : IStmt[], location : SourceLocation = null )
	{
		this.expr = expr;
		this.cases = cases;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitSwitchStmt(this); }
	className() : string { return 'SwitchStmt'; }
}

export class IfStmt implements IStmt
{
	condition : IStmt;
	thenSide : IStmt;
	elseSide : IStmt;
	location : SourceLocation;
	constructor( condition : IStmt, thenSide : IStmt, elseSide : IStmt, location : SourceLocation = null )
	{
		this.condition = condition;
		this.thenSide = thenSide;
		this.elseSide = elseSide;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitIfStmt(this); }
	className() : string { return 'IfStmt'; }
}

export class ForOfStmt implements IExpr
{
	variable : VariableStmt;
	expr : IExpr;
	stmt : IStmt;
	location : SourceLocation;
	constructor( variable : VariableStmt, expr : IExpr, stmt : IStmt, location : SourceLocation = null )
	{
		this.variable = variable;
		this.expr = expr;
		this.stmt = stmt;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitForOfStmt(this); }
	className() : string { return 'ForOfStmt'; }
}

export class ForStmt implements IExpr
{
	init : IStmt;
	condition : IExpr;
	fexpr : IExpr;
	stmt : IStmt;
	location : SourceLocation;
	constructor( init : IStmt, condition : IExpr, fexpr : IExpr, stmt : IStmt, location : SourceLocation = null )
	{
		this.init = init;
		this.condition = condition;
		this.fexpr = fexpr;
		this.stmt = stmt;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitForStmt(this); }
	className() : string { return 'ForStmt'; }
}

export class DoWhileStmt implements IStmt
{
	stmt : IStmt;
	condition : IExpr;
	location : SourceLocation;
	constructor( stmt : IStmt, condition : IExpr, location : SourceLocation = null )
	{
		this.stmt = stmt;
		this.condition = condition;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitDoWhileStmt(this); }
	className() : string { return 'DoWhileStmt'; }
}

export class WhileStmt implements IStmt
{
	condition : IStmt;
	stmt : IStmt;
	location : SourceLocation;
	constructor( condition : IStmt, stmt : IStmt, location : SourceLocation = null )
	{
		this.condition = condition;
		this.stmt = stmt;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitWhileStmt(this); }
	className() : string { return 'WhileStmt'; }
}

export class Parameter implements INode
{
	name : Name;
	type : TypeRef;
	init : IExpr;
	vararg : boolean;
	location : SourceLocation;
	constructor( name : Name, type : TypeRef, init : IExpr, vararg : boolean, location : SourceLocation = null )
	{
		this.name = name;
		this.type = type;
		this.init = init;
		this.vararg = vararg;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitParameter(this); }
	className() : string { return 'Parameter'; }
}

export class ExpandExpr implements IExpr
{
	name : Name;
	location : SourceLocation;
	constructor( name : Name, location : SourceLocation = null )
	{
		this.name = name;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitExpandExpr(this); }
	className() : string { return 'ExpandExpr'; }
}

export class FunctionStmt implements IStmt
{
	name : Name;
	generics : Name[];
	params : Parameter[];
	type : TypeRef;
	body : BlockStmt;
	accessor : Accessor;
	property : TokenType = null;
	location : SourceLocation;
	constructor( name : Name, generics : Name[], params : Parameter[], type : TypeRef, body : BlockStmt, accessor : Accessor = null, location : SourceLocation = null )
	{
		this.name = name;
		this.generics = generics;
		this.params = params;
		this.type = type;
		this.body = body;
		this.accessor = accessor;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitFunctionStmt(this); }
	className() : string { return 'FunctionStmt'; }

    toString(): string
    {
        let result = '';
        if (this.property == TokenType.SET)
            result += 'set ';
        else
        if (this.property == TokenType.GET)
            result += 'get ';
        result += `${this.name.toString()}(`;
        let first = true;
        for (let par of this.params)
        {
            if (!first) result += ',';
            first = false;
            if (par.vararg) result += '...';
            result += `${par.name.toString()}:${par.type.toString()}`;
        }
        result += `):${this.type.toString()}`;
        return result;
    }
}
export class ClassStmt implements IStmt
{
	name : NameAndGenerics;
	extended : NameAndGenerics;
	implemented : NameAndGenerics[];
	stmts : IStmt[];
	accessor : Accessor;
	location : SourceLocation;
	constructor( name : NameAndGenerics, extended : NameAndGenerics, implemented : NameAndGenerics[], stmts : IStmt[], accessor : Accessor = null, location : SourceLocation = null )
	{
		this.name = name;
		this.extended = extended;
		this.implemented = implemented;
		this.stmts = stmts;
		this.accessor = accessor;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitClassStmt(this); }
	className() : string { return 'ClassStmt'; }
toString() : string
    {
        let result = this.name.toString();
        if (this.extended) result += ` extends ${this.extended.toString()}`;
        if (this.implemented && this.implemented.length > 0)
        {
            result += ' implements ';
            let first = true;
            for (let type of this.implemented)
            {
                if (!first) result += ', ';
                first = false;
                result += type.toString();
            }
        }
        return result;
    }
}export class ExprStmt implements IStmt
{
	expr : IExpr;
	location : SourceLocation;
	constructor( expr : IExpr, location : SourceLocation = null )
	{
		this.expr = expr;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitExprStmt(this); }
	className() : string { return 'ExprStmt'; }
}

export class BreakStmt implements IStmt
{
	location : SourceLocation;
	constructor( location : SourceLocation = null )
	{
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitBreakStmt(this); }
	className() : string { return 'BreakStmt'; }
}

export class ContinueStmt implements IStmt
{
	location : SourceLocation;
	constructor( location : SourceLocation = null )
	{
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitContinueStmt(this); }
	className() : string { return 'ContinueStmt'; }
}

export class ImportStmt implements IStmt
{
	names : Name[];
	source : string;
	location : SourceLocation;
	constructor( names : Name[], source : string, location : SourceLocation = null )
	{
		this.names = names;
		this.source = source;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitImportStmt(this); }
	className() : string { return 'ImportStmt'; }
}

export class VariableStmt implements IStmt
{
	name : Name;
	type : TypeRef;
	init : IExpr;
	constant : boolean;
	accessor : Accessor;
	location : SourceLocation;
	constructor( name : Name, type : TypeRef, init : IExpr, constant : boolean, accessor : Accessor = null, location : SourceLocation = null )
	{
		this.name = name;
		this.type = type;
		this.init = init;
		this.constant = constant;
		this.accessor = accessor;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitVariableStmt(this); }
	className() : string { return 'VariableStmt'; }

    toString() : string
    {
        let result : string;
        if (this.constant) result = 'const '; else result = 'let ';
        result += this.name.toString();
        if (this.type) result += ` : ${this.type.toString()}`;
        return result;
    }
}
export class PropertyStmt implements IStmt
{
	name : Name;
	type : TypeRef;
	init : IExpr;
	accessor : Accessor;
	location : SourceLocation;
	constructor( name : Name, type : TypeRef, init : IExpr, accessor : Accessor = null, location : SourceLocation = null )
	{
		this.name = name;
		this.type = type;
		this.init = init;
		this.accessor = accessor;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitPropertyStmt(this); }
	className() : string { return 'PropertyStmt'; }

    toString() : string
    {
        let result = this.name.toString();
        if (this.type) result += ` : ${this.type.toString()}`;
        return result;
    }
}
export class TryCatchStmt implements IStmt
{
	block : IStmt;
	variable : Name;
	cblock : IStmt;
	fblock : IStmt;
	location : SourceLocation;
	constructor( block : IStmt, variable : Name, cblock : IStmt, fblock : IStmt, location : SourceLocation = null )
	{
		this.block = block;
		this.variable = variable;
		this.cblock = cblock;
		this.fblock = fblock;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitTryCatchStmt(this); }
	className() : string { return 'TryCatchStmt'; }
}

export class ThrowStmt implements IStmt
{
	expr : IExpr;
	location : SourceLocation;
	constructor( expr : IExpr, location : SourceLocation = null )
	{
		this.expr = expr;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitThrowStmt(this); }
	className() : string { return 'ThrowStmt'; }
}

export class Unit implements INode
{
	fileName : string = '';
	stmts : IStmt[];
	imports : ImportStmt[];
	variables : Map<string,VariableStmt> = new Map();
	types : Map<string,ClassStmt> = new Map();
	functions : Map<string,FunctionStmt> = new Map();
	location : SourceLocation;
	constructor( stmts : IStmt[], imports : ImportStmt[], location : SourceLocation = null )
	{
		this.stmts = stmts;
		this.imports = imports;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitUnit(this); }
	className() : string { return 'Unit'; }
}

export interface IVisitor<T>{
	visitName( target : Name) : T;
	visitStringLiteral( target : StringLiteral) : T;
	visitNumberLiteral( target : NumberLiteral) : T;
	visitBoolLiteral( target : BoolLiteral) : T;
	visitNameLiteral( target : NameLiteral) : T;
	visitGroup( target : Group) : T;
	visitNullLiteral( target : NullLiteral) : T;
	visitLogicalExpr( target : LogicalExpr) : T;
	visitBinaryExpr( target : BinaryExpr) : T;
	visitAssignExpr( target : AssignExpr) : T;
	visitUnaryExpr( target : UnaryExpr) : T;
	visitTypeCastExpr( target : TypeCastExpr) : T;
	visitCallExpr( target : CallExpr) : T;
	visitArrayExpr( target : ArrayExpr) : T;
	visitArrayAccessExpr( target : ArrayAccessExpr) : T;
	visitFieldExpr( target : FieldExpr) : T;
	visitNewExpr( target : NewExpr) : T;
	visitAccessor( target : Accessor) : T;
	visitBlockStmt( target : BlockStmt) : T;
	visitReturnStmt( target : ReturnStmt) : T;
	visitNamespaceStmt( target : NamespaceStmt) : T;
	visitNameAndGenerics( target : NameAndGenerics) : T;
	visitTypeRef( target : TypeRef) : T;
	visitCaseStmt( target : CaseStmt) : T;
	visitSwitchStmt( target : SwitchStmt) : T;
	visitIfStmt( target : IfStmt) : T;
	visitForOfStmt( target : ForOfStmt) : T;
	visitForStmt( target : ForStmt) : T;
	visitDoWhileStmt( target : DoWhileStmt) : T;
	visitWhileStmt( target : WhileStmt) : T;
	visitParameter( target : Parameter) : T;
	visitExpandExpr( target : ExpandExpr) : T;
	visitFunctionStmt( target : FunctionStmt) : T;
	visitClassStmt( target : ClassStmt) : T;
	visitExprStmt( target : ExprStmt) : T;
	visitBreakStmt( target : BreakStmt) : T;
	visitContinueStmt( target : ContinueStmt) : T;
	visitImportStmt( target : ImportStmt) : T;
	visitVariableStmt( target : VariableStmt) : T;
	visitPropertyStmt( target : PropertyStmt) : T;
	visitTryCatchStmt( target : TryCatchStmt) : T;
	visitThrowStmt( target : ThrowStmt) : T;
	visitUnit( target : Unit) : T;
}

export class Visitor implements IVisitor<void> {
	visitName( target : Name) : void {}
	visitStringLiteral( target : StringLiteral) : void {}
	visitNumberLiteral( target : NumberLiteral) : void {}
	visitBoolLiteral( target : BoolLiteral) : void {}
	visitNameLiteral( target : NameLiteral) : void {}
	visitGroup( target : Group) : void {}
	visitNullLiteral( target : NullLiteral) : void {}
	visitLogicalExpr( target : LogicalExpr) : void {}
	visitBinaryExpr( target : BinaryExpr) : void {}
	visitAssignExpr( target : AssignExpr) : void {}
	visitUnaryExpr( target : UnaryExpr) : void {}
	visitTypeCastExpr( target : TypeCastExpr) : void {}
	visitCallExpr( target : CallExpr) : void {}
	visitArrayExpr( target : ArrayExpr) : void {}
	visitArrayAccessExpr( target : ArrayAccessExpr) : void {}
	visitFieldExpr( target : FieldExpr) : void {}
	visitNewExpr( target : NewExpr) : void {}
	visitAccessor( target : Accessor) : void {}
	visitBlockStmt( target : BlockStmt) : void {}
	visitReturnStmt( target : ReturnStmt) : void {}
	visitNamespaceStmt( target : NamespaceStmt) : void {}
	visitNameAndGenerics( target : NameAndGenerics) : void {}
	visitTypeRef( target : TypeRef) : void {}
	visitCaseStmt( target : CaseStmt) : void {}
	visitSwitchStmt( target : SwitchStmt) : void {}
	visitIfStmt( target : IfStmt) : void {}
	visitForOfStmt( target : ForOfStmt) : void {}
	visitForStmt( target : ForStmt) : void {}
	visitDoWhileStmt( target : DoWhileStmt) : void {}
	visitWhileStmt( target : WhileStmt) : void {}
	visitParameter( target : Parameter) : void {}
	visitExpandExpr( target : ExpandExpr) : void {}
	visitFunctionStmt( target : FunctionStmt) : void {}
	visitClassStmt( target : ClassStmt) : void {}
	visitExprStmt( target : ExprStmt) : void {}
	visitBreakStmt( target : BreakStmt) : void {}
	visitContinueStmt( target : ContinueStmt) : void {}
	visitImportStmt( target : ImportStmt) : void {}
	visitVariableStmt( target : VariableStmt) : void {}
	visitPropertyStmt( target : PropertyStmt) : void {}
	visitTryCatchStmt( target : TryCatchStmt) : void {}
	visitThrowStmt( target : ThrowStmt) : void {}
	visitUnit( target : Unit) : void {}
}

export abstract class Dispatcher<T> {
	protected abstract visitName( target : Name) : T;
	protected abstract visitStringLiteral( target : StringLiteral) : T;
	protected abstract visitNumberLiteral( target : NumberLiteral) : T;
	protected abstract visitBoolLiteral( target : BoolLiteral) : T;
	protected abstract visitNameLiteral( target : NameLiteral) : T;
	protected abstract visitGroup( target : Group) : T;
	protected abstract visitNullLiteral( target : NullLiteral) : T;
	protected abstract visitLogicalExpr( target : LogicalExpr) : T;
	protected abstract visitBinaryExpr( target : BinaryExpr) : T;
	protected abstract visitAssignExpr( target : AssignExpr) : T;
	protected abstract visitUnaryExpr( target : UnaryExpr) : T;
	protected abstract visitTypeCastExpr( target : TypeCastExpr) : T;
	protected abstract visitCallExpr( target : CallExpr) : T;
	protected abstract visitArrayExpr( target : ArrayExpr) : T;
	protected abstract visitArrayAccessExpr( target : ArrayAccessExpr) : T;
	protected abstract visitFieldExpr( target : FieldExpr) : T;
	protected abstract visitNewExpr( target : NewExpr) : T;
	protected abstract visitAccessor( target : Accessor) : T;
	protected abstract visitBlockStmt( target : BlockStmt) : T;
	protected abstract visitReturnStmt( target : ReturnStmt) : T;
	protected abstract visitNamespaceStmt( target : NamespaceStmt) : T;
	protected abstract visitNameAndGenerics( target : NameAndGenerics) : T;
	protected abstract visitTypeRef( target : TypeRef) : T;
	protected abstract visitCaseStmt( target : CaseStmt) : T;
	protected abstract visitSwitchStmt( target : SwitchStmt) : T;
	protected abstract visitIfStmt( target : IfStmt) : T;
	protected abstract visitForOfStmt( target : ForOfStmt) : T;
	protected abstract visitForStmt( target : ForStmt) : T;
	protected abstract visitDoWhileStmt( target : DoWhileStmt) : T;
	protected abstract visitWhileStmt( target : WhileStmt) : T;
	protected abstract visitParameter( target : Parameter) : T;
	protected abstract visitExpandExpr( target : ExpandExpr) : T;
	protected abstract visitFunctionStmt( target : FunctionStmt) : T;
	protected abstract visitClassStmt( target : ClassStmt) : T;
	protected abstract visitExprStmt( target : ExprStmt) : T;
	protected abstract visitBreakStmt( target : BreakStmt) : T;
	protected abstract visitContinueStmt( target : ContinueStmt) : T;
	protected abstract visitImportStmt( target : ImportStmt) : T;
	protected abstract visitVariableStmt( target : VariableStmt) : T;
	protected abstract visitPropertyStmt( target : PropertyStmt) : T;
	protected abstract visitTryCatchStmt( target : TryCatchStmt) : T;
	protected abstract visitThrowStmt( target : ThrowStmt) : T;
	protected abstract visitUnit( target : Unit) : T;
	protected dispatch( node : INode ) : T {
		if (!node) return;
		switch (node.className()) {
			case 'Name': return this.visitName(<Name>node);
			case 'StringLiteral': return this.visitStringLiteral(<StringLiteral>node);
			case 'NumberLiteral': return this.visitNumberLiteral(<NumberLiteral>node);
			case 'BoolLiteral': return this.visitBoolLiteral(<BoolLiteral>node);
			case 'NameLiteral': return this.visitNameLiteral(<NameLiteral>node);
			case 'Group': return this.visitGroup(<Group>node);
			case 'NullLiteral': return this.visitNullLiteral(<NullLiteral>node);
			case 'LogicalExpr': return this.visitLogicalExpr(<LogicalExpr>node);
			case 'BinaryExpr': return this.visitBinaryExpr(<BinaryExpr>node);
			case 'AssignExpr': return this.visitAssignExpr(<AssignExpr>node);
			case 'UnaryExpr': return this.visitUnaryExpr(<UnaryExpr>node);
			case 'TypeCastExpr': return this.visitTypeCastExpr(<TypeCastExpr>node);
			case 'CallExpr': return this.visitCallExpr(<CallExpr>node);
			case 'ArrayExpr': return this.visitArrayExpr(<ArrayExpr>node);
			case 'ArrayAccessExpr': return this.visitArrayAccessExpr(<ArrayAccessExpr>node);
			case 'FieldExpr': return this.visitFieldExpr(<FieldExpr>node);
			case 'NewExpr': return this.visitNewExpr(<NewExpr>node);
			case 'Accessor': return this.visitAccessor(<Accessor>node);
			case 'BlockStmt': return this.visitBlockStmt(<BlockStmt>node);
			case 'ReturnStmt': return this.visitReturnStmt(<ReturnStmt>node);
			case 'NamespaceStmt': return this.visitNamespaceStmt(<NamespaceStmt>node);
			case 'NameAndGenerics': return this.visitNameAndGenerics(<NameAndGenerics>node);
			case 'TypeRef': return this.visitTypeRef(<TypeRef>node);
			case 'CaseStmt': return this.visitCaseStmt(<CaseStmt>node);
			case 'SwitchStmt': return this.visitSwitchStmt(<SwitchStmt>node);
			case 'IfStmt': return this.visitIfStmt(<IfStmt>node);
			case 'ForOfStmt': return this.visitForOfStmt(<ForOfStmt>node);
			case 'ForStmt': return this.visitForStmt(<ForStmt>node);
			case 'DoWhileStmt': return this.visitDoWhileStmt(<DoWhileStmt>node);
			case 'WhileStmt': return this.visitWhileStmt(<WhileStmt>node);
			case 'Parameter': return this.visitParameter(<Parameter>node);
			case 'ExpandExpr': return this.visitExpandExpr(<ExpandExpr>node);
			case 'FunctionStmt': return this.visitFunctionStmt(<FunctionStmt>node);
			case 'ClassStmt': return this.visitClassStmt(<ClassStmt>node);
			case 'ExprStmt': return this.visitExprStmt(<ExprStmt>node);
			case 'BreakStmt': return this.visitBreakStmt(<BreakStmt>node);
			case 'ContinueStmt': return this.visitContinueStmt(<ContinueStmt>node);
			case 'ImportStmt': return this.visitImportStmt(<ImportStmt>node);
			case 'VariableStmt': return this.visitVariableStmt(<VariableStmt>node);
			case 'PropertyStmt': return this.visitPropertyStmt(<PropertyStmt>node);
			case 'TryCatchStmt': return this.visitTryCatchStmt(<TryCatchStmt>node);
			case 'ThrowStmt': return this.visitThrowStmt(<ThrowStmt>node);
			case 'Unit': return this.visitUnit(<Unit>node);
		}
		throw Error("Invalid node type");
	}
}

