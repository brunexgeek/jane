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
    ImportStmt } from './types';

declare let require: any;
let process = require("process");

function print( value : string )
{
    process.stdout.write(value);
}

export class SvgPrinter implements IVisitor<void>
{
    visitImportStmt(target: ImportStmt): void {
        let content = this.field('from', target.source);
        let id = this.connection(this.parent, target.className(), content, this.label, SvgPrinter.STMT_COLOR);

        let i = 0;
        for (let name of target.names)
        {
            this.label = `names[${i++}]`;
            this.parent = id;
            name.accept(this);
        }

        this.parent = id;
        this.label = '<next>';
    }

    visitBreakStmt(target: BreakStmt): void
    {
        let id = this.connection(this.parent, target.className(), '', this.label, SvgPrinter.STMT_COLOR);

        this.parent = id;
        this.label = '<next>';
    }

    visitContinueStmt(target: ContinueStmt): void
    {
        let id = this.connection(this.parent, target.className(), '', this.label, SvgPrinter.STMT_COLOR);

        this.parent = id;
        this.label = '<next>';
    }

    visitCaseStmt(target: CaseStmt): void
    {
        let id = this.connection(this.parent, target.className(), '', this.label, SvgPrinter.STMT_COLOR);

        if (target.expr)
        {
            this.parent = id;
            this.label = 'expr';
            target.expr.accept(this);
        }

        if (target.stmts.length > 0)
        {
            this.parent = id;
            this.label = 'stmts';
            for (let stmt of target.stmts)
                stmt.accept(this);
        }

        this.parent = id;
        this.label = '<next>';
    }

    visitSwitchStmt(target: SwitchStmt): void
    {
        let id = this.connection(this.parent, target.className(), '', this.label, SvgPrinter.STMT_COLOR);

        this.parent = id;
        this.label = 'expr';
        target.expr.accept(this);

        this.parent = id;
        this.label = 'cases';
        for (let stmt of target.cases)
            stmt.accept(this);

        this.parent = id;
        this.label = '<next>';
    }

    visitNewExpr(target: NewExpr): void
    {
        let content = this.field('name', this.typerefToString(target.type));
        let id = this.connection(this.parent, target.className(), content, this.label);

        let i = 0;
        for (let expr of target.args)
        {
            this.label = `args[${i++}]`;
            this.parent = id;
            expr.accept(this);
        }
    }

    visitExpandExpr(target: ExpandExpr): void
    {
        let content = this.field('name', this.nameToString(target.name));
        this.connection(this.parent, target.className(), content, this.label);
    }

    private parent : number = 0;
    private id : number = 0;
    private label : string = '';
    static readonly FUNC_COLOR = '#00F0F2';
    static readonly STMT_COLOR = '#A0A0A0';
    static readonly CLASS_COLOR = '#00F070';

    visitTryCatchStmt(target: TryCatchStmt): void
    {
        let content : string = '';
        if (target.variable)
            content += this.field('variable', this.nameToString(target.variable));
        let id = this.connection(this.parent, target.className(), content, this.label, SvgPrinter.STMT_COLOR);

        if (target.block)
        {
            this.parent = id;
            this.label = 'block';
            target.block.accept(this);
        }

        if (target.cblock)
        {
            this.parent = id;
            this.label = 'cblock';
            target.cblock.accept(this);
        }

        if (target.fblock)
        {
            this.parent = id;
            this.label = 'fblock';
            target.cblock.accept(this);
        }

        this.parent = id;
        this.label = '<next>';
    }

    visitThrowStmt(target: ThrowStmt): void
    {
        let id = this.connection(this.parent, target.className(), '', this.label, SvgPrinter.STMT_COLOR);

        if (target.expr)
        {
            this.parent = id;
            this.label = 'expr';
            target.expr.accept(this);
        }

        this.parent = id;
        this.label = '<next>';
    }

    visitAccessor(target: Accessor): void {
        throw new Error("Method not implemented.");
    }

