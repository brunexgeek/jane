
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

export interface IStmt
{
    accept( visitor : Visitor ) : void;
    className(): string;
}

export interface IExpr
{
    accept( visitor : Visitor ) : void;
    className(): string;
}

export class Name implements IExpr
{
	lexemes : string[];
	constructor( lexemes : string[] )
	{
		this.lexemes = lexemes;
	}
	accept( visitor : Visitor ) : void { visitor.visitName(this); }
	className() : string { return 'Name'; }
}

export class StringLiteral implements IExpr
{
	value : string;
	type : TokenType;
	constructor( value : string, type : TokenType )
	{
		this.value = value;
		this.type = type;
	}
	accept( visitor : Visitor ) : void { visitor.visitStringLiteral(this); }
	className() : string { return 'StringLiteral'; }
}

export class NumberLiteral implements IExpr
{
	value : string;
	converted : number;
	constructor( value : string, converted : number )
	{
		this.value = value;
		this.converted = converted;
	}
	accept( visitor : Visitor ) : void { visitor.visitNumberLiteral(this); }
	className() : string { return 'NumberLiteral'; }
}

export class BoolLiteral implements IExpr
{
	converted : boolean;
	constructor( converted : boolean )
	{
		this.converted = converted;
	}
	accept( visitor : Visitor ) : void { visitor.visitBoolLiteral(this); }
	className() : string { return 'BoolLiteral'; }
}

export class NameLiteral implements IExpr
{
	value : string;
	constructor( value : string )
	{
		this.value = value;
	}
	accept( visitor : Visitor ) : void { visitor.visitNameLiteral(this); }
	className() : string { return 'NameLiteral'; }
}

export class Group implements IExpr
{
	expr : IExpr;
	constructor( expr : IExpr )
	{
		this.expr = expr;
	}
	accept( visitor : Visitor ) : void { visitor.visitGroup(this); }
	className() : string { return 'Group'; }
}

export class NullLiteral implements IExpr
{
	constructor(  )
	{
	}
	accept( visitor : Visitor ) : void { visitor.visitNullLiteral(this); }
	className() : string { return 'NullLiteral'; }
}

export class LogicalExpr implements IExpr
{
	left : IExpr;
	oper : TokenType;
	right : IExpr;
	constructor( left : IExpr, oper : TokenType, right : IExpr )
	{
		this.left = left;
		this.oper = oper;
		this.right = right;
	}
	accept( visitor : Visitor ) : void { visitor.visitLogicalExpr(this); }
	className() : string { return 'LogicalExpr'; }
}

export class BinaryExpr implements IExpr
{
	left : IExpr;
	oper : TokenType;
	right : IExpr;
	constructor( left : IExpr, oper : TokenType, right : IExpr )
	{
		this.left = left;
		this.oper = oper;
		this.right = right;
	}
	accept( visitor : Visitor ) : void { visitor.visitBinaryExpr(this); }
	className() : string { return 'BinaryExpr'; }
}

export class AssignExpr implements IExpr
{
	left : IExpr;
	oper : TokenType;
	right : IExpr;
	constructor( left : IExpr, oper : TokenType, right : IExpr )
	{
		this.left = left;
		this.oper = oper;
		this.right = right;
	}
	accept( visitor : Visitor ) : void { visitor.visitAssignExpr(this); }
	className() : string { return 'AssignExpr'; }
}

export class UnaryExpr implements IExpr
{
	oper : TokenType;
	expr : IExpr;
	post : boolean;
	constructor( oper : TokenType, expr : IExpr, post : boolean )
	{
		this.oper = oper;
		this.expr = expr;
		this.post = post;
	}
	accept( visitor : Visitor ) : void { visitor.visitUnaryExpr(this); }
	className() : string { return 'UnaryExpr'; }
}

export class CallExpr implements IExpr
{
	callee : IExpr;
	args : IExpr[];
	constructor( callee : IExpr, args : IExpr[] )
	{
		this.callee = callee;
		this.args = args;
	}
	accept( visitor : Visitor ) : void { visitor.visitCallExpr(this); }
	className() : string { return 'CallExpr'; }
}

export class ArrayExpr implements IExpr
{
	values : IExpr[];
	constructor( values : IExpr[] )
	{
		this.values = values;
	}
	accept( visitor : Visitor ) : void { visitor.visitArrayExpr(this); }
	className() : string { return 'ArrayExpr'; }
}

export class ArrayAccessExpr implements IExpr
{
	callee : IExpr;
	index : IExpr;
	constructor( callee : IExpr, index : IExpr )
	{
		this.callee = callee;
		this.index = index;
	}
	accept( visitor : Visitor ) : void { visitor.visitArrayAccessExpr(this); }
	className() : string { return 'ArrayAccessExpr'; }
}

