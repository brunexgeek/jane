
/*
 *   Copyright 2021 Bruno Ribeiro
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

/*
 * AUTO-GENERATED CODE. DO NOT EDIT!
 */

import { TokenType } from './tokenizer';
import { SourceLocation } from './compiler';

export enum TypeId
{
    INVALID,
    VOID,
    NUMBER,
    BYTE,
    SHORT,
    INT,
    LONG,
    UBYTE,
    USHORT,
    UINT,
    ULONG,
    FLOAT,
    DOUBLE,
    STRING,
    BOOLEAN,
    CHAR,
    OBJECT
}

export interface INode
{
    accept( visitor : IVisitor ) : void;
    className(): string;
}

export interface IStmt extends INode { }

export interface IExpr extends INode {
    resolvedType() : TypeRef;
}

export abstract class Expr implements IExpr {
    resolvedType_ : TypeRef;
	resolvedType() : TypeRef { return this.resolvedType_; }
	abstract accept( visitor : IVisitor ) : void;
    abstract className(): string;
}

export class Name extends Expr
{
	lexemes : string[];
	location : SourceLocation;
	constructor( lexemes : string[], location : SourceLocation = null )
	{
		super();
		this.lexemes = lexemes;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitName(this); }
	className() : string { return 'Name'; }
	toString() : string { return this.lexemes.join('.'); }
    get canonical() : string { return this.lexemes[this.lexemes.length - 1]; }
    get qualified() : string { return this.toString(); }
    get context() : string { return this.lexemes.slice(1).join('.'); }
    append( name : Name ) { for (let s of name.lexemes) this.lexemes.push(s); }
    push( name : string ) { this.lexemes.push(name); }
    clone() : Name { return new Name([...this.lexemes], this.location); }
    get parent() : Name {
        let name = this.clone();
        name.lexemes.pop();
        return name;
    }
}
export class StringLiteral extends Expr
{
	value : string;
	type : TokenType;
	location : SourceLocation;
	constructor( value : string, type : TokenType, location : SourceLocation = null )
	{
		super();
		this.value = value;
		this.type = type;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitStringLiteral(this); }
	className() : string { return 'StringLiteral'; }
}

export class TemplateStringExpr extends Expr
{
	value : IExpr[];
	location : SourceLocation;
	constructor( value : IExpr[], location : SourceLocation = null )
	{
		super();
		this.value = value;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitTemplateStringExpr(this); }
	className() : string { return 'TemplateStringExpr'; }
}

export class NumberLiteral extends Expr
{
	value : string;
	location : SourceLocation;
	constructor( value : string, location : SourceLocation = null )
	{
		super();
		this.value = value;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitNumberLiteral(this); }
	className() : string { return 'NumberLiteral'; }
}

export class BoolLiteral extends Expr
{
	converted : boolean;
	location : SourceLocation;
	constructor( converted : boolean, location : SourceLocation = null )
	{
		super();
		this.converted = converted;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitBoolLiteral(this); }
	className() : string { return 'BoolLiteral'; }
}

export class NameLiteral extends Expr
{
	value : string;
	location : SourceLocation;
	constructor( value : string, location : SourceLocation = null )
	{
		super();
		this.value = value;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitNameLiteral(this); }
	className() : string { return 'NameLiteral'; }
}

export class Group extends Expr
{
	expr : IExpr;
	location : SourceLocation;
	constructor( expr : IExpr, location : SourceLocation = null )
	{
		super();
		this.expr = expr;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitGroup(this); }
	className() : string { return 'Group'; }
}

export class NullLiteral extends Expr
{
	location : SourceLocation;
	constructor( location : SourceLocation = null )
	{
		super();
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitNullLiteral(this); }
	className() : string { return 'NullLiteral'; }
}

export class LogicalExpr extends Expr
{
	left : IExpr;
	oper : TokenType;
	right : IExpr;
	location : SourceLocation;
	constructor( left : IExpr, oper : TokenType, right : IExpr, location : SourceLocation = null )
	{
		super();
		this.left = left;
		this.oper = oper;
		this.right = right;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitLogicalExpr(this); }
	className() : string { return 'LogicalExpr'; }
}

