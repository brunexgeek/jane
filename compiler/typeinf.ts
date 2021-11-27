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

import { CompilationContext, SourceLocation } from './compiler';
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
	ChainingExpr,
	OptChainingExpr,
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
    IStmt,
    TypeCastExpr,
    PropertyStmt,
    ForStmt,
    DispatcherTypeRef,
    TypeId,
    TemplateStringExpr,
    EnumStmt,
    TernaryExpr,
    EnumDecl,
    VariableDecl} from './types';
import { TokenType } from './tokenizer';
import { realpath, dirname, Logger } from './utils';
import { SemanticError } from './exception';

class ScopeEntry
{
    target : IStmt;
    type : TypeRef;
}

class StrScpEntMap{
    private keys : string[] = [];
    private items : ScopeEntry[] = [];
    get( key : string ) : ScopeEntry {
            let i = this.keys.indexOf(key);
            if (i < 0) return null;
            return this.items[i];
    }
    set( key : string, value : ScopeEntry ) {
            let i = this.keys.indexOf(key);
            if (i >= 0) this.items[i] = value;
            else { this.keys.push(key); this.items.push(value); }
    }
    values() : ScopeEntry[] { return this.items; }
}

class Scope
{
    private entries : StrScpEntMap = new StrScpEntMap();

    constructor()
    {
        //this.insert('result', new NullLiteral(), new TypeRef(new Name(['result'], null), null, 0));
        //if (this.entries.find('result')) console.error('Got it!');
    }

    insert( name : string, target : IStmt, type : TypeRef )
    {
        //Logger.writeln(`Adding '${name}' as ${type.qualified}`);
        let item = new ScopeEntry();
        item.target = target;
        item.type = type;
        this.entries.set(name, item);
    }

    find( name : string ) : ScopeEntry
    {
        return this.entries.get(name);
    }
}

export class TypeInference extends DispatcherTypeRef
{
    ctx : CompilationContext;
    stack : Scope[] = [new Scope()];
    unit : Unit = null;

    constructor( ctx : CompilationContext )
    {
        super();
        this.ctx = ctx;
    }

    resolveTypeRef( unit : Unit, type : TypeRef, context : string, location : SourceLocation = null ) : boolean
    {
        if (!type)
        {
            this.error(location, `Missing type in ${context}`);
            return false;
        }
        else
        if (!type.isPrimitive())
        {
            type.ref = this.resolveTypeByName(unit, type.name);
            if (!type.ref)
            {
                this.error(type.location, `Unknown type '${type.qualified}'`);
                return false;
            }
        }
        return true;
    }

    checkFunctionStmt( unit : Unit, target : FunctionStmt ) : boolean
    {
        let success = true;

        for (let param of target.params)
            success = this.resolveTypeRef(unit, param.type, 'parameter declaration', param.location) && success;
        success = this.resolveTypeRef(unit, target.type, 'return type', target.type ? target.type.location : target.location) && success;
        return success;
    }

    checkPropertyStmt( unit : Unit, target : PropertyStmt ) : boolean
    {
        return this.resolveTypeRef(unit, target.type, 'property declaration', target.location);
    }

    checkVariableStmt( unit : Unit, target : VariableStmt ) : boolean
    {
        let success = true;
        for (let decl of target.decls)
            success = this.resolveTypeRef(unit, decl.type, 'variable declaration', /* TODO: should use 'decl' */target.location) && success;
        return success;
    }

    globalTypeChecking( unit : Unit ) : boolean
    {
        let success = true;
        for (let stmt of unit.stmts)
        {
            if (stmt instanceof VariableStmt)
                success = this.checkVariableStmt(unit, stmt) && success;
            else
            if (stmt instanceof FunctionStmt)
                success = this.checkFunctionStmt(unit, stmt) && success;
            else
            if (stmt instanceof ClassStmt)
            {
                for (let stm of stmt.stmts)
                {
                    if (stm instanceof PropertyStmt)
                        success = this.checkPropertyStmt(unit, stm) && success;
                    else
                    if (stm instanceof FunctionStmt)
                        success = this.checkFunctionStmt(unit, stm) && success;
                }
            }
        }
        return success;
    }

    protected visitTernaryExpr(target: TernaryExpr): TypeRef {
        // TODO: implement
        return TypeRef.VOID;
    }

    protected visitTemplateStringExpr(target: TemplateStringExpr): TypeRef
    {
        return null;
    }

