import { CompilationContext } from "./compiler";
import {
    IStmt,
    IExpr,
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
    ForStmt,
    Dispatcher,
    TypeCastExpr,
    PropertyStmt} from './types';
import { StringBuffer } from "./utils";
import { TokenType } from "./tokenizer";

export class PortableGenerator extends Dispatcher<void>
{
    ctx : CompilationContext;
    buffer : StringBuffer = new StringBuffer();

    constructor( ctx : CompilationContext )
    {
        super();
        this.ctx = ctx;
    }

    protected visitPropertyStmt(target: PropertyStmt): void
    {
        this.writeln(`${this.nativeType(target.type)} ${target.name.canonical};`);
    }

    protected visitName(target: Name): void
    {
    }

    protected visitStringLiteral(target: StringLiteral): void
    {
        this.write(`"${target.value}"`);
    }

    protected visitNumberLiteral(target: NumberLiteral): void
    {
        this.write(target.value);
    }

    protected visitBoolLiteral(target: BoolLiteral): void
    {
        if (target.converted)
            this.write('BGL_TRUE');
        else
            this.write('BGL_FALSE');
    }

    protected visitNameLiteral(target: NameLiteral): void
    {
        if (target.value == 'this')
            this.write('thisptr__');
        else
            this.write(target.value);
    }
    protected visitGroup(target: Group): void
    {
        this.write('(');
        this.dispatch(target.expr);
        this.write(')');
    }

    protected visitNullLiteral(target: NullLiteral): void
    {
        this.write('NULL');
    }

    protected visitLogicalExpr(target: LogicalExpr): void
    {
        this.dispatch(target.left);
        this.write(target.oper.lexeme);
        this.dispatch(target.right);
    }

    protected visitBinaryExpr(target: BinaryExpr): void
    {
        this.dispatch(target.left);
        this.write(target.oper.lexeme);
        this.dispatch(target.right);
    }

    protected visitAssignExpr(target: AssignExpr): void
    {
        this.dispatch(target.left);
        this.write(target.oper.lexeme);
        this.dispatch(target.right);
    }

    protected visitUnaryExpr(target: UnaryExpr): void
    {
        if (!target.post)
        {
            this.write(target.oper.lexeme);
            this.dispatch(target.expr);
        }
        else
        {
            this.dispatch(target.expr);
            this.write(target.oper.lexeme);
        }
    }

    protected visitTypeCastExpr(target: TypeCastExpr): void
    {
        this.write(`${this.nativeType(target.type)} `);
        this.dispatch(target.expr);
    }

    protected visitCallExpr(target: CallExpr): void
    {
        this.dispatch(target.callee);
        this.write('(');
        let first = true;
        for (let arg of target.args)
        {
            if (!first) this.write(', ');
            first = false;
            this.dispatch(arg);
        }
        this.write(')');

    }

    protected visitArrayExpr(target: ArrayExpr): void
    {
        this.write('[');
        let first = true;
        for (let arg of target.values)
        {
            if (!first) this.write(', ');
            first = false;
            this.dispatch(arg);
        }
        this.write(']');
    }

    protected visitArrayAccessExpr(target: ArrayAccessExpr): void
    {
        this.dispatch(target.callee);
        this.write('[');
        this.dispatch(target.index);
        this.write(']');
    }

    protected visitFieldExpr(target: FieldExpr): void
    {
        this.dispatch(target.callee);
        this.write(`->${target.name}`)
    }

    protected visitNewExpr(target: NewExpr): void
    {
        this.write(`new ${this.nativeType(target.type)}`)
    }

    protected visitAccessor(target: Accessor): void
    {
    }

    protected visitBlockStmt(target: BlockStmt): void
    {
        this.writeln('{');
        this.buffer.indent();
        for (let stmt of target.stmts) this.dispatch(stmt);
        this.buffer.dedent();
        this.writeln('}');
    }

    protected visitReturnStmt(target: ReturnStmt): void
    {
        this.write('return ');
        this.dispatch(target.expr);
        this.writeln(';');
    }
    protected visitNamespaceStmt(target: NamespaceStmt): void
    {
        this.comment(`BEGIN namespace '${target.name}'`);
        for (let stmt of target.stmts) this.dispatch(stmt);
        this.comment(`END namespace '${target.name}'`);
    }

    protected visitTypeRef(target: TypeRef): void
    {

    }

    protected visitCaseStmt(target: CaseStmt): void
    {

    }

    protected visitSwitchStmt(target: SwitchStmt): void
    {

    }

    protected visitIfStmt(target: IfStmt): void
    {
        this.write('if (');
        this.dispatch(target.condition);
        this.write(')');
        this.dispatch(target.thenSide);
        if (target.elseSide)
        {
            this.writeln('else');
            this.dispatch(target.elseSide);
        }
    }

    protected visitForOfStmt(target: ForOfStmt): void
    {
        this.write('for (');
        this.dispatch(target.variable);
        this.write(' of ');
        this.dispatch(target.expr);
        this.write(')');
        this.dispatch(target.stmt);
    }