export class BinaryExpr extends Expr
{
	left : IExpr;
	oper : TokenType;
	right : IExpr;
	location : SourceLocation;
	constructor( left : IExpr, oper : TokenType, right : IExpr, location : SourceLocation = null )
	{
		super();
		this.left = left;
		this.oper = oper;
		this.right = right;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitBinaryExpr(this); }
	className() : string { return 'BinaryExpr'; }
}

export class AssignExpr extends Expr
{
	left : IExpr;
	oper : TokenType;
	right : IExpr;
	location : SourceLocation;
	constructor( left : IExpr, oper : TokenType, right : IExpr, location : SourceLocation = null )
	{
		super();
		this.left = left;
		this.oper = oper;
		this.right = right;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitAssignExpr(this); }
	className() : string { return 'AssignExpr'; }
}

export class UnaryExpr extends Expr
{
	oper : TokenType;
	expr : IExpr;
	post : boolean;
	location : SourceLocation;
	constructor( oper : TokenType, expr : IExpr, post : boolean, location : SourceLocation = null )
	{
		super();
		this.oper = oper;
		this.expr = expr;
		this.post = post;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitUnaryExpr(this); }
	className() : string { return 'UnaryExpr'; }
}

export class TypeCastExpr extends Expr
{
	type : TypeRef;
	expr : IExpr;
	location : SourceLocation;
	constructor( type : TypeRef, expr : IExpr, location : SourceLocation = null )
	{
		super();
		this.type = type;
		this.expr = expr;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitTypeCastExpr(this); }
	className() : string { return 'TypeCastExpr'; }
}

export class CallExpr extends Expr
{
	callee : IExpr;
	args : IExpr[];
	location : SourceLocation;
	constructor( callee : IExpr, args : IExpr[], location : SourceLocation = null )
	{
		super();
		this.callee = callee;
		this.args = args;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitCallExpr(this); }
	className() : string { return 'CallExpr'; }
}

export class ArrayExpr extends Expr
{
	values : IExpr[];
	location : SourceLocation;
	constructor( values : IExpr[], location : SourceLocation = null )
	{
		super();
		this.values = values;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitArrayExpr(this); }
	className() : string { return 'ArrayExpr'; }
}

export class ArrayAccessExpr extends Expr
{
	callee : IExpr;
	index : IExpr;
	location : SourceLocation;
	constructor( callee : IExpr, index : IExpr, location : SourceLocation = null )
	{
		super();
		this.callee = callee;
		this.index = index;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitArrayAccessExpr(this); }
	className() : string { return 'ArrayAccessExpr'; }
}

export class FieldExpr extends Expr
{
	callee : IExpr;
	name : Name;
	location : SourceLocation;
	constructor( callee : IExpr, name : Name, location : SourceLocation = null )
	{
		super();
		this.callee = callee;
		this.name = name;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitFieldExpr(this); }
	className() : string { return 'FieldExpr'; }
}

export class NewExpr extends Expr
{
	type : TypeRef;
	args : IExpr[];
	location : SourceLocation;
	constructor( type : TypeRef, args : IExpr[], location : SourceLocation = null )
	{
		super();
		this.type = type;
		this.args = args;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitNewExpr(this); }
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
	accept( visitor : IVisitor ) : void { visitor.visitAccessor(this); }
	className() : string { return 'Accessor'; }
get isStatic() : boolean { return this.values.indexOf(TokenType.STATIC) >= 0; }
}export class BlockStmt implements IStmt
{
	stmts : IStmt[];
	location : SourceLocation;
	constructor( stmts : IStmt[], location : SourceLocation = null )
	{
		this.stmts = stmts;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitBlockStmt(this); }
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
	accept( visitor : IVisitor ) : void { visitor.visitReturnStmt(this); }
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
	accept( visitor : IVisitor ) : void { visitor.visitNamespaceStmt(this); }
	className() : string { return 'NamespaceStmt'; }
}

