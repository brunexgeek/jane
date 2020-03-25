/// <reference path="tokenizer.ts" />
/// <reference path="types.ts" />

namespace beagle.compiler {

function print( value : string )
{
    process.stdout.write(value);
}

export class SvgPrinter implements IVisitor
{
    private parent : number = 0;
    private id : number = 0;
    private label : string = '';
    static readonly FUNC_COLOR = '#00F0F2';
    static readonly STMT_COLOR = '#A0A0A0';

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

        this.label = '';
        this.parent = id;
    }

    visitName(target: Name): void {
        this.parent = this.connection(this.parent, target.className(), target.lexeme, this.label);
    }

    visitStringLiteral(target: StringLiteral): void {
        let content = this.field('template', target.template.toString());
        content += this.field('value', target.value);
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

        this.label = 'expr';
        this.parent = id;
        target.expr.accept(this);

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

        this.label = 'else';
        this.parent = id;
        target.elseSide.accept(this);

        this.label = '<next>';
        this.parent = id;
    }

    visitForOfStmt(target: ForOfStmt): void {
        let id = this.connection(this.parent, target.className(), '', this.label, SvgPrinter.STMT_COLOR);

        this.label = 'variable';
        this.parent = id;
        target.variable.accept(this);

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
        let content = `<b>name:</b>   ${target.name.lexeme}`
        if (target.type)
            content += `<br/><b>type:</b>   ${target.type.names[0].lexeme}`
        let id = this.connection(this.parent, target.className(), content, this.label);

        if (target.init)
        {
            this.label = 'init';
            this.parent = id;
            target.init.accept(this);
        }
    }

    visitFunctionStmt(target: FunctionStmt): void {
        let label = `<b>name:</b>   ${target.name.lexeme}`
        label += `<br/><b>type:</b>   ${this.typeRef(target.type)}`
        let id = this.connection(this.parent, target.className(), label, '', SvgPrinter.FUNC_COLOR);
        this.parent = id;

        if (target.params)
        {
            let i = 0;
            for (let item of target.params)
            {
                this.label = `params[${i++}]`;
                item.accept(this);
            }
        }

        this.label = 'body';
        this.parent = id;
        target.body.accept(this);
    }

    visitExprStmt(target: ExprStmt): void {
        let id = this.connection(this.parent, target.className(), '', this.label, SvgPrinter.STMT_COLOR);

        this.parent = id;
        this.label = 'expr';
        target.expr.accept(this);

        this.label = '<next>';
        this.parent = id;
    }

    typeRef( target : TypeRef ) : string
    {
        if (!target) return '&lt;null&gt;';

        let value = '';
        let first = true;
        for (let i of target.names)
        {
            if (!first) value += '.';
            value += i.lexeme;
        }
        return value;
    }

    visitVariableStmt(target: VariableStmt): void {
        let content = this.field('name', target.name.lexeme);
        content += this.field('content', target.constant.toString());
        content += this.field('ronly', target.ronly.toString());
        content += this.field('type', this.typeRef(target.type), true);

        let id = this.connection(this.parent, target.className(), content, this.label, SvgPrinter.STMT_COLOR);

        this.label = 'init';
        this.parent = id;
        target.init.accept(this);

        this.label = '<next>';
        this.parent = id;
    }

    visitUnit(target: Unit): void {
        print(`digraph AST {
        node [shape=record style=filled fontsize=10];
        edge [fontsize=10];
        splines=polyline;

        0 [label=<{<b>Unit</b>}>];\n`);

        let id = this.id;
        for (let stmt of target.stmts)
        {
            this.parent = id;
            this.label = '';
            stmt.accept(this);
        }

        print('}\n');
    }

    field( name : string, value : string, last : boolean = false ) : string
    {
        return `<b>${name}:</b>   ${value}` + ((last) ? '' : '<br/>');
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

}