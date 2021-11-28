
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

import { Modifier,
    ArrayAccessExpr,
    ArrayExpr,
    AssignExpr,
    BinaryExpr,
    BlockStmt,
    BoolLiteral,
    BreakStmt,
    CallExpr,
    CaseStmt,
    ClassStmt,
    ContinueStmt,
    DoWhileStmt,
    EnumStmt,
    ExpandExpr,
    ExprStmt,
    ForOfStmt,
    ForStmt,
    FunctionStmt,
    Group,
    IfStmt,
    ImportStmt,
    LogicalExpr,
    Name,
    NameLiteral,
    NamespaceStmt,
    NewExpr,
    NullLiteral,
    NumberLiteral,
    Parameter,
    PropertyStmt,
    ReturnStmt,
    StringLiteral,
    SwitchStmt,
    TemplateStringExpr,
    TernaryExpr,
    ThrowStmt,
    TryCatchStmt,
    TypeCastExpr,
    TypeRef,
    UnaryExpr,
    Unit,
    VariableStmt,
    Visitor,
    WhileStmt,
    DispatcherVoid,
    EnumDecl,
    VariableDecl,
    ChainingExpr,
    OptChainingExpr,
    IExpr} from './types';
import { basename,
    Logger,
    StringBuffer } from './utils';

let current_id = 0;

class Field
{
    name : string;
    value : string;
    tooltip? : string;
}