export class TypeRef implements INode
{
	tid : TypeId;
	name : Name;
	dims : number;
	ref : ClassStmt = null;
	location : SourceLocation;
	constructor( tid : TypeId, name : Name, dims : number, location : SourceLocation = null )
	{
		this.tid = tid;
		this.name = name;
		this.dims = dims;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitTypeRef(this); }
	className() : string { return 'TypeRef'; }
	toString() : string { return this.name.qualified; }
    get canonical() : string { return this.name.canonical; }
    get qualified() : string { return this.name.qualified; }
    get nullable() : boolean { return this.tid == TypeId.STRING || this.tid == TypeId.OBJECT; }
    static readonly VOID : TypeRef = new TypeRef(TypeId.VOID, new Name(['void']), 0);
    static readonly INVALID : TypeRef = new TypeRef(TypeId.INVALID, new Name(['invalid']), 0);
    isDerived( qname : string ) : boolean
    {
        if (this.ref && this.ref instanceof ClassStmt)
            return this.ref.isDerived(qname);
        return false;
    }
    isPrimitive() : boolean {
        return this.name.qualified == 'boolean' || this.name.qualified == 'number';
    }
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
	accept( visitor : IVisitor ) : void { visitor.visitCaseStmt(this); }
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
	accept( visitor : IVisitor ) : void { visitor.visitSwitchStmt(this); }
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
	accept( visitor : IVisitor ) : void { visitor.visitIfStmt(this); }
	className() : string { return 'IfStmt'; }
}

export class TernaryExpr extends Expr
{
	condition : IExpr;
	thenSide : IExpr;
	elseSide : IExpr;
	location : SourceLocation;
	constructor( condition : IExpr, thenSide : IExpr, elseSide : IExpr, location : SourceLocation = null )
	{
		super();
		this.condition = condition;
		this.thenSide = thenSide;
		this.elseSide = elseSide;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitTernaryExpr(this); }
	className() : string { return 'TernaryExpr'; }
}

export class ForOfStmt implements IStmt
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
	accept( visitor : IVisitor ) : void { visitor.visitForOfStmt(this); }
	className() : string { return 'ForOfStmt'; }
}

export class ForStmt implements IStmt
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
	accept( visitor : IVisitor ) : void { visitor.visitForStmt(this); }
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
	accept( visitor : IVisitor ) : void { visitor.visitDoWhileStmt(this); }
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
	accept( visitor : IVisitor ) : void { visitor.visitWhileStmt(this); }
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
	accept( visitor : IVisitor ) : void { visitor.visitParameter(this); }
	className() : string { return 'Parameter'; }
}

export class ExpandExpr extends Expr
{
	name : Name;
	location : SourceLocation;
	constructor( name : Name, location : SourceLocation = null )
	{
		super();
		this.name = name;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitExpandExpr(this); }
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
	unit : Unit = null;
	parent : INode = null;
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
	accept( visitor : IVisitor ) : void { visitor.visitFunctionStmt(this); }
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
    get isGeneric() : boolean { return this.generics && this.generics.length > 0; }
    get isStatic() : boolean { return this.accessor && this.accessor.isStatic; }
    get isAbstract() : boolean { return this.body == null; }
}
export class ClassStmt implements IStmt
{
	name : Name;
	generics : Name[];
	extended : TypeRef;
	implemented : TypeRef[];
	stmts : IStmt[];
	accessor : Accessor;
	isInterface : boolean = false;
	unit : Unit = null;
	parent : Unit = null;
	location : SourceLocation;
	constructor( name : Name, generics : Name[], extended : TypeRef, implemented : TypeRef[], stmts : IStmt[], accessor : Accessor = null, location : SourceLocation = null )
	{
		this.name = name;
		this.generics = generics;
		this.extended = extended;
		this.implemented = implemented;
		this.stmts = stmts;
		this.accessor = accessor;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitClassStmt(this); }
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
    get isGeneric() : boolean { return this.generics && this.generics.length > 0; }
    isDerived( qname : string ) : boolean
    {
        if (this.extended && this.extended.name.qualified == qname)
            return true;
        for (let intf of this.implemented)
            if (intf.name.qualified == qname) return true;
        if (this.extended && this.extended.ref)
            return this.extended.ref.isDerived(qname);
        return false;
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
	accept( visitor : IVisitor ) : void { visitor.visitExprStmt(this); }
	className() : string { return 'ExprStmt'; }
}

export class BreakStmt implements IStmt
{
	location : SourceLocation;
	constructor( location : SourceLocation = null )
	{
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitBreakStmt(this); }
	className() : string { return 'BreakStmt'; }
}

export class ContinueStmt implements IStmt
{
	location : SourceLocation;
	constructor( location : SourceLocation = null )
	{
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitContinueStmt(this); }
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
	accept( visitor : IVisitor ) : void { visitor.visitImportStmt(this); }
	className() : string { return 'ImportStmt'; }
}

export class VariableStmt implements IStmt
{
	name : Name;
	type : TypeRef;
	init : IExpr;
	constant : boolean;
	accessor : Accessor;
	unit : Unit = null;
	parent : INode = null;
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
	accept( visitor : IVisitor ) : void { visitor.visitVariableStmt(this); }
	className() : string { return 'VariableStmt'; }