    accessorToString( target : Accessor ) : string
    {
        if (target == null) return '';

        let result = '';
        let first  = true;
        for (let i of target.values)
        {
            if (!first) result += ' ';
            result += i.lexeme;
            first = false;
        }
        return result;
    }

    visitCallExpr(target: CallExpr): void {
        let id = this.connection(this.parent, target.className(), '', this.label);

        this.label = 'callee';
        this.parent = id;
        target.callee.accept(this);

        let i = 0;
        for (let expr of target.args)
        {
            this.label = `args[${i++}]`;
            this.parent = id;
            expr.accept(this);
        }
    }

    visitArrayExpr(target: ArrayExpr): void
    {
        let id = this.connection(this.parent, target.className(), '', this.label);

        let i = 0;
        for (let expr of target.values)
        {
            this.label = `value[${i++}]`;
            this.parent = id;
            expr.accept(this);
        }
    }

    visitArrayAccessExpr(target: ArrayAccessExpr): void
    {
        let id = this.connection(this.parent, target.className(), '', this.label);

        this.label = 'callee';
        this.parent = id;
        target.callee.accept(this);

        this.label = 'index';
        this.parent = id;
        target.index.accept(this);

        this.label = '';
        this.parent = id;
    }

    nameToString( target : Name ) : string
    {
        let result = '';
        let first = true;
        for (let i of target.lexemes)
        {
            if (!first) result += '.';
            first = false;
            result += i;
        }
        return result;
    }

    typerefToString( target : TypeRef ) : string
    {
        if (!target) return '';
        let result = this.nameToString(target.name);
        let i = 0;
        while (i < target.dims)
        {
            result += '[]';
            ++i;
        }
        return result;
    }

    visitFieldExpr( target: FieldExpr ): void
    {
        let content = this.field('name', this.nameToString(target.name));
        let id = this.connection(this.parent, target.className(), content, this.label);

        this.label = 'callee';
        this.parent = id;
        target.callee.accept(this);

        this.label = '';
        this.parent = id;
    }

    visitClassStmt(target: ClassStmt): void {
        let content = this.field('name', this.typerefToString(target.name));
        if (target.extended)
            content += this.field('extends', this.typerefToString(target.extended));
        if (target.implemented)
        {
            let names = '';
            for (let i of target.implemented) names +=  ' ' + this.typerefToString(i);
            content += this.field('implements', names);
        }
        let id = this.connection(this.parent, target.className(),  content, this.label, SvgPrinter.CLASS_COLOR);

        if (target.stmts)
        {
            this.parent = id;
            this.label = 'stmts';
            let i = 0;
            for (let func of target.stmts)
            {
                //this.parent = id;
                //this.label = `functions[${i++}]`;
                func.accept(this);
            }
        }

        this.label = '<next>';
        this.parent = id;
    }

    visitName(target: Name): void {
        this.parent = this.connection(this.parent, target.className(), this.nameToString(target), this.label);
    }

    visitStringLiteral(target: StringLiteral): void {
        let content = this.field('type', target.type.name);
        content += this.field('value', escape(target.value));
        this.parent = this.connection(this.parent, target.className(), content, this.label);
    }

    visitNumberLiteral(target: NumberLiteral): void {
        this.parent = this.connection(this.parent, target.className(), target.value, this.label);
    }

    visitBoolLiteral(target: BoolLiteral): void {
        this.parent = this.connection(this.parent, target.className(), target.converted.toString(), this.label);
    }

    visitNameLiteral(target: NameLiteral): void {
        this.parent = this.connection(this.parent, target.className(), target.value, this.label);
    }

    visitGroup(target: Group): void {
        let id = this.connection(this.parent, target.className(), '', this.label);

        this.label = 'expr';
        this.parent = id;
        target.expr.accept(this);

        this.label = '';
        this.parent = id;
    }

    visitNullLiteral(target: NullLiteral): void {
        this.parent = this.connection(this.parent, target.className(), '', this.label);
    }

