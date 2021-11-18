import { Modifier, ArrayAccessExpr, ArrayExpr, AssignExpr, BinaryExpr, BlockStmt, BoolLiteral, BreakStmt, CallExpr, CaseStmt, ClassStmt, ContinueStmt, DoWhileStmt, EnumStmt, ExpandExpr, ExprStmt, FieldExpr, ForOfStmt, ForStmt, FunctionStmt, Group, IfStmt, ImportStmt, IVisitor, LogicalExpr, Name, NameLiteral, NamespaceStmt, NewExpr, NullLiteral, NumberLiteral, Parameter, PropertyStmt, ReturnStmt, StringLiteral, SwitchStmt, TemplateStringExpr, TernaryExpr, ThrowStmt, TryCatchStmt, TypeCastExpr, TypeRef, UnaryExpr, Unit, VariableStmt, Visitor, WhileStmt, DispatcherVoid } from './types';
import { basename, Logger } from './utils';

declare let require: any;
let process = require("process");
let ccol = 0;
let crow = 0;
let current_id = 0;
const LINE_WIDTH = 8;
const FONT_SIZE = 14;
const LINE_HEIGHT_SPACED = FONT_SIZE;//2 + LINE_HEIGHT + 2;
const LINE_HALF_SPACED = LINE_HEIGHT_SPACED / 2;

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
function print( value : string )
{
    process.stdout.write(value);
    process.stdout.write('\n');
}

function open_entity(title : string, children : boolean = false, fields : Field[] = [] )
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

    print(`<li><div id="n${current_id}" class="${css}" ${script}><div class='title'><span>${title}</span></div>`);
    if (fields.length > 0)
    {
        print("<div class='fields'>");
        for (let cur of fields)
            print(`<p><span class='k'>${cur.name}:</span> <span class='v'${ cur.tooltip ? ` title='${cur.tooltip}'` : ''}>${cur.value}</span></p>`);
        print('</div>');
    }
    print('</div>');
    if (children) print(`<ul id="c${current_id}">`);
    ++current_id;
}

function close_entity( children : boolean = false )
{
    if (children) print('</ul>');
    print('</li>');
}

function empty_entity( title : string, fields : Field[] = [] )
{
    open_entity(title, false, fields);
    close_entity(false);
}