    visitTypeCastExpr(target: TypeCastExpr): TypeRef
    {
        return this.dispatch(target.type);
    }

    visitPropertyStmt(target: PropertyStmt): TypeRef
    {
        let result : TypeRef = null;
        if (target.type)
        {
            result = this.dispatch(target.type);
        }
        if (target.init)
        {
            let itype = this.dispatch(target.init);
            if (result && !this.checkCompatibleTypes(result, itype))
                this.error(target.location, `Initialization incompatible with variable type ('${result}' and '${itype}'`);

            if (!result) result = itype;
        }
        target.type = result;

        this.top().insert(target.name.toString(), target, result);
        return result;
    }

    visitForStmt(target: ForStmt): TypeRef
    {
        return TypeRef.VOID;
    }

    /**
     * Creates a new variable scope.
     */
    push()
    {
        this.stack.push(new Scope());
        //Logger.writeln('push scope');
    }

    pop()
    {
        if (this.stack.length <= 1)
            throw new SemanticError('Type inference stack underflow');
        this.stack.pop();
        //Logger.writeln('pop scope');
    }

    top() : Scope
    {
        return this.stack[ this.stack.length - 1 ];
    }

    error( location : SourceLocation, message : string ) : SemanticError
    {
        let result = new SemanticError(message, location);
        this.ctx.listener.onError(location, result);
        return result;
    }

    find( name : string ) : ScopeEntry
    {
        if (this.stack.length == 0) return null;

        let i = this.stack.length - 1;
        let entry : ScopeEntry = null;
        while (i >= 0)
        {
            entry = this.stack[i].find(name);
            if (entry != null) break;
            --i;
        }

        if (!entry)
        {
            // check for known types
            let stmt : IStmt = this.unit.types.get(name);
            if (!stmt) stmt = this.unit.imports_.get(name);
            if (stmt && stmt instanceof ClassStmt)
            {
                entry = new ScopeEntry();
                entry.target = stmt;
                entry.type = new TypeRef(TypeId.OBJECT, (<ClassStmt>stmt).name, 0);
                entry.type.ref = stmt;
            }
        }

        /*if (entry)
            Logger.writeln(`Found '${name}' (${this.stack.length} scopes)`);
        else
        if (!entry)
            Logger.writeln(`Missing '${name}'  (${this.stack.length} scopes)`);*/
        return entry;
    }

    visitName(target: Name) : TypeRef {
        return TypeRef.VOID; // unused
    }

    visitStringLiteral(target: StringLiteral) : TypeRef
    {
        return this.createTypeRefById(TypeId.STRING);
    }

    visitNumberLiteral(target: NumberLiteral) : TypeRef
    {
        if (target.value.indexOf('.') >= 0)
        {
            let value = Number.parseFloat(target.value);
            if (value > 3.4028234664e+38 || value < 1.1754943508e-38)
                return this.createTypeRefById(TypeId.DOUBLE);
            else
                return this.createTypeRefById(TypeId.FLOAT);
        }
        else
        {
            // TODO: set 'value' as 'ulong' when self hosting
            // TODO: detect signal before convertion when self hosting
            let value = Number.parseInt(target.value);
            if (value > 0)
            {
                if (value <= 0x7F) return this.createTypeRefById(TypeId.BYTE);
                if (value <= 0xFF) return this.createTypeRefById(TypeId.UBYTE);
                if (value <= 0x7FFF) return this.createTypeRefById(TypeId.SHORT);
                if (value <= 0xFFFF) return this.createTypeRefById(TypeId.USHORT);
                if (value <= 0x7FFFFFFF) return this.createTypeRefById(TypeId.INT);
                if (value <= 0xFFFFFFFF) return this.createTypeRefById(TypeId.UINT);
                if (value <= 0x7FFFFFFFFFFFFFFF) return this.createTypeRefById(TypeId.LONG);
                return this.createTypeRefById(TypeId.ULONG);
            }
            else
            {
                if (value <= 0x7F) return this.createTypeRefById(TypeId.BYTE);
                if (value <= 0x7FFF) return this.createTypeRefById(TypeId.SHORT);
                if (value <= 0x7FFFFFFF) return this.createTypeRefById(TypeId.INT);
                return this.createTypeRefById(TypeId.LONG);
            }
        }
    }

    visitBoolLiteral(target: BoolLiteral) : TypeRef
    {
        return this.createTypeRefById(TypeId.BOOLEAN);
    }

