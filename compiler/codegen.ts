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
    DispatcherVoid,
    TypeCastExpr,
    PropertyStmt} from './types';
import { StringBuffer } from "./utils";
import { TokenType } from "./tokenizer";

export class PortableGenerator extends DispatcherVoid
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
        this.write('(' + this.nativeType(target.type) + ') ');
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
        for (let stmt of target.stmts) this.dispatch(stmt);
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
        let first = true;

        this.write(`\nstatic ${this.nativeType(target.type)} func_${this.nativeName(target.name)}(`);
        if (!target.isStatic)
        {
            let type = new TypeRef(target.name.parent, null, 0, true);
            this.write(`${this.nativeType(type)} self_`);
            first = false;
        }
        for (let param of target.params)
        {
            if (!first) this.write(', ');
            first = false;
            this.write(`${this.nativeType(param.type) } ${this.nativeName(param.name)}`);
        }
        this.writeln(')');
        if (target.isAbstract)
        {
            this.writeln(`{\n\tself_->vtable_->${target.name.canonical}(self_);\n}`);
        }
        else
            this.dispatch(target.body);
    }

    protected nativeName( name : Name ) : string
    {
        return name.qualified.replace(/\./g, '_');
    }

    protected nativeFunctionName( stmt : FunctionStmt )
    {
        return `func_${this.nativeName(stmt.name)}`;
    }

    protected nativeNameAndGenerics( name : Name ) : string
    {
        return name.qualified.replace(/\./g, '_');
    }

    protected nativeType( type : TypeRef ) : string
    {
        if (!type) return 'void';

        let name = type.name.canonical;
        switch (name)
        {
            case 'number': return 'double';
            case 'string': return 'struct dyn_string*';
            case 'boolean': return 'uint8_t';
            case 'void': return 'void';
            default:
                return `struct dyn_${this.nativeName(type.name)}*`;
        }
    }

    protected nativeDefault( type : TypeRef ) : string
    {
        if (!type) return 'NULL';

        let name = type.name.canonical;
        switch (name)
        {
            case 'number': return '0';
            case 'string': return '""';
            case 'boolean': return '0';
            default:
                return 'NULL';
        }
    }

    protected staticStorageName( target : ClassStmt ) : string
    {
        return `sta_${this.nativeName(target.name)}`;
    }

    protected generateStatic( target: ClassStmt, complete : boolean = false )
    {
        if (complete)
        {
            this.writeln(`struct vtbl_${this.nativeName(target.name)};`);
            this.writeln(`struct sta_${this.nativeName(target.name)} {`);
            this.buffer.indent();
            this.writeln(`const struct vtbl_${this.nativeName(target.name)}* vtable_;`);
        }
        // parent class
        if (target.extended && target.extended.ref)
            this.generateStatic(target.extended.ref);
        // fields
        this.comment(`${target.name.qualified} fields`, true);
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof PropertyStmt)) continue;
            if (stmt.isStatic)
                this.dispatch(stmt);
        }
        if (complete)
        {
            this.buffer.dedent();
            this.writeln(`};\n`);
            this.writeln(`static struct sta_${this.nativeName(target.name)} ${this.staticStorageName(target)};\n`);
        }
    }

    protected generateDynamic( target: ClassStmt, complete : boolean = false )
    {
        if (complete)
        {
            this.writeln(`struct vtbl_${this.nativeName(target.name)};`);
            this.writeln(`struct dyn_${this.nativeName(target.name)} {`);
            this.buffer.indent();
            this.writeln(`const struct vtbl_${this.nativeName(target.name)}* vtable_;`);
        }
        // parent class
        if (target.extended && target.extended.ref)
            this.generateDynamic(target.extended.ref);
        // fields
        this.comment(`${target.name.qualified} fields`, true);
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof PropertyStmt)) continue;
            if (!stmt.accessor || stmt.accessor.values.indexOf(TokenType.STATIC) < 0)
                this.dispatch(stmt);
        }
        if (complete)
        {
            this.buffer.dedent();
            this.writeln(`};\n`);
        }
    }

    protected generateStaticInit(target: ClassStmt): void
    {
        let name = this.staticStorageName(target);
        this.writeln(`static void ${this.nativeName(target.name)}_sta_ctor()\n{`);
        this.buffer.indent();
        this.writeln(`${this.staticStorageName(target)}.vtable_ = &vtbl_${this.nativeName(target.name)};`);
        // static fields
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof PropertyStmt)) continue;
            if (!stmt.isStatic) continue;
            this.writeln(`${name}.${stmt.name.canonical} = ${this.nativeDefault(stmt.type)};`);
        }
        this.buffer.dedent();
        this.writeln('}');
    }

    protected methodTypeDef( parent : ClassStmt, target : FunctionStmt )
    {
        this.write(`typedef ${this.nativeType(target.type)} (${this.nativeFunctionName(target)}_t)(`);
        let first = true;
        if (!target.isStatic)
        {
            this.write(`struct dyn_${this.nativeName(parent.name)}*`);
            first = false;
        }
        for (let stmt of target.params)
        {
            if (!first) this.write(', ')
            this.write(`${this.nativeType(stmt.type)}`)
            first = false;
        }
        this.writeln(');');
    }

    protected methodPrototype( parent : ClassStmt, target : FunctionStmt )
    {
        this.write(`static ${this.nativeType(target.type)} ${this.nativeFunctionName(target)}(`);
        let first = true;
        if (!target.isStatic)
        {
            this.write(`struct dyn_${this.nativeName(parent.name)}*`);
            first = false;
        }
        for (let stmt of target.params)
        {
            if (!first) this.write(', ')
            this.write(`${this.nativeType(stmt.type)}`)
            first = false;
        }
        this.writeln(');');
    }

    protected getClassHierarchy( target : ClassStmt )
    {
        // collect all methods from the class hierarchy
        let output = []
        let current = target;
        while (current != null)
        {
            output.push(current);
            current = current.extended?.ref;
        }
        output.reverse();
        return output;
    }

    protected getMethodHierarchy( target : ClassStmt )
    {
        // collect all methods from the class hierarchy
        let methods : FunctionStmt[] = [];
        let names : string[] = [];
        for (let clazz of this.getClassHierarchy(target))
        {
            for (let stmt of clazz.stmts)
            {
                if (!(stmt instanceof FunctionStmt)) continue;
                let idx = names.indexOf(stmt.name.canonical);
                if (idx < 0)
                {
                    methods.push(stmt);
                    names.push(stmt.name.canonical);
                }
                else
                    methods[idx] = stmt;
            }
        }
        return methods;
    }

    protected generateVTableType( target : ClassStmt, methods : FunctionStmt[] )
    {
        // method type definition
        for (let stmt of methods)
        {
            if (stmt.parent != target) continue;
            this.methodTypeDef(target, stmt);
        }

        this.writeln(`\nstruct vtbl_${this.nativeName(target.name)} {`);
        for (let stmt of methods)
        {
            if (!(stmt instanceof FunctionStmt)) continue;
            this.writeln(`\t${this.nativeFunctionName(stmt)}_t* ${stmt.name.canonical};`);
        }
        this.writeln('};\n');
    }

    protected generateVTableStorage( target : ClassStmt, methods : FunctionStmt[] )
    {
        // method prototype
        for (let stmt of methods)
        {
            if (stmt.parent != target) continue;
            this.methodPrototype(target, stmt);
        }

        this.writeln(`\nstatic const struct vtbl_${this.nativeName(target.name)} vtbl_${this.nativeName(target.name)} = {`);
        for (let stmt of methods)
        {
            if (!(stmt instanceof FunctionStmt)) continue;
            this.writeln(`\t${this.nativeFunctionName(stmt)},`);
        }
        this.writeln('};');
    }

    protected visitClassStmt(target: ClassStmt): void
    {
        this.comment(`class ${target.name.qualified}`, true);

        // static structure and storage
        this.generateStatic(target, true);
        // dynamic structure
        this.generateDynamic(target, true);
        // vtable structure
        let methods = this.getMethodHierarchy(target);
        this.generateVTableType(target, methods);
        // vtable storage
        this.generateVTableStorage(target, methods);
        // static initializer
        this.generateStaticInit(target);
        // methods
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof FunctionStmt)) continue;
            this.visitFunctionStmt(stmt);
        }
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
        this.dispatch(target);
        return this.buffer.toString();
    }

}