export class WebAstPrinter extends DispatcherVoid
{
    protected visitName(target: Name): void {
        let content : Field[] = [
            {name:'canonical',value:`"${target.canonical}"`}
        ];
        if (target.canonical != target.qualified)
            content.push({name:'qualified',value:`"${target.qualified}"`});
        empty_entity(target.className(), content);
    }
    protected visitStringLiteral(target: StringLiteral): void {
        let content : Field[] = [
            {name:'value',value:`"${target.value}"`}
        ];
        empty_entity(target.className(), content);
    }
    protected visitTemplateStringExpr(target: TemplateStringExpr): void {
        open_entity(target.className(), true);

        open_entity('value', true);
        for (let item of target.value)
            this.dispatch(item);
        close_entity(true);

        close_entity(true);
    }
    protected visitNumberLiteral(target: NumberLiteral): void {
        let content : Field[] = [
            {name:'value',value:target.value}
        ];
        empty_entity(target.className(), content);
    }
    protected visitBoolLiteral(target: BoolLiteral): void {
        let content : Field[] = [
            {name:'value',value:target.converted?'true':'false'}
        ];
        empty_entity(target.className(), content);
    }
    protected visitNameLiteral(target: NameLiteral): void {
        let content : Field[] = [
            {name:'value',value:target.value}
        ];
        empty_entity(target.className(), content);
    }
    protected visitGroup(target: Group): void {
        open_entity(target.className(), true);

        open_entity('expr', true);
        this.dispatch(target.expr);
        close_entity(true);

        close_entity(true);
    }
    protected visitNullLiteral(target: NullLiteral): void {
        empty_entity(target.className());
    }
    protected visitLogicalExpr(target: LogicalExpr): void {
        let content : Field[] = [
            {name:'oper',value:target.oper.name}
        ];
        open_entity(target.className(), true, content);

        open_entity('left', true);
        this.dispatch(target.left);
        close_entity(true);

        open_entity('right', true);
        this.dispatch(target.right);
        close_entity(true);

        close_entity(true);
    }
    protected visitBinaryExpr(target: BinaryExpr): void {
        let content : Field[] = [
            {name:'oper',value:target.oper.name},
        ];
        open_entity(target.className(), true, content);

        open_entity('left', true);
        this.dispatch(target.left);
        close_entity(true);

        open_entity('right', true);
        this.dispatch(target.right);
        close_entity(true);

        close_entity(true);
    }
    protected visitAssignExpr(target: AssignExpr): void {
        open_entity(target.className(), true);

        open_entity('left', true);
        this.dispatch(target.left);
        close_entity(true);

        open_entity('right', true);
        this.dispatch(target.right);
        close_entity(true);

        close_entity(true);
    }
    protected visitUnaryExpr(target: UnaryExpr): void {
        let content : Field[] = [
            {name:'oper',value:target.oper.name},
            {name:'style',value:target.post?'post':'pre'}
        ];
        open_entity(target.className(), true, content);

        open_entity('expr', true);
        this.dispatch(target.expr);
        close_entity(true);

        close_entity(true);
    }
    protected visitTypeCastExpr(target: TypeCastExpr): void {
        open_entity(target.className(), true);

        open_entity('expr', true);
        this.dispatch(target.expr);
        close_entity(true);

        open_entity('type', true);
        this.dispatch(target.type);
        close_entity(true);

        close_entity(true);
    }
    protected visitCallExpr(target: CallExpr): void {
        open_entity(target.className(), true);

        open_entity('callee', true);
        this.dispatch(target.callee);
        close_entity(true);

        open_entity('args', true);
        for (let item of target.args)
            this.dispatch(item);
        close_entity(true);

        close_entity(true);
    }
    protected visitArrayExpr(target: ArrayExpr): void {
        open_entity(target.className(), true);

        open_entity('values', true);
        for (let item of target.values)
            this.dispatch(item);
        close_entity(true);

        close_entity(true);
    }
    protected visitArrayAccessExpr(target: ArrayAccessExpr): void {
        open_entity(target.className(), true);

        open_entity('callee', true);
        this.dispatch(target.callee);
        close_entity(true);

        open_entity('index', true);
        this.dispatch(target.index);
        close_entity(true);

        close_entity(true);
    }
    protected visitFieldExpr(target: FieldExpr): void {
        open_entity(target.className(), true);

        open_entity('callee', true);
        this.dispatch(target.callee);
        close_entity(true);

        open_entity('name', true);
        this.dispatch(target.name);
        close_entity(true);

        close_entity(true);
    }
    protected visitNewExpr(target: NewExpr): void {
        open_entity(target.className(), true);

        open_entity('type', true);
        this.dispatch(target.type);
        close_entity(true);

        close_entity(true);
    }
    protected visitModifier(target: Modifier): void {
        open_entity(target.className(), true);

        open_entity('values', true);
        for (let item of target.values)
            empty_entity(item.name);
        close_entity(true);

        close_entity(true);
    }
    protected visitReturnStmt(target: ReturnStmt): void {
        open_entity(target.className(), true);

        open_entity('expr', true);
        this.dispatch(target.expr);
        close_entity(true);

        close_entity(true);
    }
    protected visitNamespaceStmt(target: NamespaceStmt): void {
        open_entity(target.className(), true);

        open_entity('name', true);
        this.dispatch(target.name);
        close_entity(true);

        open_entity('stmts', true);
        for (let item of target.stmts)
            this.dispatch(item);
        close_entity(true);

        close_entity(true);
    }
    protected visitTypeRef(target: TypeRef): void {
        let content : Field[] = [
            {name:'name', value:target.qualified},
        ];
        if (target.dims > 0)
            content.push({name:'dims', value:target.dims.toString()});
        if (target.isPrimitive())
            content.push({name:'isPrimitive', value:'true'});
        empty_entity(target.className(), content);
    }
    protected visitCaseStmt(target: CaseStmt): void {
        open_entity(target.className(), true);

        open_entity('expr', true);
        this.dispatch(target.expr);
        close_entity(true);

        open_entity('stmts', true);
        for (let item of target.stmts)
            this.dispatch(item);
        close_entity(true);

        close_entity(true);
    }
    protected visitSwitchStmt(target: SwitchStmt): void {
        open_entity(target.className(), true);

        open_entity('expr', true);
        this.dispatch(target.expr);
        close_entity(true);

        open_entity('cases', true);
        for (let item of target.cases)
            this.dispatch(item);
        close_entity(true);

        close_entity(true);
    }
    protected visitIfStmt(target: IfStmt): void {
        open_entity(target.className(), true);

        open_entity('condition', true);
        this.dispatch(target.condition);
        close_entity(true);

        open_entity('thenSize', true);
        this.dispatch(target.thenSide);
        close_entity(true);

        open_entity('elseSide', true);
        this.dispatch(target.elseSide);
        close_entity(true);

        close_entity(true);
    }
    protected visitTernaryExpr(target: TernaryExpr): void {
        open_entity(target.className(), true);

        open_entity('condition', true);
        this.dispatch(target.condition);
        close_entity(true);

        open_entity('thenSize', true);
        this.dispatch(target.thenSide);
        close_entity(true);

        open_entity('elseSide', true);
        this.dispatch(target.elseSide);
        close_entity(true);

        close_entity(true);
    }
    protected visitForOfStmt(target: ForOfStmt): void {
        open_entity(target.className(), true);

        open_entity('variable', true);
        this.dispatch(target.variable);
        close_entity(true);

        open_entity('expr', true);
        this.dispatch(target.expr);
        close_entity(true);

        open_entity('stmt', true);
        this.dispatch(target.stmt);
        close_entity(true);

        close_entity(true);
    }
    protected visitForStmt(target: ForStmt): void {
        open_entity(target.className(), true);

        open_entity('init', true);
        this.dispatch(target.init);
        close_entity(true);

        open_entity('condition', true);
        this.dispatch(target.condition);
        close_entity(true);

        open_entity('fexpr', true);
        this.dispatch(target.fexpr);
        close_entity(true);

        open_entity('stmt', true);
        this.dispatch(target.stmt);
        close_entity(true);

        close_entity(true);
    }
    protected visitDoWhileStmt(target: DoWhileStmt): void {
        open_entity(target.className(), true);

        open_entity('stmt', true);
        this.dispatch(target.stmt);
        close_entity(true);

        open_entity('condition', true);
        this.dispatch(target.condition);
        close_entity(true);

        close_entity(true);
    }
    protected visitWhileStmt(target: WhileStmt): void {
        open_entity(target.className(), true);

        open_entity('condition', true);
        this.dispatch(target.condition);
        close_entity(true);

        open_entity('stmt', true);
        this.dispatch(target.stmt);
        close_entity(true);

        close_entity(true);
    }
    protected visitParameter(target: Parameter): void {
        let content : Field[] = [
            { name:'varargs', value:target.vararg?'true':'false' }
        ];
        open_entity(target.className(), true, content);

        open_entity('name', true);
        this.dispatch(target.name);
        close_entity(true);

        open_entity('type', true);
        this.dispatch(target.type);
        close_entity(true);

        if (target.init)
        {
            open_entity('init', true);
            this.dispatch(target.init);
            close_entity(true);
        }

        close_entity(true);
    }
    protected visitExpandExpr(target: ExpandExpr): void {
        open_entity(target.className(), true);

        open_entity('name', true);
        this.dispatch(target.name);
        close_entity(true);

        close_entity(true);
    }
    protected visitClassStmt(target: ClassStmt): void {
        open_entity(target.className(), true);

        open_entity('name', true);
        this.dispatch(target.name);
        close_entity(true);

        if (target.extended)
        {
            open_entity('extended', true);
            this.dispatch(target.extended);
            close_entity(true);
        }

        if (target.implemented && target.implemented.length > 0)
        {
            open_entity('implemented', true);
            for (let item of target.implemented)
            this.dispatch(item);
            close_entity(true);
        }

        if (target.stmts && target.stmts.length > 0)
        {
            open_entity('stmts', true);
            for (let item of target.stmts)
            this.dispatch(item);
            close_entity(true);
        }

        close_entity(true);
    }
    protected visitExprStmt(target: ExprStmt): void {
        open_entity(target.className(), true);

        open_entity('expr', true);
        this.dispatch(target.expr);
        close_entity(true);

        close_entity(true);
    }
    protected visitBreakStmt(target: BreakStmt): void {
        empty_entity(target.className());
    }
    protected visitContinueStmt(target: ContinueStmt): void {
        empty_entity(target.className());
    }
    protected visitImportStmt(target: ImportStmt): void {
        let content : Field[] = [
            { name:'source', value:target.source }
        ];
        open_entity(target.className(), true, content);

        open_entity('names', true);
        for (let item of target.names)
            this.dispatch(item);
        close_entity(true);

        close_entity(true);
    }
    protected visitVariableStmt(target: VariableStmt): void {
        open_entity(target.className(), true);

        open_entity('name', true);
        this.dispatch(target.name);
        close_entity(true);

        if (target.type)
        {
            open_entity('type', true);
            this.dispatch(target.type);
            close_entity(true);
        }

        if (target.init)
        {
            open_entity('init', true);
            this.dispatch(target.init);
            close_entity(true);
        }

        close_entity(true);
    }
    protected visitPropertyStmt(target: PropertyStmt): void {
        open_entity(target.className(), true);

        if (target.modifier?.values.length > 0)
        {
            open_entity('modifier', true);
            this.dispatch(target.modifier);
            close_entity(true);
        }

        open_entity('name', true);
        this.dispatch(target.name);
        close_entity(true);

        if (target.type)
        {
            open_entity('type', true);
            this.dispatch(target.type);
            close_entity(true);
        }

        if (target.init)
        {
            open_entity('init', true);
            this.dispatch(target.init);
            close_entity(true);
        }

        close_entity(true);
    }
    protected visitTryCatchStmt(target: TryCatchStmt): void {
        open_entity(target.className(), true);

        open_entity('try', true);
        this.dispatch(target.block);
        close_entity(true);

        if (target.cblock)
        {
            open_entity('catch', true);
            this.dispatch(target.cblock);
            close_entity(true);
        }

        if (target.fblock)
        {
            open_entity('finally', true);
            this.dispatch(target.fblock);
            close_entity(true);
        }

        close_entity(true);
    }
    protected visitThrowStmt(target: ThrowStmt): void {
        open_entity(target.className(), true);
        this.dispatch(target.expr);
        close_entity(true);
    }