    visitNameLiteral(target: NameLiteral) : TypeRef
    {
        let entry = this.find(target.value);
        if (entry == null)
            throw this.error(target.location, `Cannot find name '${target.value}'`);
        else
        {
            //Logger.writeln('---- visitNameLiteral -> ' + target.value + ' is a ' + entry.type.qualified);
            target.resolvedType_ = entry.type;
            return entry.type;
        }
    }

    visitGroup(target: Group) : TypeRef
    {
        return this.dispatch(target.expr);
    }

    visitNullLiteral(target: NullLiteral) : TypeRef
    {
        return TypeRef.VOID;
    }

    visitLogicalExpr(target: LogicalExpr) : TypeRef
    {
        let left = this.dispatch(target.left);
        let right = this.dispatch(target.right);
        if (left != null && right != null)
        {
            if (!this.checkCompatibleTypes(left, right))
                throw this.error(target.location, 'Incompatible types for logical operator');
            return new TypeRef(TypeId.BOOLEAN, new Name(['boolean']), 0);
        }
        return null;
    }

    visitBinaryExpr(target: BinaryExpr) : TypeRef
    {
        let left = this.dispatch(target.left);
        let right = this.dispatch(target.right);
        if (left != null && right != null)
        {
            if (!this.checkCompatibleTypes(left, right))
                throw this.error(target.location, `Incompatible types for binary operator ('${left}' and '${right}')`);
            if (left.tid == TypeId.STRING && target.oper != TokenType.PLUS)
                throw this.error(target.location, `The operator ${target.oper.lexeme} cannot be used on strings`);
            return left;
        }
        return null;
    }

    isNumeric( target : TypeRef )
    {
        return (target.tid == TypeId.BYTE ||
            target.tid == TypeId.UBYTE ||
            target.tid == TypeId.SHORT ||
            target.tid == TypeId.USHORT ||
            target.tid == TypeId.INT ||
            target.tid == TypeId.UINT ||
            target.tid == TypeId.LONG ||
            target.tid == TypeId.ULONG ||
            target.tid == TypeId.FLOAT ||
            target.tid == TypeId.DOUBLE ||
            target.tid == TypeId.NUMBER);
    }

    isAssignable( lhs : TypeRef, rhs : TypeRef )
    {
        if (!lhs || !rhs) return false;
        if (lhs.tid == TypeId.BOOLEAN || lhs.tid == TypeId.STRING)
            return lhs.qualified == rhs.qualified;
        if (lhs.tid == TypeId.VOID)
            return false;

        if (this.isNumeric(lhs))
            return this.isNumeric(rhs); // TODO: check for possible data loss
        else // this 'else' is important
        if (lhs.dims == 0 && rhs.tid == TypeId.VOID)
            return true;

        if (lhs.qualified == rhs.qualified)
            return true;

        // FIXME: handle derived types
        return false;
    }

    visitAssignExpr(target: AssignExpr) : TypeRef
    {
        let left = this.dispatch(target.left);
        let right = this.dispatch(target.right);
        if (!this.isAssignable(left, right))
            throw this.error(target.location, `Incompatible types for assignment ('${left}' and '${right}')`);
        if (left.tid == TypeId.STRING && target.oper != TokenType.PLUS_EQUAL && target.oper != TokenType.EQUAL)
            throw this.error(target.location, `The operator ${target.oper.lexeme} cannot be used on strings`);
        return left;
    }

    visitUnaryExpr(target: UnaryExpr) : TypeRef
    {
        return this.dispatch(target.expr);
    }

    visitCallExpr(target: CallExpr) : TypeRef
    {
        this.dispatch(target.callee);
        //if (!target.callee.resolvedType() || target.callee.resolvedType().isPrimitive())
        //    this.error(target.location, 'Only functions and methods can be called');
        return target.callee.resolvedType();
    }

    visitArrayExpr(target: ArrayExpr) : TypeRef
    {
        if (target.values.length > 0)
        {
            let type = this.dispatch(target.values[0]);
            let name = `array_1_${type.name}`;
            let tref = this.createTypeRef(name);
            tref.ref = <ClassStmt>this.unit.imports_.get(name);
            return tref;
        }
        return TypeRef.INVALID;
    }

    visitArrayAccessExpr(target: ArrayAccessExpr) : TypeRef
    {
        return this.dispatch(target.callee);
    }