const CSS = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    padding: 0;
    margin: 0;
    font-family: monospace, sans-serif;
    font-size: 12px;
    background-color: #fff;
  }

  ul {
    margin-left: 20px;
  }

  .ast li {
    list-style-type: none;
    margin: 10px 0 10px 10px;
    position: relative;
  }
  .ast li:before {
    content: "";
    position: absolute;
    top: -10px;
    left: -20px;
    border-left: 1px dashed #888;
    border-bottom: 1px dashed #888;
    width: 20px;
    height: 22px;
  }
  .ast li:after {
    position: absolute;
    content: "";
    top: 12px;
    left: -20px;
    border-left: 1px dashed #888;
    border-top: 1px dashed #888;
    width: 20px;
    height: 100%;
  }
  .ast li:last-child:after {
    display: none;
  }
  .ast li div.node {
    display: inline-block;
    color: #444;
    text-decoration: none;
    background-color: #f1faee;
  }

  .ast li div.node div.title {
    border: 1px solid #444;
    padding: .4em .6em;
    margin: 0;
  }

  .ast li div.node div.fields span.k {
      font-weight: bold;
  }

  .ast li div.node div.fields {
    border-left: 1px solid #444;
    border-right: 1px solid #444;
    border-bottom: 1px solid #444;
    padding: .4em .6em;
    margin: 0;
  }

  .ast div.node.btn { cursor: pointer; }
  .ast div.stmt { background-color: #74FBD7 !important }
  .ast div.expr { background-color: #A2E1F6 !important }
  .ast div.lit { background-color: #FFD166 !important }
  .ast div.__ClassStmt { background-color: #F7A1B5  !important }
  .ast div.__FunctionStmt { background-color: #f4a261 !important }
  .ast div.__Unit, .ast div.__Module { background-color: #BACBA9 !important }
  .ast div.node div.title { font-weight: bold; text-align: center; }`;

const SCRIPT = `
function toggle(id)
{
    let e = document.getElementById(id);
    if (e) e.style.display = ((e.style.display!='none')?'none':'block');
}
`;

export class WebAstPrinter extends DispatcherVoid
{
    sbuf : StringBuffer = new StringBuffer();

    private print( value : string )
    {
        this.sbuf.writeln(value);
    }

    private open_entity(title : string, children : boolean = false, fields : Field[] = [] )
    {
        let css = `node __${title}`;
        if (title.indexOf('Stmt') > 0)
            css += ' stmt';
        else
        if (title.indexOf('Literal') > 0)
            css += ' lit';
        else
        if (title[0] == title[0].toUpperCase())
            css += ' expr';

        let script = '';
        if (children)
        {
            script = `onclick="javascript:toggle('c${current_id}')"`;
            css += ' btn';
        }

        this.print(`<li><div id="n${current_id}" class="${css}" ${script}><div class='title'><span>${title}</span></div>`);
        if (fields.length > 0)
        {
            this.print("<div class='fields'>");
            for (let cur of fields)
                this.print(`<p><span class='k'>${cur.name}:</span> <span class='v'${ cur.tooltip ? ` title='${cur.tooltip}'` : ''}>${cur.value}</span></p>`);
            this.print('</div>');
        }
        this.print('</div>');
        if (children) this.print(`<ul id="c${current_id}">`);
        ++current_id;
    }

    private close_entity( children : boolean = false )
    {
        if (children) this.print('</ul>');
        this.print('</li>');
    }

    private empty_entity( title : string, fields : Field[] = [] )
    {
        this.open_entity(title, false, fields);
        this.close_entity(false);
    }

    protected resolvedType( target : IExpr, content : Field[] )
    {
        if (!target.resolvedType()) return;
        let tname = target.resolvedType().name.qualified;
        for (let i = 0; i < target.resolvedType().dims; ++i)
            tname += '[]';
        content.push({name:'resolvedType',value:tname});
    }

    protected visitName(target: Name): void {
        let content : Field[] = [
            {name:'canonical',value:`"${target.canonical}"`}
        ];
        if (target.canonical != target.qualified)
            content.push({name:'qualified',value:`"${target.qualified}"`});
        this.empty_entity(target.className(), content);
    }
    protected visitStringLiteral(target: StringLiteral): void {
        let content : Field[] = [
            {name:'value',value:`"${target.value}"`}
        ];
        this.resolvedType(target, content);
        this.empty_entity(target.className(), content);
    }
    protected visitTemplateStringExpr(target: TemplateStringExpr): void {
        let content : Field[] = [];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('value', true);
        for (let item of target.value)
            this.dispatch(item);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitNumberLiteral(target: NumberLiteral): void {
        let content : Field[] = [
            {name:'value',value:target.value}
        ];
        this.resolvedType(target, content);
        this.empty_entity(target.className(), content);
    }
    protected visitBoolLiteral(target: BoolLiteral): void {
        let content : Field[] = [
            {name:'value',value:target.converted?'true':'false'}
        ];
        this.resolvedType(target, content);
        this.empty_entity(target.className(), content);
    }
    protected visitNameLiteral(target: NameLiteral): void {
        let content : Field[] = [
            {name:'value',value:target.value}
        ];
        this.resolvedType(target, content);
        this.empty_entity(target.className(), content);
    }
    protected visitGroup(target: Group): void {
        this.open_entity(target.className(), true);

        this.open_entity('expr', true);
        this.dispatch(target.expr);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitNullLiteral(target: NullLiteral): void {
        let content : Field[] = [];
        this.resolvedType(target, content);
        this.empty_entity(target.className(), content);
    }
    protected visitLogicalExpr(target: LogicalExpr): void {
        let content : Field[] = [
            {name:'oper',value:target.oper.name}
        ];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('left', true);
        this.dispatch(target.left);
        this.close_entity(true);

        this.open_entity('right', true);
        this.dispatch(target.right);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitBinaryExpr(target: BinaryExpr): void {
        let content : Field[] = [
            {name:'oper',value:target.oper.name},
        ];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('left', true);
        this.dispatch(target.left);
        this.close_entity(true);

        this.open_entity('right', true);
        this.dispatch(target.right);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitAssignExpr(target: AssignExpr): void {
        let content : Field[] = [
            {name:'oper',value:target.oper.name},
        ];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('left', true);
        this.dispatch(target.left);
        this.close_entity(true);

        this.open_entity('right', true);
        this.dispatch(target.right);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitUnaryExpr(target: UnaryExpr): void {
        let content : Field[] = [
            {name:'oper',value:target.oper.name},
            {name:'style',value:target.post?'post':'pre'}
        ];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('expr', true);
        this.dispatch(target.expr);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitTypeCastExpr(target: TypeCastExpr): void {
        let content : Field[] = [];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('expr', true);
        this.dispatch(target.expr);
        this.close_entity(true);

        this.open_entity('type', true);
        this.dispatch(target.type);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitCallExpr(target: CallExpr): void {
        let content : Field[] = [];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('callee', true);
        this.dispatch(target.callee);
        this.close_entity(true);

        this.open_entity('args', true);
        for (let item of target.args)
            this.dispatch(item);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitArrayExpr(target: ArrayExpr): void {
        let content : Field[] = [];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('values', true);
        for (let item of target.values)
            this.dispatch(item);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitArrayAccessExpr(target: ArrayAccessExpr): void {
        let content : Field[] = [];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('callee', true);
        this.dispatch(target.callee);
        this.close_entity(true);

        this.open_entity('index', true);
        this.dispatch(target.index);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitChainingExpr(target: ChainingExpr): void {
        let content : Field[] = [];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('callee', true);
        this.dispatch(target.callee);
        this.close_entity(true);

        this.open_entity('name', true);
        this.dispatch(target.name);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitOptChainingExpr(target: OptChainingExpr): void {
        let content : Field[] = [];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('callee', true);
        this.dispatch(target.callee);
        this.close_entity(true);

        this.open_entity('name', true);
        this.dispatch(target.name);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitNewExpr(target: NewExpr): void {
        let content : Field[] = [];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('type', true);
        this.dispatch(target.type);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitModifier(target: Modifier): void {
        this.open_entity(target.className(), true);

        this.open_entity('values', true);
        for (let item of target.values)
            this.empty_entity(item.name);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitReturnStmt(target: ReturnStmt): void {
        this.open_entity(target.className(), true);

        this.open_entity('expr', true);
        this.dispatch(target.expr);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitNamespaceStmt(target: NamespaceStmt): void {
        this.open_entity(target.className(), true);

        this.open_entity('name', true);
        this.dispatch(target.name);
        this.close_entity(true);

        this.open_entity('stmts', true);
        for (let item of target.stmts)
            this.dispatch(item);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitTypeRef(target: TypeRef): void {
        let content : Field[] = [
            {name:'name', value:target.qualified},
        ];
        if (target.isClass)
            content.push({name:'isClass', value:'true'});
        if (target.isFunction)
            content.push({name:'isFunction', value:'true'});
        if (target.dims > 0)
            content.push({name:'dims', value:target.dims.toString()});
        if (target.isPrimitive())
            content.push({name:'isPrimitive', value:'true'});
        this.empty_entity(target.className(), content);
    }
    protected visitCaseStmt(target: CaseStmt): void {
        this.open_entity(target.className(), true);

        this.open_entity('expr', true);
        this.dispatch(target.expr);
        this.close_entity(true);

        this.open_entity('stmts', true);
        for (let item of target.stmts)
            this.dispatch(item);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitSwitchStmt(target: SwitchStmt): void {
        this.open_entity(target.className(), true);

        this.open_entity('expr', true);
        this.dispatch(target.expr);
        this.close_entity(true);

        this.open_entity('cases', true);
        for (let item of target.cases)
            this.dispatch(item);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitIfStmt(target: IfStmt): void {
        this.open_entity(target.className(), true);

        this.open_entity('condition', true);
        this.dispatch(target.condition);
        this.close_entity(true);

        this.open_entity('thenSize', true);
        this.dispatch(target.thenSide);
        this.close_entity(true);

        this.open_entity('elseSide', true);
        this.dispatch(target.elseSide);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitTernaryExpr(target: TernaryExpr): void {
        let content : Field[] = [];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('condition', true);
        this.dispatch(target.condition);
        this.close_entity(true);

        this.open_entity('thenSize', true);
        this.dispatch(target.thenSide);
        this.close_entity(true);

        this.open_entity('elseSide', true);
        this.dispatch(target.elseSide);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitForOfStmt(target: ForOfStmt): void {
        this.open_entity(target.className(), true);

        this.open_entity('variable', true);
        this.dispatch(target.variable);
        this.close_entity(true);

        this.open_entity('expr', true);
        this.dispatch(target.expr);
        this.close_entity(true);

        this.open_entity('stmt', true);
        this.dispatch(target.stmt);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitForStmt(target: ForStmt): void {
        this.open_entity(target.className(), true);

        this.open_entity('init', true);
        this.dispatch(target.init);
        this.close_entity(true);

        this.open_entity('condition', true);
        this.dispatch(target.condition);
        this.close_entity(true);

        this.open_entity('fexpr', true);
        this.dispatch(target.fexpr);
        this.close_entity(true);

        this.open_entity('stmt', true);
        this.dispatch(target.stmt);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitDoWhileStmt(target: DoWhileStmt): void {
        this.open_entity(target.className(), true);

        this.open_entity('stmt', true);
        this.dispatch(target.stmt);
        this.close_entity(true);

        this.open_entity('condition', true);
        this.dispatch(target.condition);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitWhileStmt(target: WhileStmt): void {
        this.open_entity(target.className(), true);

        this.open_entity('condition', true);
        this.dispatch(target.condition);
        this.close_entity(true);

        this.open_entity('stmt', true);
        this.dispatch(target.stmt);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitParameter(target: Parameter): void {
        let content : Field[] = [];
        if (target.vararg)
            content.push({ name:'varargs', value:'true' });
        this.open_entity(target.className(), true, content);

        this.open_entity('name', true);
        this.dispatch(target.name);
        this.close_entity(true);

        this.open_entity('type', true);
        this.dispatch(target.type);
        this.close_entity(true);

        if (target.init)
        {
            this.open_entity('init', true);
            this.dispatch(target.init);
            this.close_entity(true);
        }

        this.close_entity(true);
    }
    protected visitExpandExpr(target: ExpandExpr): void {
        let content : Field[] = [];
        this.resolvedType(target, content);
        this.open_entity(target.className(), true, content);

        this.open_entity('name', true);
        this.dispatch(target.name);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitClassStmt(target: ClassStmt): void {
        let content : Field[] = [];
        if (target.isInterface)
            content.push({ name:'interface', value: 'true' });
        this.open_entity(target.className(), true, content);

        this.open_entity('name', true);
        this.dispatch(target.name);
        this.close_entity(true);

        if (target.extended)
        {
            this.open_entity('extended', true);
            this.dispatch(target.extended);
            this.close_entity(true);
        }

        if (target.implemented && target.implemented.length > 0)
        {
            this.open_entity('implemented', true);
            for (let item of target.implemented)
            this.dispatch(item);
            this.close_entity(true);
        }

        if (target.stmts && target.stmts.length > 0)
        {
            this.open_entity('stmts', true);
            for (let item of target.stmts)
            this.dispatch(item);
            this.close_entity(true);
        }

        this.close_entity(true);
    }
    protected visitExprStmt(target: ExprStmt): void {
        this.open_entity(target.className(), true);

        this.open_entity('expr', true);
        this.dispatch(target.expr);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitBreakStmt(target: BreakStmt): void {
        this.empty_entity(target.className());
    }
    protected visitContinueStmt(target: ContinueStmt): void {
        this.empty_entity(target.className());
    }
    protected visitImportStmt(target: ImportStmt): void {
        let content : Field[] = [
            { name:'source', value:target.source }
        ];
        this.open_entity(target.className(), true, content);

        this.open_entity('names', true);
        for (let item of target.names)
            this.dispatch(item);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitVariableDecl(target: VariableDecl): void {
        this.open_entity(target.className(), true);

        this.open_entity('name', true);
        this.dispatch(target.name);
        this.close_entity(true);

        if (target.type)
        {
            this.open_entity('type', true);
            this.dispatch(target.type);
            this.close_entity(true);
        }

        if (target.init)
        {
            this.open_entity('init', true);
            this.dispatch(target.init);
            this.close_entity(true);
        }

        this.close_entity(true);
    }
    protected visitVariableStmt(target: VariableStmt): void {
        this.open_entity(target.className(), true);

        this.open_entity('decls', true);
        for (let item of target.decls)
            this.dispatch(item);
        this.close_entity(true);

        this.close_entity(true);
    }
    protected visitPropertyStmt(target: PropertyStmt): void {
        this.open_entity(target.className(), true);

        if (target.modifier?.values.length > 0)
        {
            this.open_entity('modifier', true);
            this.dispatch(target.modifier);
            this.close_entity(true);
        }

        this.open_entity('name', true);
        this.dispatch(target.name);
        this.close_entity(true);

        if (target.type)
        {
            this.open_entity('type', true);
            this.dispatch(target.type);
            this.close_entity(true);
        }

        if (target.init)
        {
            this.open_entity('init', true);
            this.dispatch(target.init);
            this.close_entity(true);
        }

        this.close_entity(true);
    }
    protected visitTryCatchStmt(target: TryCatchStmt): void {
        this.open_entity(target.className(), true);

        this.open_entity('try', true);
        this.dispatch(target.block);
        this.close_entity(true);

        if (target.cblock)
        {
            this.open_entity('catch', true);
            this.dispatch(target.cblock);
            this.close_entity(true);
        }

        if (target.fblock)
        {
            this.open_entity('finally', true);
            this.dispatch(target.fblock);
            this.close_entity(true);
        }

        this.close_entity(true);
    }
    protected visitThrowStmt(target: ThrowStmt): void {
        this.open_entity(target.className(), true);
        this.dispatch(target.expr);
        this.close_entity(true);
    }

    protected visitEnumDecl(target: EnumDecl): void {
        this.open_entity(target.className(), true);

        this.open_entity('name', true);
        this.dispatch(target.name);
        this.close_entity(true);

        if (target.init)
        {
            this.open_entity('init', true);
            this.dispatch(target.init);
            this.close_entity(true);
        }

        this.close_entity(true);
    }

    protected visitEnumStmt(target: EnumStmt): void {
        this.open_entity(target.className(), true);

        this.open_entity('name', true);
        this.dispatch(target.name);
        this.close_entity(true);

        this.open_entity('values', true);
        for (let item of target.values)
            this.dispatch(item);
        this.close_entity(true);

        this.close_entity(true);
    }

    visitBlockStmt(target: BlockStmt): void {
        this.open_entity(target.className(), target.stmts.length > 0);
        for (let stmt of target.stmts)
            this.dispatch(stmt);
        this.close_entity(target.stmts.length > 0);
    }

    visitFunctionStmt(target: FunctionStmt): void {
        let content : Field[] = [];
        if (target.accessor)
            content.push({ name:'accessor', value:target.accessor.name});
        this.open_entity(target.className(), true, content);

        if (target.modifier?.values.length > 0)
        {
            this.open_entity('modifier', true);
            this.dispatch(target.modifier);
            this.close_entity(true);
        }

        this.open_entity('name', true);
        this.dispatch(target.name);
        this.close_entity(true);

        this.open_entity('type', true);
        this.dispatch(target.type);
        this.close_entity(true);

        if (target.params.length > 0)
        {
            this.open_entity('params', true);
            for (let item of target.params)
                this.dispatch(item);
            this.close_entity(true);
        }

        if (target.body)
        {
            this.open_entity('body', true);
            this.dispatch(target.body);
            this.close_entity(true);
        }

        this.close_entity(true);
    }

    visitUnit(target: Unit): void {
        this.open_entity('Unit', target.stmts.length > 0,
            [{name:'fileName', value: basename(target.fileName), tooltip: target.fileName}]);
        for (let stmt of target.stmts)
            this.dispatch(stmt);
        this.close_entity(target.stmts.length > 0);
    }

    renderUnit( target : Unit ) : void
    {
        this.print(`<html><head><style>${CSS}</style><title></title></head>
        <script>${SCRIPT}</script><body><ul class="ast">`);
        this.visitUnit(target);
        this.print('</ul></body></html>');
    }

    renderModule( targets : Unit[] ) : string
    {
        this.print(`<html><head><style>${CSS}</style><title></title></head>
        <script>${SCRIPT}</script><body><ul class="ast">`);
        this.open_entity('Module', true);
        for (let item of targets)
            this.visitUnit(item);
        this.close_entity(true);
        this.print('</ul></body></html>');
        let output = this.sbuf.toString();
        this.sbuf.clear();
        return output;
    }
}