    protected visitEnumStmt(target: EnumStmt): void {
        open_entity(target.className(), true);

        open_entity('name', true);
        this.dispatch(target.name);
        close_entity(true);

        open_entity('values', true);
        for (let item of target.values)
            this.dispatch(item);
        close_entity(true);

        close_entity(true);
    }

    visitBlockStmt(target: BlockStmt): void {
        open_entity(target.className(), target.stmts.length > 0);
        for (let stmt of target.stmts)
            this.dispatch(stmt);
        close_entity(target.stmts.length > 0);
    }

    visitFunctionStmt(target: FunctionStmt): void {
        let content : Field[] = [];
        if (target.accessor)
            content.push({ name:'accessor', value:target.accessor.name});
        open_entity(target.className(), true, content);

        if (target.modifier?.values.length > 0)
        {
            open_entity('modifier', true);
            this.dispatch(target.modifier);
            close_entity(true);
        }

        open_entity('name', true);
        this.dispatch(target.name);
        close_entity(true);

        open_entity('type', true);
        this.dispatch(target.type);
        close_entity(true);

        if (target.params.length > 0)
        {
            open_entity('params', true);
            for (let item of target.params)
                this.dispatch(item);
            close_entity(true);
        }

        if (target.body)
        {
            open_entity('body', true);
            this.dispatch(target.body);
            close_entity(true);
        }

        close_entity(true);
    }

    visitUnit(target: Unit): void {
        open_entity('Unit', target.stmts.length > 0,
            [{name:'fileName', value: basename(target.fileName), tooltip: target.fileName}]);
        for (let stmt of target.stmts)
            this.dispatch(stmt);
        close_entity(target.stmts.length > 0);
    }
    renderUnit( target : Unit ) : void
    {
        print(`<html><head><style>${CSS}</style><title></title></head>
        <script>${SCRIPT}</script><body><ul class="ast">`);
        this.visitUnit(target);
        print('</ul></body></html>');
    }

    renderModule( targets : Unit[] ) : void
    {
        print(`<html><head><style>${CSS}</style><title></title></head>
        <script>${SCRIPT}</script><body><ul class="ast">`);
        open_entity('Module', true);
        for (let item of targets)
            this.visitUnit(item);
        close_entity(true);
        print('</ul></body></html>');
    }
}