    findMember( name : string, target : ClassStmt ) : IStmt
    {
        for (let stmt of target.stmts)
        {
            if (stmt instanceof FunctionStmt && stmt.name.canonical == name)
            {
                if (!stmt.type.ref) this.dispatch(stmt.type);
                return stmt;
            }
            if (stmt instanceof PropertyStmt && stmt.name.canonical == name)
            {
                if (!stmt.type.ref) this.dispatch(stmt.type);
                return stmt;
            }
            //if (stmt instanceof PropertyStmt) Logger.writeln('---- findMember: ' + stmt.name.canonical);
        }
        if (target.extended && target.extended.ref)
            return this.findMember(name, <ClassStmt> target.extended.ref);
        if (target.implemented)
        {
            for (let intf of target.implemented)
            {
                if (!intf.ref) continue;
                let result = this.findMember(name, <ClassStmt> intf.ref);
                if (result) return result;
            }
        }
        return null;
    }

    visitChainingExpr(target: ChainingExpr) : TypeRef
    {
        //Logger.writeln('---- visitFieldExpr -> ' + target.callee.className());
        let type = this.dispatch(target.callee);
        //Logger.writeln('---- visitFieldExpr -> ' + type.ref.name.qualified);
        if (type.ref && type.ref instanceof ClassStmt)
        {
            let stmt = this.findMember(target.name.canonical, type.ref);
            if (stmt instanceof PropertyStmt)
                return target.resolvedType_ = stmt.type;
            else
            if (stmt instanceof FunctionStmt)
                return target.resolvedType_ = stmt.type;
        }
        throw this.error(target.location, 'Cannot find \'' + target.name.canonical + '\'');
    }

    visitOptChainingExpr(target: OptChainingExpr) : TypeRef
    {
        //Logger.writeln('---- visitFieldExpr -> ' + target.callee.className());
        let type = this.dispatch(target.callee);
        //Logger.writeln('---- visitFieldExpr -> ' + type.ref.name.qualified);
        if (type.ref && type.ref instanceof ClassStmt)
        {
            let stmt = this.findMember(target.name.canonical, type.ref);
            if (stmt instanceof PropertyStmt)
                return target.resolvedType_ = stmt.type;
            else
            if (stmt instanceof FunctionStmt)
                return target.resolvedType_ = stmt.type;
        }
        throw this.error(target.location, 'Cannot find \'' + target.name.canonical + '\'');
    }

    visitNewExpr(target: NewExpr) : TypeRef
    {
        return target.type = this.dispatch(target.type);
    }

    visitModifier(target: Modifier) : TypeRef
    {
        return TypeRef.VOID; // unused
    }

    visitBlockStmt(target: BlockStmt) : TypeRef
    {
        this.push();

        for (let stmt of target.stmts)
            this.dispatch(stmt);

        this.pop();
        return TypeRef.VOID; // unused
    }

    visitReturnStmt(target: ReturnStmt) : TypeRef
    {
        return this.dispatch(target.expr);
    }

    visitNamespaceStmt(target: NamespaceStmt) : TypeRef
    {
        this.push();
        for (let stmt of target.stmts) this.dispatch(stmt);
        this.pop();
        return TypeRef.VOID; // unused
    }

    isPrimitiveType( type : string )
    {
        const PRIMITIVES : string[] = ['boolean','void','char','byte', 'short', 'int', 'long',
            'ubyte', 'ushort', 'uint', 'ulong', 'float', 'double', 'number', 'string'];
        return PRIMITIVES.indexOf(type) >= 0;
    }

    createTypeRef( type : string ) : TypeRef
    {
        const PRIMITIVES : string[] = ['boolean','void','char','byte', 'short', 'int', 'long',
            'ubyte', 'ushort', 'uint', 'ulong', 'float', 'double', 'number', 'string', 'void'];
        const TYPES : TypeId[] = [TypeId.BOOLEAN, TypeId.VOID, TypeId.CHAR,TypeId.BYTE, TypeId.SHORT, TypeId.INT, TypeId.LONG,
            TypeId.UBYTE, TypeId.USHORT, TypeId.UINT, TypeId.ULONG, TypeId.FLOAT, TypeId.DOUBLE, TypeId.NUMBER, TypeId.STRING, TypeId.VOID];
        let idx = PRIMITIVES.indexOf(type);
        if (idx >= 0)
            return new TypeRef(TYPES[idx], new Name([type]), 0);
        return new TypeRef(TypeId.OBJECT, new Name([type]), 0);
    }

