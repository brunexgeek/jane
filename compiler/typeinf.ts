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

import { CompilationContext } from './compiler';
import {
    IVisitor,
    Name,
	StringLiteral,
	NumberLiteral,
	BoolLiteral,
	NameLiteral,
	Group,
	NullLiteral,
	LogicalExpr,
	BinaryExpr,
	AssignExpr,
	UnaryExpr,
	CallExpr,
	ArrayExpr,
	ArrayAccessExpr,
	FieldExpr,
	NewExpr,
	Accessor,
	BlockStmt,
	ReturnStmt,
	NamespaceStmt,
	TypeRef,
	CaseStmt,
	SwitchStmt,
	IfStmt,
	ForOfStmt,
	DoWhileStmt,
	WhileStmt,
	Parameter,
	ExpandExpr,
	FunctionStmt,
	ClassStmt,
	ExprStmt,
	BreakStmt,
	ContinueStmt,
	VariableStmt,
	TryCatchStmt,
	ThrowStmt,
    Unit,
    ImportStmt,
    IStmt} from './types';

declare var require: any;

class SignatureMap
{
    keys : string[] = [];
    values : string[] = [];

    constructor()
    {
        this.insert('number', 'N');
        this.insert('string', 'S');
        this.insert('boolean', 'B');
    }

    find( key : string ) : string
    {
        let idx = this.keys.indexOf(key);
        if (idx == -1) return 'L' + key + ';';
        return this.values[idx];
    }

    insert( key : string, value : string )
    {
        this.keys.push(key);
        this.values.push(value);
    }
}

export class TypeUID
{
    signatures : SignatureMap = new SignatureMap();
    ctx : CompilationContext;

    constructor( ctx : CompilationContext )
    {
        this.ctx = ctx;
    }

    process( unit : Unit )
    {
        this.processStmts(unit.stmts);
    }

    processStmts( stmts : IStmt[] )
    {
        for (let stmt of stmts)
        {
            if (stmt instanceof NamespaceStmt)
                this.processStmts(stmt.stmts);
            else
            if (stmt instanceof ClassStmt)
                this.processClass(stmt);
            else
            if (stmt instanceof FunctionStmt)
                this.processFunction(stmt);
            else
            if (stmt instanceof VariableStmt)
                this.processVariable(stmt);
        }
    }

    typeUid( target : TypeRef ) : string
    {
        return target.name.lexemes[ target.name.lexemes.length - 1 ];
    }

    typeSignature( target : TypeRef ) : string
    {
        if (!target) return '';

        let result = '';
        let i = 0;
        while (i++ < target.dims) result += '[';
        if (!target.uid || target.uid.length == 0)
            target.uid = this.typeUid(target);
        result += this.signatures.find(target.uid);
        return result;
    }

    processFunction(target: FunctionStmt): void {
        let sign = '';

        sign += target.name.lexemes[0] + ':';
        if (target.property) sign += '@';
        sign += '(';
        for (let par of target.params)
        {
            if (par.vararg) sign += '.';
            sign += this.typeSignature(par.type);
        }
        sign += ')';
        if (target.type)
            sign += this.typeSignature(target.type);
        else
            sign += 'V';
        target.uid = sign;
        console.error('---- signature is ' + sign);
    }

    processClass(target: ClassStmt): void {
        let content = '';
        for (let f of target.stmts)
        {
            if (f instanceof FunctionStmt)
                this.processFunction(f);
            else
            if (f instanceof VariableStmt)
                this.processVariable(f);
            else
                continue;
            content += f.uid;
        }

        target.uid = target.name.lexemes[0] + '_' + this.sha256(content);
        console.error('---- signature is ' + target.uid);
    }

    processVariable(target: VariableStmt): void
    {
        let sign = target.name.lexemes[0] + ':';
        sign += this.typeSignature(target.type);
        target.uid = sign;
        console.error('---- signature is ' + sign);
    }

    sha256( value : string ) : string
    {
        return require('crypto').createHash("sha256").update(value).digest('hex');
    }
}

export class TypeInference implements IVisitor
{
    ctx : CompilationContext;
    stack : string[] = [];

    constructor( ctx : CompilationContext )
    {
        this.ctx = ctx;
    }
    visitName(target: Name): void {

    }
    visitStringLiteral(target: StringLiteral): void
    {
        this.stack.push('string');
    }

    visitNumberLiteral(target: NumberLiteral): void
    {
        this.stack.push('number');
    }

    visitBoolLiteral(target: BoolLiteral): void
    {
        this.stack.push('boolean');
    }
    visitNameLiteral(target: NameLiteral): void
    {

    }
    visitGroup(target: Group): void {

    }
    visitNullLiteral(target: NullLiteral): void {

    }
    visitLogicalExpr(target: LogicalExpr): void {

    }
    visitBinaryExpr(target: BinaryExpr): void {

    }
    visitAssignExpr(target: AssignExpr): void {

    }
    visitUnaryExpr(target: UnaryExpr): void {

    }
    visitCallExpr(target: CallExpr): void {

    }
    visitArrayExpr(target: ArrayExpr): void {

    }
    visitArrayAccessExpr(target: ArrayAccessExpr): void {

    }
    visitFieldExpr(target: FieldExpr): void {

    }
    visitNewExpr(target: NewExpr): void {

    }
    visitAccessor(target: Accessor): void {

    }
    visitBlockStmt(target: BlockStmt): void {

    }
    visitReturnStmt(target: ReturnStmt): void {

    }
    visitNamespaceStmt(target: NamespaceStmt): void {

    }
    visitTypeRef(target: TypeRef): void {

    }
    visitCaseStmt(target: CaseStmt): void {

    }
    visitSwitchStmt(target: SwitchStmt): void {

    }
    visitIfStmt(target: IfStmt): void {

    }
    visitForOfStmt(target: ForOfStmt): void {

    }
    visitDoWhileStmt(target: DoWhileStmt): void {

    }
    visitWhileStmt(target: WhileStmt): void {

    }
    visitParameter(target: Parameter): void {

    }
    visitExpandExpr(target: ExpandExpr): void {

    }
    visitFunctionStmt(target: FunctionStmt): void {

    }
    visitClassStmt(target: ClassStmt): void {

    }
    visitExprStmt(target: ExprStmt): void {

    }
    visitBreakStmt(target: BreakStmt): void {

    }

    visitContinueStmt(target: ContinueStmt): void
    {

    }

    visitImportStmt(target: ImportStmt): void
    {

    }

    visitVariableStmt(target: VariableStmt): void
    {
        if (target.init) target.init.accept(this);
    }

    visitTryCatchStmt(target: TryCatchStmt): void
    {

    }

    visitThrowStmt(target: ThrowStmt): void
    {

    }

    visitUnit(target: Unit): void
    {
        for (let stmt of target.stmts)
            stmt.accept(this);
    }

}