export class FieldExpr implements IExpr
{
	callee : IExpr;
	name : Name;
	constructor( callee : IExpr, name : Name )
	{
		this.callee = callee;
		this.name = name;
	}
	accept( visitor : Visitor ) : void { visitor.visitFieldExpr(this); }
	className() : string { return 'FieldExpr'; }
}

export class NewExpr implements IExpr
{
	name : Name;
	args : IExpr[];
	constructor( name : Name, args : IExpr[] )
	{
		this.name = name;
		this.args = args;
	}
	accept( visitor : Visitor ) : void { visitor.visitNewExpr(this); }
	className() : string { return 'NewExpr'; }
}

export class Accessor
{
	values : TokenType[];
	constructor( values : TokenType[] )
	{
		this.values = values;
	}
	accept( visitor : Visitor ) : void { visitor.visitAccessor(this); }
	className() : string { return 'Accessor'; }
}

export class BlockStmt implements IStmt
{
	stmts : IStmt[];
	constructor( stmts : IStmt[] )
	{
		this.stmts = stmts;
	}
	accept( visitor : Visitor ) : void { visitor.visitBlockStmt(this); }
	className() : string { return 'BlockStmt'; }
}

export class ReturnStmt implements IStmt
{
	expr : IExpr;
	constructor( expr : IExpr )
	{
		this.expr = expr;
	}
	accept( visitor : Visitor ) : void { visitor.visitReturnStmt(this); }
	className() : string { return 'ReturnStmt'; }
}

export class NamespaceStmt implements IStmt
{
	name : Name;
	stmts : IStmt[];
	constructor( name : Name, stmts : IStmt[] )
	{
		this.name = name;
		this.stmts = stmts;
	}
	accept( visitor : Visitor ) : void { visitor.visitNamespaceStmt(this); }
	className() : string { return 'NamespaceStmt'; }
}

export class TypeRef
{
	name : Name;
	dims : number;
	uid : string = '';
	constructor( name : Name, dims : number )
	{
		this.name = name;
		this.dims = dims;
	}
	accept( visitor : Visitor ) : void { visitor.visitTypeRef(this); }
	className() : string { return 'TypeRef'; }
}

export class CaseStmt implements IStmt
{
	expr : IExpr;
	stmts : IStmt[];
	constructor( expr : IExpr, stmts : IStmt[] )
	{
		this.expr = expr;
		this.stmts = stmts;
	}
	accept( visitor : Visitor ) : void { visitor.visitCaseStmt(this); }
	className() : string { return 'CaseStmt'; }
}

export class SwitchStmt implements IStmt
{
	expr : IExpr;
	cases : IStmt[];
	constructor( expr : IExpr, cases : IStmt[] )
	{
		this.expr = expr;
		this.cases = cases;
	}
	accept( visitor : Visitor ) : void { visitor.visitSwitchStmt(this); }
	className() : string { return 'SwitchStmt'; }
}

export class IfStmt implements IStmt
{
	condition : IStmt;
	thenSide : IStmt;
	elseSide : IStmt;
	constructor( condition : IStmt, thenSide : IStmt, elseSide : IStmt )
	{
		this.condition = condition;
		this.thenSide = thenSide;
		this.elseSide = elseSide;
	}
	accept( visitor : Visitor ) : void { visitor.visitIfStmt(this); }
	className() : string { return 'IfStmt'; }
}

export class ForOfStmt implements IExpr
{
	variable : VariableStmt;
	expr : IExpr;
	stmt : IStmt;
	constructor( variable : VariableStmt, expr : IExpr, stmt : IStmt )
	{
		this.variable = variable;
		this.expr = expr;
		this.stmt = stmt;
	}
	accept( visitor : Visitor ) : void { visitor.visitForOfStmt(this); }
	className() : string { return 'ForOfStmt'; }
}

export class DoWhileStmt implements IStmt
{
	stmt : IStmt;
	condition : IExpr;
	constructor( stmt : IStmt, condition : IExpr )
	{
		this.stmt = stmt;
		this.condition = condition;
	}
	accept( visitor : Visitor ) : void { visitor.visitDoWhileStmt(this); }
	className() : string { return 'DoWhileStmt'; }
}

export class WhileStmt implements IStmt
{
	condition : IStmt;
	stmt : IStmt;
	constructor( condition : IStmt, stmt : IStmt )
	{
		this.condition = condition;
		this.stmt = stmt;
	}
	accept( visitor : Visitor ) : void { visitor.visitWhileStmt(this); }
	className() : string { return 'WhileStmt'; }
}

export class Parameter
{
	name : Name;
	type : TypeRef;
	init : IExpr;
	vararg : boolean;
	constructor( name : Name, type : TypeRef, init : IExpr, vararg : boolean )
	{
		this.name = name;
		this.type = type;
		this.init = init;
		this.vararg = vararg;
	}
	accept( visitor : Visitor ) : void { visitor.visitParameter(this); }
	className() : string { return 'Parameter'; }
}