    createTypeRefById( type : TypeId ) : TypeRef
    {
        const PRIMITIVES : string[] = ['boolean','void','char','byte', 'short', 'int', 'long',
            'ubyte', 'ushort', 'uint', 'ulong', 'float', 'double', 'number', 'string', 'void'];
        const TYPES : TypeId[] = [TypeId.BOOLEAN, TypeId.VOID, TypeId.CHAR,TypeId.BYTE, TypeId.SHORT, TypeId.INT, TypeId.LONG,
            TypeId.UBYTE, TypeId.USHORT, TypeId.UINT, TypeId.ULONG, TypeId.FLOAT, TypeId.DOUBLE, TypeId.NUMBER, TypeId.STRING, TypeId.VOID];
        let idx = TYPES.indexOf(type);
        if (idx >= 0)
            return new TypeRef(type, new Name([PRIMITIVES[idx]]), 0);
        return new TypeRef(TypeId.OBJECT, new Name(['Object']), 0);
    }

    resolveTypeByName( unit : Unit, type : Name ) : IStmt
    {

        let name = type.qualified;
        if (this.isPrimitiveType(name)) return null;

        let stmt : IStmt = unit.types.get(name);
        if (stmt) return stmt;
        stmt = unit.enums.get(name);
        if (stmt) return  stmt;
        stmt = unit.imports_.get(name);
        if (stmt && (stmt instanceof ClassStmt || stmt instanceof EnumStmt)) return  stmt;

        return null;
    }

    resolveType( type : TypeRef ) : TypeRef
    {
        /*if (type.isGeneric)
        {
            let generic = this.findGeneric(type.name.qualified);
            if (!generic) throw this.error(type.location, `Unknown generic type '${type.name.qualified}'`);
            this.specializeGeneric(generic, type.generics);
        }*/

        let name = type.qualified;
        if (this.isPrimitiveType(name)) return null;

        let clazz = this.unit.types.get(name);
        if (clazz)
        {
            type.ref = clazz;
            return type;
        }

        let stmt = this.unit.imports_.get(name);
        if (stmt && stmt instanceof ClassStmt)
        {
            type.ref = stmt;
            return type;
        }

        /*let imps = '';
        for (const name of this.unit.imports_.values())
        {
            imps += (<ClassStmt>name).name + ' ';
        }*/
        throw this.error(type.location, `Unknown type '${name}'`);
    }

    createArrayType( dims : number, ref : TypeRef ) : TypeRef
    {
        ref.dims = 0;
        let name = `array_${dims}_${ref.name.toString()}`;
        let type = this.ctx.array_types.get(name);
        if (type == null)
        {
            let length = new VariableStmt([ new VariableDecl(new Name(['length']), this.createTypeRefById(TypeId.NUMBER), null, false)]);
            type = new ClassStmt(new Name([name]), null, null, [length]);
            this.ctx.array_types.set(name, type);
        }
        let result = this.createTypeRef(name);
        result.ref = type;
        return result;
    }

    visitTypeRef(target: TypeRef) : TypeRef
    {
        if (target.dims > 0)
            return this.createArrayType(target.dims, target);
        return this.resolveType(target);
    }

    visitCaseStmt(target: CaseStmt) : TypeRef
    {
        this.dispatch(target.expr);
        for (let stmt of target.stmts) this.dispatch(stmt);
        return TypeRef.VOID; // unused
    }

    visitSwitchStmt(target: SwitchStmt) : TypeRef
    {
        this.dispatch(target.expr);
        for (let stmt of target.cases) this.dispatch(stmt);
        return TypeRef.VOID; // unused
    }

    visitIfStmt(target: IfStmt) : TypeRef
    {
        this.dispatch(target.condition);
        if (target.thenSide) this.dispatch(target.thenSide);
        if (target.elseSide) this.dispatch(target.elseSide);
        return TypeRef.VOID; // unused
    }

    visitForOfStmt(target: ForOfStmt) : TypeRef
    {
        this.push();
        let type = this.dispatch(target.expr);
        target.variable.decls[0].type = type;
        type = this.dispatch(target.variable);
        this.dispatch(target.expr);
        this.dispatch(target.stmt);
        this.pop();
        return TypeRef.VOID; // unused
    }

    visitDoWhileStmt(target: DoWhileStmt) : TypeRef
    {
        this.dispatch(target.condition);
        this.dispatch(target.stmt);
        return TypeRef.VOID; // unused
    }