    protected visitForStmt(target: ForStmt): void
    {
        this.write('for (');
        this.dispatch(target.init);
        this.write('; ');
        this.dispatch(target.condition);
        this.write('; ');
        this.dispatch(target.fexpr);
        this.write(')');
        this.dispatch(target.stmt);
    }

    protected visitDoWhileStmt(target: DoWhileStmt): void
    {
        this.writeln('do ');
        this.dispatch(target.stmt);
        this.write('while (');
        this.dispatch(target.condition);
        this.writeln(';');
    }

    protected visitWhileStmt(target: WhileStmt): void
    {
        this.write('while (');
        this.dispatch(target.condition);
        this.write(')');
        this.dispatch(target.stmt);
    }

    protected visitParameter(target: Parameter): void { }

    protected visitExpandExpr(target: ExpandExpr): void { }

    protected visitFunctionStmt(target: FunctionStmt): void
    {
        if (!target.body) return;
        let first = true;

        this.write(`${this.nativeType(target.type)} ${this.nativeName(target.name)}(`);
        if (!target.accessor || !target.accessor.isStatic())
        {
            let type = new TypeRef(target.name.parent, null, 0, true);
            this.write(` ${this.nativeType(type)} thisptr__`);
            first = false;
        }
        for (let param of target.params)
        {
            if (!first) this.write(',\n');
            first = false;
            this.write(`${this.nativeType(param.type) } ${this.nativeName(param.name)}`);
        }
        this.writeln(')');
        this.dispatch(target.body);
    }

    nativeName( name : Name ) : string
    {
        return name.qualified.replace(/\./g, '_');
    }

    nativeNameAndGenerics( name : Name ) : string
    {
        return name.qualified.replace(/\./g, '_');
    }

    nativeType( type : TypeRef ) : string
    {
        if (!type) return 'void';

        let name = type.name.canonical;
        switch (name)
        {
            case 'number': return 'beagle_float64';
            case 'string': return 'struct dynamic_string_*';
            case 'boolean': return 'beagle_bool';
            case 'void': return 'void';
            default:
                return `struct dynamic_${this.nativeName(type.name)}_*`;
        }
    }

    protected visitClassStmt(target: ClassStmt): void
    {
        this.comment(`BEGIN class ${target.name.qualified}`, true);

        // static storage
        this.writeln(`struct static_${this.nativeName(target.name.name)}_ {`);
        this.buffer.indent();
        this.writeln('void *base__;\nstruct typeinfo_ typeInfo__;');
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof PropertyStmt)) continue;
            if (stmt.accessor && stmt.accessor.values.indexOf(TokenType.STATIC) >= 0)
                this.dispatch(stmt);
        }
        this.buffer.dedent();
        this.writeln(`};\n`);

        // dynamic storage
        this.writeln(`struct dynamic_${this.nativeName(target.name.name)}_ {`);
        this.buffer.indent();
        this.writeln(`struct static_${this.nativeName(target.name.name)}_ *type__;\nuint32_t flags;`);
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof PropertyStmt)) continue;
            if (!stmt.accessor || stmt.accessor.values.indexOf(TokenType.STATIC) < 0)
                this.dispatch(stmt);
        }
        this.buffer.dedent();
        this.writeln(`};\n`);

        // methods
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof FunctionStmt)) continue;
            this.dispatch(stmt);
        }

        this.comment(`END class ${target.name.qualified}`, true);
    }

    protected visitExprStmt(target: ExprStmt): void
    {
        this.dispatch(target.expr);
        this.writeln(';');
    }

    protected visitBreakStmt(target: BreakStmt): void {

    }
    protected visitContinueStmt(target: ContinueStmt): void {

    }
    protected visitImportStmt(target: ImportStmt): void
    {

    }

    protected visitVariableStmt(target: VariableStmt): void
    {
        if (!target.accessor || (target.accessor && target.accessor.values.indexOf(TokenType.EXPORT) < 0))
            this.write('static ');
        this.writeln(`${this.nativeType(target.type)} ${target.name.canonical};`);
    }

    protected visitTryCatchStmt(target: TryCatchStmt): void {

    }
    protected visitThrowStmt(target: ThrowStmt): void {

    }
    protected visitUnit(target: Unit): void
    {
        this.comment(`begin of unit '${target.fileName}'`, true);
        for (let stmt of target.stmts) this.dispatch(stmt);
        this.comment(`end of unit '${target.fileName}'`, true);
    }

    writeln( value : string )
    {
        this.buffer.writeln(value);
    }

    write( value : string )
    {
        this.buffer.write(value);
    }

    comment( value : string, lbreak : boolean = false )
    {
        this.buffer.write(`/* ${value} */`, lbreak);
    }

    generate( target : Unit ) : string
    {
        this.writeln('#include <base.h>');
        this.dispatch(target);
        return this.buffer.toString();
    }

}