export class ExpandExpr implements IExpr
{
	name : Name;
	constructor( name : Name )
	{
		this.name = name;
	}
	accept( visitor : Visitor ) : void { visitor.visitExpandExpr(this); }
	className() : string { return 'ExpandExpr'; }
}

export class FunctionStmt implements IStmt
{
	name : Name;
	params : Parameter[];
	type : TypeRef;
	body : BlockStmt;
	accessor : Accessor = null;
	property : TokenType = null;
	uid : string = '';
	constructor( name : Name, params : Parameter[], type : TypeRef, body : BlockStmt )
	{
		this.name = name;
		this.params = params;
		this.type = type;
		this.body = body;
	}
	accept( visitor : Visitor ) : void { visitor.visitFunctionStmt(this); }
	className() : string { return 'FunctionStmt'; }
}

export class ClassStmt implements IStmt
{
	name : Name;
	extended : Name;
	implemented : Name[];
	stmts : IStmt[];
	uid : string = '';
	constructor( name : Name, extended : Name, implemented : Name[], stmts : IStmt[] )
	{
		this.name = name;
		this.extended = extended;
		this.implemented = implemented;
		this.stmts = stmts;
	}
	accept( visitor : Visitor ) : void { visitor.visitClassStmt(this); }
	className() : string { return 'ClassStmt'; }
}

export class ExprStmt implements IStmt
{
	expr : IExpr;
	constructor( expr : IExpr )
	{
		this.expr = expr;
	}
	accept( visitor : Visitor ) : void { visitor.visitExprStmt(this); }
	className() : string { return 'ExprStmt'; }
}

export class BreakStmt implements IStmt
{
	constructor(  )
	{
	}
	accept( visitor : Visitor ) : void { visitor.visitBreakStmt(this); }
	className() : string { return 'BreakStmt'; }
}

export class ContinueStmt implements IStmt
{
	constructor(  )
	{
	}
	accept( visitor : Visitor ) : void { visitor.visitContinueStmt(this); }
	className() : string { return 'ContinueStmt'; }
}

export class ImportStmt implements IStmt
{
	names : Name[];
	source : string;
	constructor( names : Name[], source : string )
	{
		this.names = names;
		this.source = source;
	}
	accept( visitor : Visitor ) : void { visitor.visitImportStmt(this); }
	className() : string { return 'ImportStmt'; }
}

export class VariableStmt implements IStmt
{
	name : Name;
	type : TypeRef;
	init : IExpr;
	constant : boolean;
	accessor : Accessor;
	uid : string = '';
	constructor( name : Name, type : TypeRef, init : IExpr, constant : boolean = false )
	{
		this.name = name;
		this.type = type;
		this.init = init;
		this.constant = constant;
	}
	accept( visitor : Visitor ) : void { visitor.visitVariableStmt(this); }
	className() : string { return 'VariableStmt'; }
}

export class TryCatchStmt implements IStmt
{
	block : IStmt;
	variable : Name;
	cblock : IStmt;
	fblock : IStmt;
	constructor( block : IStmt, variable : Name, cblock : IStmt, fblock : IStmt )
	{
		this.block = block;
		this.variable = variable;
		this.cblock = cblock;
		this.fblock = fblock;
	}
	accept( visitor : Visitor ) : void { visitor.visitTryCatchStmt(this); }
	className() : string { return 'TryCatchStmt'; }
}

export class ThrowStmt implements IStmt
{
	expr : IExpr;
	constructor( expr : IExpr )
	{
		this.expr = expr;
	}
	accept( visitor : Visitor ) : void { visitor.visitThrowStmt(this); }
	className() : string { return 'ThrowStmt'; }
}

export class Unit
{
	stmts : IStmt[];
	imports : ImportStmt[];
	constructor( stmts : IStmt[], imports : ImportStmt[] )
	{
		this.stmts = stmts;
		this.imports = imports;
	}
	accept( visitor : Visitor ) : void { visitor.visitUnit(this); }
	className() : string { return 'Unit'; }
}

export interface IVisitor{
	visitName( target : Name) : void;
	visitStringLiteral( target : StringLiteral) : void;
	visitNumberLiteral( target : NumberLiteral) : void;
	visitBoolLiteral( target : BoolLiteral) : void;
	visitNameLiteral( target : NameLiteral) : void;
	visitGroup( target : Group) : void;
	visitNullLiteral( target : NullLiteral) : void;
	visitLogicalExpr( target : LogicalExpr) : void;
	visitBinaryExpr( target : BinaryExpr) : void;
	visitAssignExpr( target : AssignExpr) : void;
	visitUnaryExpr( target : UnaryExpr) : void;
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
	visitForOfStmt( target : ForOfStmt) : void;
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
	visitTryCatchStmt( target : TryCatchStmt) : void;
	visitThrowStmt( target : ThrowStmt) : void;
	visitUnit( target : Unit) : void;
}

export class Visitor implements IVisitor {
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