    visitLogicalExpr(target: LogicalExpr): void {
        let content = this.field('oper', target.oper.name);
        let id = this.connection(this.parent, target.className(), content, this.label);

        this.label = 'left';
        this.parent = id;
        target.left.accept(this);

        this.label = 'right';
        this.parent = id;
        target.right.accept(this);
    }

    visitBinaryExpr(target: BinaryExpr): void {
        let content = this.field('oper', target.oper.name);
        let id = this.connection(this.parent, target.className(), content, this.label);

        this.label = 'left';
        this.parent = id;
        target.left.accept(this);

        this.label = 'right';
        this.parent = id;
        target.right.accept(this);
    }

    visitAssignExpr(target: AssignExpr): void {
        let content = this.field('oper', target.oper.name);
        let id = this.connection(this.parent, target.className(), content, this.label);

        this.label = 'left';
        this.parent = id;
        target.left.accept(this);

        this.label = 'right';
        this.parent = id;
        target.right.accept(this);
    }

    visitUnaryExpr(target: UnaryExpr): void {
        let content = this.field('oper', target.oper.name);
        content += this.field('post', target.post.toString());
        let id = this.connection(this.parent, target.className(), content, this.label);

        this.label = 'expr';
        this.parent = id;
        target.expr.accept(this);
    }

    visitBlockStmt(target: BlockStmt): void {
        let first = true;
        for (let stmt of target.stmts)
            stmt.accept(this);
    }

    visitReturnStmt(target: ReturnStmt): void {
        let id = this.connection(this.parent, target.className(), '', this.label, SvgPrinter.STMT_COLOR);

        if (target.expr)
        {
            this.label = 'expr';
            this.parent = id;
            target.expr.accept(this);
        }

        this.label = '<next>';
        this.parent = id;
    }

    visitTypeRef(target: TypeRef): void {
    }

    visitIfStmt(target: IfStmt): void {
        let id = this.connection(this.parent, target.className(), '', this.label, SvgPrinter.STMT_COLOR);

        this.label = 'condition';
        this.parent = id;
        target.condition.accept(this);

        this.label = 'then';
        this.parent = id;
        target.thenSide.accept(this);

        if (target.elseSide)
        {
            this.label = 'else';
            this.parent = id;
            target.elseSide.accept(this);
        }

        this.label = '<next>';
        this.parent = id;
    }

    visitForOfStmt(target: ForOfStmt): void {
        let id = this.connection(this.parent, target.className(), '', this.label, SvgPrinter.STMT_COLOR);

        this.label = 'variable';
        this.parent = id;
        target.variable.accept(this);

        this.label = 'expr';
        this.parent = id;
        target.expr.accept(this);

        this.label = 'stmt';
        this.parent = id;
        target.stmt.accept(this);

        this.label = '<next>';
        this.parent = id;
    }

    visitDoWhileStmt(target: DoWhileStmt): void {
        let id = this.connection(this.parent, target.className(), '', this.label, SvgPrinter.STMT_COLOR);

        this.label = 'condition';
        this.parent = id;
        target.condition.accept(this);

        this.label = 'stmt';
        this.parent = id;
        target.stmt.accept(this);

        this.label = '<next>';
        this.parent = id;
    }

    visitWhileStmt(target: WhileStmt): void {
        let id = this.connection(this.parent, target.className(), '', this.label, SvgPrinter.STMT_COLOR);

        this.label = 'condition';
        this.parent = id;
        target.condition.accept(this);

        this.label = 'stmt';
        this.parent = id;
        target.stmt.accept(this);

        this.label = '<next>';
        this.parent = id;
    }

    visitParameter(target: Parameter): void {
        let content = `<b>name:</b>   ${this.nameToString(target.name)}`;
        if (target.type)
            content += `<br/><b>type:</b>   ${this.typerefToString(target.type)}`;
        let id = this.connection(this.parent, target.className(), content, this.label);

        if (target.init)
        {
            this.label = 'init';
            this.parent = id;
            target.init.accept(this);
        }
    }

