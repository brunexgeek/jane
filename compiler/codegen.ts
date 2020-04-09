import { CompilationContext } from "./compiler";
import { Unit, NamespaceStmt, Dispatcher, Name, StringLiteral, NumberLiteral, BoolLiteral, NameLiteral, Group, NullLiteral, LogicalExpr, BinaryExpr, AssignExpr, UnaryExpr, TypeCastExpr, CallExpr, ArrayExpr, ArrayAccessExpr, FieldExpr, NewExpr, Accessor, BlockStmt, ReturnStmt, NameAndGenerics, TypeRef, CaseStmt, SwitchStmt, IfStmt, ForOfStmt, ForStmt, DoWhileStmt, WhileStmt, Parameter, ExpandExpr, FunctionStmt, ClassStmt, ExprStmt, BreakStmt, ContinueStmt, ImportStmt, VariableStmt, TryCatchStmt, ThrowStmt, PropertyStmt } from "./types";
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

    protected visitName(target: Name): void {
        throw new Error("Method not implemented.");
    }
    protected visitStringLiteral(target: StringLiteral): void {
        throw new Error("Method not implemented.");
    }
    protected visitNumberLiteral(target: NumberLiteral): void {
        throw new Error("Method not implemented.");
    }
    protected visitBoolLiteral(target: BoolLiteral): void {
        throw new Error("Method not implemented.");
    }
    protected visitNameLiteral(target: NameLiteral): void {
        throw new Error("Method not implemented.");
    }
    protected visitGroup(target: Group): void {
        throw new Error("Method not implemented.");
    }
    protected visitNullLiteral(target: NullLiteral): void {
        throw new Error("Method not implemented.");
    }
    protected visitLogicalExpr(target: LogicalExpr): void {
        throw new Error("Method not implemented.");
    }
    protected visitBinaryExpr(target: BinaryExpr): void {
        throw new Error("Method not implemented.");
    }
    protected visitAssignExpr(target: AssignExpr): void {
        throw new Error("Method not implemented.");
    }
    protected visitUnaryExpr(target: UnaryExpr): void {
        throw new Error("Method not implemented.");
    }
    protected visitTypeCastExpr(target: TypeCastExpr): void {
        throw new Error("Method not implemented.");
    }
    protected visitCallExpr(target: CallExpr): void {
        throw new Error("Method not implemented.");
    }
    protected visitArrayExpr(target: ArrayExpr): void {
        throw new Error("Method not implemented.");
    }
    protected visitArrayAccessExpr(target: ArrayAccessExpr): void {
        throw new Error("Method not implemented.");
    }
    protected visitFieldExpr(target: FieldExpr): void {
        throw new Error("Method not implemented.");
    }
    protected visitNewExpr(target: NewExpr): void {
        throw new Error("Method not implemented.");
    }
    protected visitAccessor(target: Accessor): void {
        throw new Error("Method not implemented.");
    }
    protected visitBlockStmt(target: BlockStmt): void {
        this.writeln('{}');
    }
    protected visitReturnStmt(target: ReturnStmt): void {
        throw new Error("Method not implemented.");
    }
    protected visitNamespaceStmt(target: NamespaceStmt): void
    {
        this.comment(`begin of namespace '${target.name}'`);
        for (let stmt of target.stmts) this.dispatch(stmt);
        this.comment(`end of namespace '${target.name}'`);
    }
    protected visitNameAndGenerics(target: NameAndGenerics): void {
        throw new Error("Method not implemented.");
    }
    protected visitTypeRef(target: TypeRef): void {
        throw new Error("Method not implemented.");
    }
    protected visitCaseStmt(target: CaseStmt): void {
        throw new Error("Method not implemented.");
    }
    protected visitSwitchStmt(target: SwitchStmt): void {
        throw new Error("Method not implemented.");
    }
    protected visitIfStmt(target: IfStmt): void {
        throw new Error("Method not implemented.");
    }
    protected visitForOfStmt(target: ForOfStmt): void {
        throw new Error("Method not implemented.");
    }
    protected visitForStmt(target: ForStmt): void {
        throw new Error("Method not implemented.");
    }
    protected visitDoWhileStmt(target: DoWhileStmt): void {
        throw new Error("Method not implemented.");
    }
    protected visitWhileStmt(target: WhileStmt): void {
        throw new Error("Method not implemented.");
    }
    protected visitParameter(target: Parameter): void {
        throw new Error("Method not implemented.");
    }
    protected visitExpandExpr(target: ExpandExpr): void {
        throw new Error("Method not implemented.");
    }

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
            case 'string': return 'struct dynamic_string_';
            case 'boolean': return 'beagle_bool';
            case 'void': return 'void';
            default:
                return `struct dynamic_${this.nativeName(type.name)}_*`;
        }
    }

    protected visitClassStmt(target: ClassStmt): void
    {
        // static storage
        this.comment(`${target.name.qualified} static storage`, true);
        this.writeln(`struct static_${this.nativeName(target.name.name)}_ {
            void *base__;
            struct typeinfo_ typeInfo__;`);
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof PropertyStmt)) continue;
            if (stmt.accessor && stmt.accessor.values.indexOf(TokenType.STATIC) >= 0)
                this.dispatch(stmt);
        }
        this.writeln(`};\n`);

        // dynamic storage
        this.comment(`${target.name.qualified} dynamic storage`, true);
        this.writeln(`struct dynamic_${this.nativeName(target.name.name)}_ {
            struct static_${this.nativeName(target.name.name)}_ *type__;
            uint32_t flags;`);
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof PropertyStmt)) continue;
            if (!stmt.accessor || stmt.accessor.values.indexOf(TokenType.STATIC) < 0)
                this.dispatch(stmt);
        }
        this.writeln(`};\n`);

        // methods
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof FunctionStmt)) continue;
            this.dispatch(stmt);
        }
    }

    protected visitExprStmt(target: ExprStmt): void {
        throw new Error("Method not implemented.");
    }
    protected visitBreakStmt(target: BreakStmt): void {
        throw new Error("Method not implemented.");
    }
    protected visitContinueStmt(target: ContinueStmt): void {
        throw new Error("Method not implemented.");
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
        throw new Error("Method not implemented.");
    }
    protected visitThrowStmt(target: ThrowStmt): void {
        throw new Error("Method not implemented.");
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