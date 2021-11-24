
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
	ChainingExpr,
	NewExpr,
	Modifier,
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
    PropertyStmt,
    TypeId,
    TemplateStringExpr,
    EnumStmt,
    TernaryExpr,
    EnumDecl,
    VariableDecl,
    OptChainingExpr} from './types';
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

    protected visitTemplateStringExpr(target: TemplateStringExpr): void
    {

    }

    protected visitNumberLiteral(target: NumberLiteral): void
    {
        this.write(target.value);
    }

    protected visitBoolLiteral(target: BoolLiteral): void
    {
        if (target.converted)
            this.write('1');
        else
            this.write('0');
    }

    protected visitNameLiteral(target: NameLiteral): void
    {
        if (target.value == 'this')
            this.write('self_');
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

    protected visitChainingExpr(target: ChainingExpr): void
    {
        this.dispatch(target.callee);
        this.write(`->${target.name}`)
    }

    protected visitOptChainingExpr(target: OptChainingExpr): void
    {
        this.dispatch(target.callee);
        this.write(`->${target.name}`)
    }

    protected visitNewExpr(target: NewExpr): void
    {
        this.write(`new ${this.nativeType(target.type)}`)
    }

    protected visitModifier(target: Modifier): void
    {
    }

    protected generateFunctionBody(target: FunctionStmt): void
    {
        this.writeln('{');
        this.buffer.indent();

        // is it a method?
        if (!target.isStatic && target.parent && target.parent instanceof ClassStmt)
        {
            // output the typed self pointer
            let cast = this.nativeClassType(<ClassStmt>target.parent);
            this.writeln(`${cast} self_ = (${cast}) self__;`);
        }

        for (let stmt of target.body.stmts) this.dispatch(stmt);

        this.buffer.dedent();
        this.writeln('}');
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
            let type = new TypeRef(TypeId.OBJECT, target.name.parent, 0);
            this.write(`void *self__`);
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
            let cast = this.nativeClassType(<ClassStmt>target.parent);
            this.writeln('{');
            this.buffer.indent();
            this.writeln(`${cast} self_ = (${cast}) self__;`);
            if (target.type)
                this.write('return ');
            this.writeln(`self_->vtable_->${target.name.canonical}(self__);`);
            this.buffer.dedent();
            this.writeln('}');
        }
        else
            this.generateFunctionBody(target);
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

    protected nativeClassType( type : ClassStmt ) : string
    {
        return `struct dyn_${this.nativeName(type.name)}*`
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

    protected generateStatic( target: ClassStmt, recursive : boolean = false )
    {
        if (!recursive)
        {
            //this.writeln(`struct vtbl_${this.nativeName(target.name)};\n`);
            this.writeln(`static struct sta_${this.nativeName(target.name)} {`);
            this.buffer.indent();
            this.writeln(`const struct vtbl_${this.nativeName(target.name)}* vtable_;`);
        }

        // parent class
        if (target.extended?.ref)
            this.generateStatic(target.extended.ref, true);
        // current class
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof PropertyStmt) || !stmt.isStatic) continue;
            this.comment(`${target.name.qualified}`);
            this.dispatch(stmt);
        }

        if (!recursive)
        {
            this.buffer.dedent();
            this.writeln(`} ${this.staticStorageName(target)};\n`);
        }
    }

    protected generateDynamic( target: ClassStmt, recursive : boolean = false )
    {
        if (!recursive)
        {
            this.writeln(`struct dyn_${this.nativeName(target.name)} {`);
            this.buffer.indent();
            this.writeln(`const struct vtbl_${this.nativeName(target.name)}* vtable_;`);
        }

        // parent class
        if (target.extended?.ref)
            this.generateDynamic(target.extended.ref, true);
        // current class
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof PropertyStmt) || stmt.isStatic) continue;
            this.comment(`${target.name.qualified}`);
            this.dispatch(stmt);
        }

        if (!recursive)
        {
            this.buffer.dedent();
            this.writeln(`};\n`);
        }
    }

    protected generateInterface( target: ClassStmt, recursive : boolean = false )
    {
        this.writeln(`struct dyn_${this.nativeName(target.name)} {`);
        this.buffer.indent();
        this.writeln(`const struct vtbl_${this.nativeName(target.name)}* vtable_;`);
        this.writeln(`void* data_;`);
        this.buffer.dedent();
        this.writeln(`};\n`);
    }

    protected generateStaticInit(target: ClassStmt) : string
    {
        let name = this.staticStorageName(target);
        this.writeln(`\nstatic void sta_${this.nativeName(target.name)}_ctor()\n{`);
        this.buffer.indent();
        // vtable
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

        return `sta_${this.nativeName(target.name)}_ctor`;
    }

    protected generateDynamicInit(target: ClassStmt): void
    {
        this.writeln('');
        let parent_name = null;
        if (target.extended?.ref)
        {
            parent_name = this.nativeName(target.extended.ref.name);
            this.writeln(`static void dyn_${parent_name}_ctor(struct dyn_${parent_name}*);`);
        }

        this.writeln(`static void dyn_${this.nativeName(target.name)}_ctor(struct dyn_${this.nativeName(target.name)} *self_)\n{`);
        this.buffer.indent();
        // parent constructor
        if (target.extended?.ref)
            this.writeln(`dyn_${parent_name}_ctor((struct dyn_${parent_name}*)self_);`);
        // vtable
        this.writeln(`self_->vtable_ = &vtbl_${this.nativeName(target.name)};`);
        // dynamic fields
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof PropertyStmt)) continue;
            if (stmt.isStatic) continue;
            this.writeln(`self_->${stmt.name.canonical} = ${this.nativeDefault(stmt.type)};`);
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
            this.write(`void*`);
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
            this.write(`void*`);
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

    protected getMethods( target : ClassStmt )
    {
        let methods : FunctionStmt[] = [];
        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof FunctionStmt)) continue;
            methods.push(stmt);
        }
        return methods;
    }

    protected getMethodHierarchy( target : ClassStmt )
    {
        // FIXME: do not support method overload
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

    /**
     * Collect all interfaces from the class hierarchy
     */
    protected getInterfaceHierarchy( target : ClassStmt )
    {
        let intfs : ClassStmt[] = [];
        let names : string[] = [];
        for (let clazz of this.getClassHierarchy(target))
        {
            if (!clazz.implemented) continue;
            for (let tref of clazz.implemented)
            {
                if (!tref.ref) continue;
                let idx = names.indexOf(tref.ref.name.qualified);
                if (idx < 0)
                {
                    intfs.push(tref.ref);
                    names.push(tref.ref.name.qualified);
                }
            }
        }
        return intfs;
    }

    protected generateVTable( target : ClassStmt, methods : FunctionStmt[] )
    {
        let name = this.nativeName(target.name);

        this.writeln(`\nstatic const struct vtbl_${name} {`);
        for (let stmt of methods)
            this.writeln(`\t${this.nativeFunctionName(stmt)}_t* ${stmt.name.canonical};`);
        this.writeln(`} vtbl_${name} = {`);
        for (let stmt of methods)
            this.writeln(`\t${this.nativeFunctionName(stmt)},`);
        this.writeln('};');

        this.generateInterfaceVTableForClass(target);
    }

    /**
     * Generate a vtable for each interface of the given class.
     */
    protected generateInterfaceVTableForClass( target : ClassStmt )
    {
        let intfs = this.getInterfaceHierarchy(target);
        let name = this.nativeName(target.name);

        for (let stmt of intfs)
        {
            let methods = this.getMethodHierarchy(stmt);
            this.writeln(`\nstatic const struct vtbl_${name}_as_${stmt.name.canonical} {`);
            for (let stmt of methods)
                this.writeln(`\t${this.nativeFunctionName(stmt)}_t* ${stmt.name.canonical};`);
            this.writeln(`} vtbl_${name}_as_${stmt.name.canonical} = {`);
            for (let stmt of methods)
                this.writeln(`\tvtbl_${name}.${stmt.name.canonical},`);
            this.writeln('};');
        }
    }

    protected generateInterfaceVTable( target : ClassStmt, methods : FunctionStmt[] )
    {
        this.writeln(`\nstruct vtbl_${this.nativeName(target.name)} {`);
        for (let stmt of methods)
        {
            if (!(stmt instanceof FunctionStmt)) continue;
            this.writeln(`\t${this.nativeFunctionName(stmt)}_t* ${stmt.name.canonical};`);
        }
        this.writeln(`};`);
    }

    protected visitClassStmt(target: ClassStmt): void
    {
    }

    protected generateClasses(target: Unit): void
    {
        // static structure and storage
        for (let stmt of target.stmts)
            if (stmt instanceof ClassStmt && !stmt.isInterface)
                this.generateStatic(stmt);
        // dynamic structure
        for (let stmt of target.stmts)
            if (stmt instanceof ClassStmt)
            {
                if (!stmt.isInterface)
                    this.generateDynamic(stmt);
                else
                    this.generateInterface(stmt);
            }


        // method declarations
        for (let stmt of target.stmts)
            if (stmt instanceof ClassStmt)
            {
                let methods = this.getMethods(stmt);
                for (let method of methods)
                {
                    this.methodTypeDef(stmt, method);
                    if (!stmt.isInterface)
                        this.methodPrototype(stmt, method);
                }
            }
        // vtables
        for (let stmt of target.stmts)
            if (stmt instanceof ClassStmt)
            {
                let methods = this.getMethodHierarchy(stmt);
                if (stmt.isInterface)
                    this.generateInterfaceVTable(stmt, methods);
                else
                    this.generateVTable(stmt, methods);
            }
        // static initializer
        let functions : string[] = [];
        for (let stmt of target.stmts)
        {
            if (stmt instanceof ClassStmt && !stmt.isInterface)
            {
                let methods = this.getMethodHierarchy(stmt);
                functions.push(this.generateStaticInit(stmt));
            }
        }
        if (functions.length > 0)
        {
            this.writeln('\nstatic void sta_ctor()\n{');
            this.buffer.indent();
            for (let name of functions) this.writeln(`${name}();`);
            this.buffer.dedent();
            this.writeln('}');
        }
        functions = null;
        // default constructor
        for (let stmt of target.stmts)
        {
            if (stmt instanceof ClassStmt && !stmt.isInterface)
            {
                let ignore = false;
                for (let func of stmt.stmts)
                    ignore = ignore || (func instanceof FunctionStmt && func.name.canonical == 'constructor');
                if (!ignore)
                    this.generateDynamicInit(stmt);
            }
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

    protected visitVariableDecl(target: VariableDecl): void
    {
        if (!target.modifier || (target.modifier && target.modifier.values.indexOf(TokenType.EXPORT) < 0))
            this.write('static ');
        this.writeln(`${this.nativeType(target.type)} ${target.name.canonical};`);
    }

    protected visitVariableStmt(target: VariableStmt): void
    {
        for (let decl of target.decls)
            this.dispatch(decl);
    }

    protected visitTryCatchStmt(target: TryCatchStmt): void {

    }

    protected visitThrowStmt(target: ThrowStmt): void {

    }

    protected generateMethods( target : ClassStmt )
    {
        if (target.isInterface) return;

        for (let stmt of target.stmts)
        {
            if (!(stmt instanceof FunctionStmt)) continue;
            this.visitFunctionStmt(stmt);
        }
    }

    protected visitUnit(target: Unit): void
    {
        // prologue
        // TODO: move to a header or function
        this.writeln('struct dyn_Object;\nstatic void dyn_Object_ctor(struct dyn_Object* self_) {}\n');
        // class declarations
        this.generateClasses(target);
        // class methods
        for (let stmt of target.stmts)
            if (stmt instanceof ClassStmt)
                this.generateMethods(stmt);
        // everything else
        for (let stmt of target.stmts)
            if (!(stmt instanceof ClassStmt))
                this.dispatch(stmt);
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

    protected visitEnumStmt(target: EnumStmt): void
    {
        // TODO: implement
    }

    protected visitTernaryExpr(target: TernaryExpr): void {
        // TODO: implement
    }

    protected visitEnumDecl(target: EnumDecl): void {
        // TODO: implement
    }
}