    visitFunctionStmt(target: FunctionStmt): void {
        let content = this.field('name', this.nameToString(target.name));
        content += this.field('type', this.typerefToString(target.type));
        if (target.accessor)
            content += this.field('accessor', this.accessorToString(target.accessor));
        if (target.property)
            content += this.field('property', target.property.name);
        let id = this.connection(this.parent, target.className(), content, this.label, SvgPrinter.FUNC_COLOR);

        if (target.params)
        {
            let i = 0;
            for (let item of target.params)
            {
                this.parent = id;
                this.label = `params[${i++}]`;
                item.accept(this);
            }
        }

        if (target.body)
        {
            this.label = 'body';
            this.parent = id;
            target.body.accept(this);
        }

        this.parent = id;
        this.label = '<next>';
    }

    visitExprStmt(target: ExprStmt): void {
        let id = this.connection(this.parent, target.className(), '', this.label, SvgPrinter.STMT_COLOR);

        this.parent = id;
        this.label = 'expr';
        target.expr.accept(this);

        this.label = '<next>';
        this.parent = id;
    }

    visitVariableStmt(target: VariableStmt): void {
        let content = this.field('name', this.nameToString(target.name));
        content += this.field('constant', target.constant.toString());
        content += this.field('type', this.typerefToString(target.type));
        if (target.accessor)
            content += this.field('accessor', this.accessorToString(target.accessor), true);
        let id = this.connection(this.parent, target.className(), content, this.label, SvgPrinter.STMT_COLOR);

        if (target.init)
        {
            this.label = 'init';
            this.parent = id;
            target.init.accept(this);
        }

        this.label = '<next>';
        this.parent = id;
    }

    visitNamespaceStmt(target: NamespaceStmt): void
    {
        let content = this.field('name', this.nameToString(target.name));
        let id = this.connection(this.parent, target.className(), content, this.label, SvgPrinter.STMT_COLOR);
        if (target.stmts)
        {
            this.parent = id;
            this.label = 'stmts';
            for (let stmt of target.stmts)
                stmt.accept(this);
        }

        this.label = '<next>';
        this.parent = id;
    }

    printGraph()
    {
        print(`digraph AST {
            node [shape=record style=filled fontsize=10];
            edge [fontsize=10];
            splines=polyline;\n`);
    }

    visitUnits( target : Unit[] )
    {
        this.printGraph();
        let id = 0;
        for (let unit of target )
            this.visitUnit(unit, id++);
        print('}');
    }

    visitUnit( target: Unit, sid : number = -1 ): void {
        if (sid < 0)
            this.printGraph();
        else
            print(`subgraph graph_${sid} {`);

        //print(`${++this.id} [label=<{<b>Unit</b>}>]`);
        let content = this.field('fileName', target.fileName);
        this.node(++this.id, target.className(), content, SvgPrinter.STMT_COLOR);

        this.parent = this.id;
        this.label = 'stmts';
        for (let stmt of target.stmts)
            stmt.accept(this);

        print('}\n');
    }

    field( name : string, value : string, last : boolean = false ) : string
    {
        let result = `<b>${name}:</b>   ${value}`;
        if (!last) result += '<br/>';
        return result;
    }

    connection( parent : number, type : string, content : string = '', label : string = '', color : string = '#FFFFFF' ) : number
    {
        this.node(++this.id, type, content, color);
        this.vertice(parent, this.id, label);
        return this.id;
    }

    node( id : number, type : string, content : string, color : string )
    {
        if (content.length != 0)
            print(`${id} [label=<{<b>${type}</b>|${content}}> fillcolor="${color}"]\n`);
        else
            print(`${id} [label=<{<b>${type}</b>}> fillcolor="${color}"]\n`);
    }

    vertice( parent : number, id : number, label : string = '' )
    {
        if (label.length == 0)
            print(`${parent} -> ${id};\n`);
        else
        {
            print(`${parent} -> ${id} [label="${label}" style="${ (label == '<next>') ? 'dashed' : 'solid'}"];\n`);
        }
    }
}
