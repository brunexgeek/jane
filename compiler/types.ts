
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

export interface IStmt
{
    accept<T>( visitor : IVisitor<T> ) : T;
    className(): string;
}

export interface IExpr
{
    accept<T>( visitor : IVisitor<T> ) : T;
    className(): string;
}

export class Name implements IExpr
{
	lexemes : string[];
	location : SourceLocation;
	constructor( lexemes : string[], location : SourceLocation = null )
	{
		this.location = location;
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
}
export class StringLiteral implements IExpr
{
	value : string;
	type : TokenType;
	location : SourceLocation;
	constructor( value : string, type : TokenType, location : SourceLocation = null )
	{
		this.location = location;
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
		this.location = location;
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
		this.location = location;
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
		this.location = location;
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
		this.location = location;
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
		this.location = location;
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
		this.location = location;
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
		this.location = location;
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
		this.location = location;
		this.oper = oper;
		this.expr = expr;
		this.post = post;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitUnaryExpr(this); }
	className() : string { return 'UnaryExpr'; }
}

export class CallExpr implements IExpr
{
	callee : IExpr;
	args : IExpr[];
	location : SourceLocation;
	constructor( callee : IExpr, args : IExpr[], location : SourceLocation = null )
	{
		this.location = location;
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
		this.location = location;
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
		this.location = location;
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
		this.location = location;
		this.callee = callee;
		this.name = name;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitFieldExpr(this); }
	className() : string { return 'FieldExpr'; }
}

export class NewExpr implements IExpr
{
	name : Name;
	args : IExpr[];
	location : SourceLocation;
	constructor( name : Name, args : IExpr[], location : SourceLocation = null )
	{
		this.location = location;
		this.name = name;
		this.args = args;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitNewExpr(this); }
	className() : string { return 'NewExpr'; }
}

export class Accessor
{
	values : TokenType[];
	location : SourceLocation;
	constructor( values : TokenType[], location : SourceLocation = null )
	{
		this.location = location;
		this.values = values;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitAccessor(this); }
	className() : string { return 'Accessor'; }
}

export class BlockStmt implements IStmt
{
	stmts : IStmt[];
	location : SourceLocation;
	constructor( stmts : IStmt[], location : SourceLocation = null )
	{
		this.location = location;
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
		this.location = location;
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
	location : SourceLocation;
	constructor( name : Name, stmts : IStmt[], location : SourceLocation = null )
	{
		this.location = location;
		this.name = name;
		this.stmts = stmts;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitNamespaceStmt(this); }
	className() : string { return 'NamespaceStmt'; }
}

export class TypeRef
{
	name : Name;
	generics : Name[];
	dims : number;
	location : SourceLocation;
	constructor( name : Name, generics : Name[], dims : number, location : SourceLocation = null )
	{
		this.location = location;
		this.name = name;
		this.generics = generics;
		this.dims = dims;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitTypeRef(this); }
	className() : string { return 'TypeRef'; }
	toString() : string
    {
        let result = this.name.toString();
        if (this.generics)
        {
            result += '<';
            let first = true;
            for (let i of this.generics)
            {
                if (!first) result += '.';
                first = false;
                result += i.toString();
            }
            result += '>';
        }
        let i = this.dims;
        while (i-- > 0) result += '[]';
        return result;
    }
}
export class CaseStmt implements IStmt
{
	expr : IExpr;
	stmts : IStmt[];
	location : SourceLocation;
	constructor( expr : IExpr, stmts : IStmt[], location : SourceLocation = null )
	{
		this.location = location;
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
		this.location = location;
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
		this.location = location;
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
		this.location = location;
		this.variable = variable;
		this.expr = expr;
		this.stmt = stmt;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitForOfStmt(this); }
	className() : string { return 'ForOfStmt'; }
}

export class DoWhileStmt implements IStmt
{
	stmt : IStmt;
	condition : IExpr;
	location : SourceLocation;
	constructor( stmt : IStmt, condition : IExpr, location : SourceLocation = null )
	{
		this.location = location;
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
		this.location = location;
		this.condition = condition;
		this.stmt = stmt;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitWhileStmt(this); }
	className() : string { return 'WhileStmt'; }
}

export class Parameter
{
	name : Name;
	type : TypeRef;
	init : IExpr;
	vararg : boolean;
	location : SourceLocation;
	constructor( name : Name, type : TypeRef, init : IExpr, vararg : boolean, location : SourceLocation = null )
	{
		this.location = location;
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
		this.location = location;
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
	accessor : Accessor = null;
	property : TokenType = null;
	nspace : Name = null;
	location : SourceLocation;
	constructor( name : Name, generics : Name[], params : Parameter[], type : TypeRef, body : BlockStmt, location : SourceLocation = null )
	{
		this.location = location;
		this.name = name;
		this.generics = generics;
		this.params = params;
		this.type = type;
		this.body = body;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitFunctionStmt(this); }
	className() : string { return 'FunctionStmt'; }
}

export class ClassStmt implements IStmt
{
	name : Name;
	generics : Name[];
	extended : TypeRef;
	implemented : TypeRef[];
	stmts : IStmt[];
	nspace : Name = null;
	location : SourceLocation;
	constructor( name : Name, generics : Name[], extended : TypeRef, implemented : TypeRef[], stmts : IStmt[], location : SourceLocation = null )
	{
		this.location = location;
		this.name = name;
		this.generics = generics;
		this.extended = extended;
		this.implemented = implemented;
		this.stmts = stmts;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitClassStmt(this); }
	className() : string { return 'ClassStmt'; }
}

export class ExprStmt implements IStmt
{
	expr : IExpr;
	location : SourceLocation;
	constructor( expr : IExpr, location : SourceLocation = null )
	{
		this.location = location;
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
		this.location = location;
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
	nspace : Name = null;
	location : SourceLocation;
	constructor( name : Name, type : TypeRef, init : IExpr, constant : boolean, location : SourceLocation = null )
	{
		this.location = location;
		this.name = name;
		this.type = type;
		this.init = init;
		this.constant = constant;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitVariableStmt(this); }
	className() : string { return 'VariableStmt'; }
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
		this.location = location;
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
		this.location = location;
		this.expr = expr;
		this.location = location;
	}
	accept<T>( visitor : IVisitor<T> ) : T { return visitor.visitThrowStmt(this); }
	className() : string { return 'ThrowStmt'; }
}

export class Unit
{
	stmts : IStmt[];
	imports : ImportStmt[];
	location : SourceLocation;
	constructor( stmts : IStmt[], imports : ImportStmt[], location : SourceLocation = null )
	{
		this.location = location;
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
	visitCallExpr( target : CallExpr) : T;
	visitArrayExpr( target : ArrayExpr) : T;
	visitArrayAccessExpr( target : ArrayAccessExpr) : T;
	visitFieldExpr( target : FieldExpr) : T;
	visitNewExpr( target : NewExpr) : T;
	visitAccessor( target : Accessor) : T;
	visitBlockStmt( target : BlockStmt) : T;
	visitReturnStmt( target : ReturnStmt) : T;
	visitNamespaceStmt( target : NamespaceStmt) : T;
	visitTypeRef( target : TypeRef) : T;
	visitCaseStmt( target : CaseStmt) : T;
	visitSwitchStmt( target : SwitchStmt) : T;
	visitIfStmt( target : IfStmt) : T;
	visitForOfStmt( target : ForOfStmt) : T;
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
	visitForOfStmt( target : ForOfStmt) : void {}
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
	visitTryCatchStmt( target : TryCatchStmt) : void {}
	visitThrowStmt( target : ThrowStmt) : void {}
	visitUnit( target : Unit) : void {}
}