    visitWhileStmt(target: WhileStmt) : TypeRef
    {
        this.dispatch(target.condition);
        this.dispatch(target.stmt);
        return TypeRef.VOID; // unused
    }

    visitParameter(target: Parameter) : TypeRef
    {
        return target.type;
    }

    visitExpandExpr(target: ExpandExpr) : TypeRef
    {
        return TypeRef.VOID; // unused
    }

    visitFunctionStmt(target: FunctionStmt) : TypeRef
    {
        this.push();

        if (!target.type)
            target.type.tid = TypeId.VOID;
        else
            this.dispatch(target.type);

        for (let param of target.params)
        {
            this.dispatch(param.type);
            this.top().insert(param.name.canonical, param, param.type);
        }
        if (target.parent instanceof ClassStmt)
        {
            let type = new TypeRef(TypeId.OBJECT, target.parent.name, 0);
            type.ref = target.parent;
            let variable = new VariableStmt([new VariableDecl(new Name(['this']), type, null, false)]);
            this.top().insert('this', variable, type);

            type = new TypeRef(TypeId.OBJECT, target.parent.extended.name, 0);
            type.ref = target.parent.extended.ref;
            variable = new VariableStmt([new VariableDecl(new Name(['super']), type, null, false)]);
            this.top().insert('super', variable, type);
        }

        if (target.body) this.dispatch(target.body);

        this.pop();

        return target.type;
    }

    visitClassStmt(target: ClassStmt) : TypeRef
    {
        this.push();

        if (target.extended)
            this.dispatch(target.extended);
        if (target.implemented)
        {
            for (let intf of target.implemented)
                this.dispatch(intf);
        }
        for (let stmt of target.stmts)
            this.dispatch(stmt);

        this.pop();
        return TypeRef.VOID; // unused
    }

    visitExprStmt(target: ExprStmt) : TypeRef
    {
        return this.dispatch(target.expr);
    }

    visitBreakStmt(target: BreakStmt) : TypeRef {
        return TypeRef.VOID; // unused
    }

    visitContinueStmt(target: ContinueStmt) : TypeRef
    {
        return TypeRef.VOID; // unused
    }

    visitImportStmt(target: ImportStmt) : TypeRef
    {
        return TypeRef.VOID; // unused
    }

    checkCompatibleTypes( type1 : TypeRef, type2 : TypeRef ) : boolean
    {
        if (type1.tid == TypeId.BOOLEAN || type1.tid == TypeId.NUMBER)
            return type2.qualified == type1.qualified;
        if (type1.tid == TypeId.VOID || type2.tid == TypeId.VOID)
            return false;
        return type1.qualified == type2.qualified;
    }

    visitVariableDecl(target: VariableDecl) : TypeRef
    {
        let result : TypeRef = null;
        if (target.type)
            result = this.dispatch(target.type);
        if (target.init)
        {
            let itype = this.dispatch(target.init);
            if (result && !this.isAssignable(result, itype))
                this.error(target.location, `Initialize incompatible with variable type ('${result}' and '${itype}'`);

            if (!result) result = itype;
        }
        target.type = result;

        this.top().insert(target.name.toString(), target, result);
        if (!result) return TypeRef.VOID; // unused
        return result;
    }

    visitVariableStmt(target: VariableStmt) : TypeRef
    {
        for (let decl of target.decls)
            this.visitVariableDecl(decl);
        return TypeRef.VOID; // unused
    }

    visitTryCatchStmt(target: TryCatchStmt) : TypeRef
    {
        this.dispatch(target.block);
        this.dispatch(target.cblock);
        this.dispatch(target.fblock);
        return TypeRef.VOID; // unused
    }

    visitThrowStmt(target: ThrowStmt) : TypeRef
    {
        this.dispatch(target.expr);
        return TypeRef.VOID; // unused
    }

    visitUnit(target: Unit) : TypeRef
    {
        try {
            this.unit = target;
            for (let stmt of target.stmts) this.dispatch(stmt);
        } catch (error)
        {
            //this.ctx.listener.onError(error.location, error);
        }
        return TypeRef.VOID; // unused
    }

    protected visitEnumStmt(target: EnumStmt): TypeRef
    {
        // TODO: implement
        return TypeRef.VOID;
    }

    protected visitEnumDecl(target: EnumDecl): TypeRef {
        throw new Error('Method not implemented.');
    }

    public typeInference( unit : Unit ) : boolean
    {
        if (!this.globalTypeChecking(unit))
            return false;
        //this.visitUnit(unit);
        return true;
    }
}