    toString() : string
    {
        let result : string;
        if (this.constant) result = 'const '; else result = 'let ';
        result += this.name.toString();
        if (this.type) result += ` : ${this.type.toString()}`;
        return result;
    }
    get isStatic() : boolean { return this.accessor && this.accessor.isStatic; }
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
	accept( visitor : IVisitor ) : void { visitor.visitPropertyStmt(this); }
	className() : string { return 'PropertyStmt'; }

    toString() : string
    {
        let result = this.name.toString();
        if (this.type) result += ` : ${this.type.toString()}`;
        return result;
    }
    get isStatic() : boolean { return this.accessor && this.accessor.isStatic; }
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
	accept( visitor : IVisitor ) : void { visitor.visitTryCatchStmt(this); }
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
	accept( visitor : IVisitor ) : void { visitor.visitThrowStmt(this); }
	className() : string { return 'ThrowStmt'; }
}

export class EnumStmt implements IStmt
{
	name : Name;
	values : Name[];
	location : SourceLocation;
	constructor( name : Name, values : Name[], location : SourceLocation = null )
	{
		this.name = name;
		this.values = values;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitEnumStmt(this); }
	className() : string { return 'EnumStmt'; }
}

export class StrIStmtMap{
	private keys : string[] = [];
	private items : IStmt[] = [];
	get( key : string ) : IStmt {
		let i = this.keys.indexOf(key);
		if (i < 0) return null;
		return this.items[i];
	}
	set( key : string, value : IStmt ) {
		let i = this.keys.indexOf(key);
		if (i >= 0) this.items[i] = value;
		else { this.keys.push(key); this.items.push(value); }
	}
	has( key : string ) : boolean { return this.get(key) != null; }
	get size() : number { return this.keys.length; }
	delete( key : string ) {
		let i = this.keys.indexOf(key);
		if (i < 0 || this.size == 0) return false;
		let last = this.keys.length - 1;
		if (i != last) {
			this.keys[i] = this.keys[last];
			this.items[i] = this.items[last];
		}
		this.keys.pop();
		this.items.pop();
	}
	values() : IStmt[] { return this.items; }
}
export class StrUnitMap{
	private keys : string[] = [];
	private items : Unit[] = [];
	get( key : string ) : Unit {
		let i = this.keys.indexOf(key);
		if (i < 0) return null;
		return this.items[i];
	}
	set( key : string, value : Unit ) {
		let i = this.keys.indexOf(key);
		if (i >= 0) this.items[i] = value;
		else { this.keys.push(key); this.items.push(value); }
	}
	has( key : string ) : boolean { return this.get(key) != null; }
	get size() : number { return this.keys.length; }
	delete( key : string ) {
		let i = this.keys.indexOf(key);
		if (i < 0 || this.size == 0) return false;
		let last = this.keys.length - 1;
		if (i != last) {
			this.keys[i] = this.keys[last];
			this.items[i] = this.items[last];
		}
		this.keys.pop();
		this.items.pop();
	}
	values() : Unit[] { return this.items; }
}
export class StrVarMap{
	private keys : string[] = [];
	private items : VariableStmt[] = [];
	get( key : string ) : VariableStmt {
		let i = this.keys.indexOf(key);
		if (i < 0) return null;
		return this.items[i];
	}
	set( key : string, value : VariableStmt ) {
		let i = this.keys.indexOf(key);
		if (i >= 0) this.items[i] = value;
		else { this.keys.push(key); this.items.push(value); }
	}
	has( key : string ) : boolean { return this.get(key) != null; }
	get size() : number { return this.keys.length; }
	delete( key : string ) {
		let i = this.keys.indexOf(key);
		if (i < 0 || this.size == 0) return false;
		let last = this.keys.length - 1;
		if (i != last) {
			this.keys[i] = this.keys[last];
			this.items[i] = this.items[last];
		}
		this.keys.pop();
		this.items.pop();
	}
	values() : VariableStmt[] { return this.items; }
}
export class StrClassMap{
	private keys : string[] = [];
	private items : ClassStmt[] = [];
	get( key : string ) : ClassStmt {
		let i = this.keys.indexOf(key);
		if (i < 0) return null;
		return this.items[i];
	}
	set( key : string, value : ClassStmt ) {
		let i = this.keys.indexOf(key);
		if (i >= 0) this.items[i] = value;
		else { this.keys.push(key); this.items.push(value); }
	}
	has( key : string ) : boolean { return this.get(key) != null; }
	get size() : number { return this.keys.length; }
	delete( key : string ) {
		let i = this.keys.indexOf(key);
		if (i < 0 || this.size == 0) return false;
		let last = this.keys.length - 1;
		if (i != last) {
			this.keys[i] = this.keys[last];
			this.items[i] = this.items[last];
		}
		this.keys.pop();
		this.items.pop();
	}
	values() : ClassStmt[] { return this.items; }
}
export class StrFuncMap{
	private keys : string[] = [];
	private items : FunctionStmt[] = [];
	get( key : string ) : FunctionStmt {
		let i = this.keys.indexOf(key);
		if (i < 0) return null;
		return this.items[i];
	}
	set( key : string, value : FunctionStmt ) {
		let i = this.keys.indexOf(key);
		if (i >= 0) this.items[i] = value;
		else { this.keys.push(key); this.items.push(value); }
	}
	has( key : string ) : boolean { return this.get(key) != null; }
	get size() : number { return this.keys.length; }
	delete( key : string ) {
		let i = this.keys.indexOf(key);
		if (i < 0 || this.size == 0) return false;
		let last = this.keys.length - 1;
		if (i != last) {
			this.keys[i] = this.keys[last];
			this.items[i] = this.items[last];
		}
		this.keys.pop();
		this.items.pop();
	}
	values() : FunctionStmt[] { return this.items; }
}
export class StrClassStmtMap{
	private keys : string[] = [];
	private items : ClassStmt[] = [];
	get( key : string ) : ClassStmt {
		let i = this.keys.indexOf(key);
		if (i < 0) return null;
		return this.items[i];
	}
	set( key : string, value : ClassStmt ) {
		let i = this.keys.indexOf(key);
		if (i >= 0) this.items[i] = value;
		else { this.keys.push(key); this.items.push(value); }
	}
	has( key : string ) : boolean { return this.get(key) != null; }
	get size() : number { return this.keys.length; }
	delete( key : string ) {
		let i = this.keys.indexOf(key);
		if (i < 0 || this.size == 0) return false;
		let last = this.keys.length - 1;
		if (i != last) {
			this.keys[i] = this.keys[last];
			this.items[i] = this.items[last];
		}
		this.keys.pop();
		this.items.pop();
	}
	values() : ClassStmt[] { return this.items; }
}
export class Unit implements INode
{
	fileName : string = '';
	stmts : IStmt[];
	imports : ImportStmt[];
	variables : StrVarMap = new StrVarMap();
	types : StrClassMap = new StrClassMap();
	generics : StrClassMap = new StrClassMap();
	functions : StrFuncMap = new StrFuncMap();
	imports_ : StrIStmtMap = new StrIStmtMap();
	location : SourceLocation;
	constructor( stmts : IStmt[], imports : ImportStmt[], location : SourceLocation = null )
	{
		this.stmts = stmts;
		this.imports = imports;
		this.location = location;
	}
	accept( visitor : IVisitor ) : void { visitor.visitUnit(this); }
	className() : string { return 'Unit'; }
}

export interface IVisitor {
	visitName( target : Name) : void;
	visitStringLiteral( target : StringLiteral) : void;
	visitTemplateStringExpr( target : TemplateStringExpr) : void;
	visitNumberLiteral( target : NumberLiteral) : void;
	visitBoolLiteral( target : BoolLiteral) : void;
	visitNameLiteral( target : NameLiteral) : void;
	visitGroup( target : Group) : void;
	visitNullLiteral( target : NullLiteral) : void;
	visitLogicalExpr( target : LogicalExpr) : void;
	visitBinaryExpr( target : BinaryExpr) : void;
	visitAssignExpr( target : AssignExpr) : void;
	visitUnaryExpr( target : UnaryExpr) : void;
	visitTypeCastExpr( target : TypeCastExpr) : void;
	visitCallExpr( target : CallExpr) : void;
	visitArrayExpr( target : ArrayExpr) : void;
	visitArrayAccessExpr( target : ArrayAccessExpr) : void;
	visitFieldExpr( target : FieldExpr) : void;
	visitNewExpr( target : NewExpr) : void;
	visitAccessor( target : Accessor) : void;
	visitBlockStmt( target : BlockStmt) : void;
	visitReturnStmt( target : ReturnStmt) : void;
	visitNamespaceStmt( target : NamespaceStmt) : void;
	visitTypeRef( target : TypeRef) : void;
	visitCaseStmt( target : CaseStmt) : void;
	visitSwitchStmt( target : SwitchStmt) : void;
	visitIfStmt( target : IfStmt) : void;
	visitTernaryExpr( target : TernaryExpr) : void;
	visitForOfStmt( target : ForOfStmt) : void;
	visitForStmt( target : ForStmt) : void;
	visitDoWhileStmt( target : DoWhileStmt) : void;
	visitWhileStmt( target : WhileStmt) : void;
	visitParameter( target : Parameter) : void;
	visitExpandExpr( target : ExpandExpr) : void;
	visitFunctionStmt( target : FunctionStmt) : void;
	visitClassStmt( target : ClassStmt) : void;
	visitExprStmt( target : ExprStmt) : void;
	visitBreakStmt( target : BreakStmt) : void;
	visitContinueStmt( target : ContinueStmt) : void;
	visitImportStmt( target : ImportStmt) : void;
	visitVariableStmt( target : VariableStmt) : void;
	visitPropertyStmt( target : PropertyStmt) : void;
	visitTryCatchStmt( target : TryCatchStmt) : void;
	visitThrowStmt( target : ThrowStmt) : void;
	visitEnumStmt( target : EnumStmt) : void;
	visitUnit( target : Unit) : void;
}

export class Visitor implements IVisitor {
	visitName( target : Name) : void {}
	visitStringLiteral( target : StringLiteral) : void {}
	visitTemplateStringExpr( target : TemplateStringExpr) : void {}
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
	visitTypeRef( target : TypeRef) : void {}
	visitCaseStmt( target : CaseStmt) : void {}
	visitSwitchStmt( target : SwitchStmt) : void {}
	visitIfStmt( target : IfStmt) : void {}
	visitTernaryExpr( target : TernaryExpr) : void {}
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
	visitEnumStmt( target : EnumStmt) : void {}
	visitUnit( target : Unit) : void {}
}

export abstract class DispatcherTypeRef {
	protected abstract visitName( target : Name) : TypeRef;
	protected abstract visitStringLiteral( target : StringLiteral) : TypeRef;
	protected abstract visitTemplateStringExpr( target : TemplateStringExpr) : TypeRef;
	protected abstract visitNumberLiteral( target : NumberLiteral) : TypeRef;
	protected abstract visitBoolLiteral( target : BoolLiteral) : TypeRef;
	protected abstract visitNameLiteral( target : NameLiteral) : TypeRef;
	protected abstract visitGroup( target : Group) : TypeRef;
	protected abstract visitNullLiteral( target : NullLiteral) : TypeRef;
	protected abstract visitLogicalExpr( target : LogicalExpr) : TypeRef;
	protected abstract visitBinaryExpr( target : BinaryExpr) : TypeRef;
	protected abstract visitAssignExpr( target : AssignExpr) : TypeRef;
	protected abstract visitUnaryExpr( target : UnaryExpr) : TypeRef;
	protected abstract visitTypeCastExpr( target : TypeCastExpr) : TypeRef;
	protected abstract visitCallExpr( target : CallExpr) : TypeRef;
	protected abstract visitArrayExpr( target : ArrayExpr) : TypeRef;
	protected abstract visitArrayAccessExpr( target : ArrayAccessExpr) : TypeRef;
	protected abstract visitFieldExpr( target : FieldExpr) : TypeRef;
	protected abstract visitNewExpr( target : NewExpr) : TypeRef;
	protected abstract visitAccessor( target : Accessor) : TypeRef;
	protected abstract visitBlockStmt( target : BlockStmt) : TypeRef;
	protected abstract visitReturnStmt( target : ReturnStmt) : TypeRef;
	protected abstract visitNamespaceStmt( target : NamespaceStmt) : TypeRef;
	protected abstract visitTypeRef( target : TypeRef) : TypeRef;
	protected abstract visitCaseStmt( target : CaseStmt) : TypeRef;
	protected abstract visitSwitchStmt( target : SwitchStmt) : TypeRef;
	protected abstract visitIfStmt( target : IfStmt) : TypeRef;
	protected abstract visitTernaryExpr( target : TernaryExpr) : TypeRef;
	protected abstract visitForOfStmt( target : ForOfStmt) : TypeRef;
	protected abstract visitForStmt( target : ForStmt) : TypeRef;
	protected abstract visitDoWhileStmt( target : DoWhileStmt) : TypeRef;
	protected abstract visitWhileStmt( target : WhileStmt) : TypeRef;
	protected abstract visitParameter( target : Parameter) : TypeRef;
	protected abstract visitExpandExpr( target : ExpandExpr) : TypeRef;
	protected abstract visitFunctionStmt( target : FunctionStmt) : TypeRef;
	protected abstract visitClassStmt( target : ClassStmt) : TypeRef;
	protected abstract visitExprStmt( target : ExprStmt) : TypeRef;
	protected abstract visitBreakStmt( target : BreakStmt) : TypeRef;
	protected abstract visitContinueStmt( target : ContinueStmt) : TypeRef;
	protected abstract visitImportStmt( target : ImportStmt) : TypeRef;
	protected abstract visitVariableStmt( target : VariableStmt) : TypeRef;
	protected abstract visitPropertyStmt( target : PropertyStmt) : TypeRef;
	protected abstract visitTryCatchStmt( target : TryCatchStmt) : TypeRef;
	protected abstract visitThrowStmt( target : ThrowStmt) : TypeRef;
	protected abstract visitEnumStmt( target : EnumStmt) : TypeRef;
	protected abstract visitUnit( target : Unit) : TypeRef;
	protected dispatch( node : INode ) : TypeRef {
		if (!node) return;
		switch (node.className()) {
			case 'Name': return this.visitName(<Name>node);
			case 'StringLiteral': return this.visitStringLiteral(<StringLiteral>node);
			case 'TemplateStringExpr': return this.visitTemplateStringExpr(<TemplateStringExpr>node);
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
			case 'TypeRef': return this.visitTypeRef(<TypeRef>node);
			case 'CaseStmt': return this.visitCaseStmt(<CaseStmt>node);
			case 'SwitchStmt': return this.visitSwitchStmt(<SwitchStmt>node);
			case 'IfStmt': return this.visitIfStmt(<IfStmt>node);
			case 'TernaryExpr': return this.visitTernaryExpr(<TernaryExpr>node);
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
			case 'EnumStmt': return this.visitEnumStmt(<EnumStmt>node);
			case 'Unit': return this.visitUnit(<Unit>node);
		}
		throw new Error(`Unable to dispatch an object of '${node.className()}'`);
	}
}

export abstract class DispatcherVoid {
	protected abstract visitName( target : Name) : void;
	protected abstract visitStringLiteral( target : StringLiteral) : void;
	protected abstract visitTemplateStringExpr( target : TemplateStringExpr) : void;
	protected abstract visitNumberLiteral( target : NumberLiteral) : void;
	protected abstract visitBoolLiteral( target : BoolLiteral) : void;
	protected abstract visitNameLiteral( target : NameLiteral) : void;
	protected abstract visitGroup( target : Group) : void;
	protected abstract visitNullLiteral( target : NullLiteral) : void;
	protected abstract visitLogicalExpr( target : LogicalExpr) : void;
	protected abstract visitBinaryExpr( target : BinaryExpr) : void;
	protected abstract visitAssignExpr( target : AssignExpr) : void;
	protected abstract visitUnaryExpr( target : UnaryExpr) : void;
	protected abstract visitTypeCastExpr( target : TypeCastExpr) : void;
	protected abstract visitCallExpr( target : CallExpr) : void;
	protected abstract visitArrayExpr( target : ArrayExpr) : void;
	protected abstract visitArrayAccessExpr( target : ArrayAccessExpr) : void;
	protected abstract visitFieldExpr( target : FieldExpr) : void;
	protected abstract visitNewExpr( target : NewExpr) : void;
	protected abstract visitAccessor( target : Accessor) : void;
	protected abstract visitBlockStmt( target : BlockStmt) : void;
	protected abstract visitReturnStmt( target : ReturnStmt) : void;
	protected abstract visitNamespaceStmt( target : NamespaceStmt) : void;
	protected abstract visitTypeRef( target : TypeRef) : void;
	protected abstract visitCaseStmt( target : CaseStmt) : void;
	protected abstract visitSwitchStmt( target : SwitchStmt) : void;
	protected abstract visitIfStmt( target : IfStmt) : void;
	protected abstract visitTernaryExpr( target : TernaryExpr) : void;
	protected abstract visitForOfStmt( target : ForOfStmt) : void;
	protected abstract visitForStmt( target : ForStmt) : void;
	protected abstract visitDoWhileStmt( target : DoWhileStmt) : void;
	protected abstract visitWhileStmt( target : WhileStmt) : void;
	protected abstract visitParameter( target : Parameter) : void;
	protected abstract visitExpandExpr( target : ExpandExpr) : void;
	protected abstract visitFunctionStmt( target : FunctionStmt) : void;
	protected abstract visitClassStmt( target : ClassStmt) : void;
	protected abstract visitExprStmt( target : ExprStmt) : void;
	protected abstract visitBreakStmt( target : BreakStmt) : void;
	protected abstract visitContinueStmt( target : ContinueStmt) : void;
	protected abstract visitImportStmt( target : ImportStmt) : void;
	protected abstract visitVariableStmt( target : VariableStmt) : void;
	protected abstract visitPropertyStmt( target : PropertyStmt) : void;
	protected abstract visitTryCatchStmt( target : TryCatchStmt) : void;
	protected abstract visitThrowStmt( target : ThrowStmt) : void;
	protected abstract visitEnumStmt( target : EnumStmt) : void;
	protected abstract visitUnit( target : Unit) : void;
	protected dispatch( node : INode ) : void {
		if (!node) return;
		switch (node.className()) {
			case 'Name': return this.visitName(<Name>node);
			case 'StringLiteral': return this.visitStringLiteral(<StringLiteral>node);
			case 'TemplateStringExpr': return this.visitTemplateStringExpr(<TemplateStringExpr>node);
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
			case 'TypeRef': return this.visitTypeRef(<TypeRef>node);
			case 'CaseStmt': return this.visitCaseStmt(<CaseStmt>node);
			case 'SwitchStmt': return this.visitSwitchStmt(<SwitchStmt>node);
			case 'IfStmt': return this.visitIfStmt(<IfStmt>node);
			case 'TernaryExpr': return this.visitTernaryExpr(<TernaryExpr>node);
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
			case 'EnumStmt': return this.visitEnumStmt(<EnumStmt>node);
			case 'Unit': return this.visitUnit(<Unit>node);
		}
		throw new Error(`Unable to dispatch an object of '${node.className()}'`);
	}
}

