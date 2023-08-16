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

enum OperationType
{
    LOGICAL,
    BINARY,
    BITWISE
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
        if (target.type == null)
        {
            this.error(target.location, "Missing type anotation");
            return false;
        }
        return this.resolveTypeRef(unit, target.type, 'property declaration', target.location);
    }

    checkVariableStmt( unit : Unit, target : VariableStmt ) : boolean
    {
        let success = true;
        for (let decl of target.decls)
        {
            if (decl.type == null)
            {
                this.error(decl.location, "Missing type anotation");
                success = false;
            }
            else
            {
                success = this.resolveTypeRef(unit, decl.type, 'variable declaration', decl.location) && success;
            }
        }
        return success;
    }

    globalTypeChecking( unit : Unit ) : boolean
    {
        return this.checkStmts(unit, unit.stmts);
    }

    checkStmts( unit : Unit, stmts : IStmt[] ) : boolean
    {
        let success = true;
        for (let stmt of stmts)
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
            else
            if (stmt instanceof NamespaceStmt)
                success = this.checkStmts(unit, stmt.stmts) && success;
        }
        return success;
    }

    protected visitTernaryExpr(target: TernaryExpr): TypeRef {
        let cond = this.dispatch(target.condition);
        let left = this.dispatch(target.thenSide);
        let right = this.dispatch(target.elseSide);
        if (cond != null && left != null && right != null)
        {
            if (cond.tid != TypeId.BOOLEAN)
            {
                this.error(target.location, `Ternary condition expression must evaluate to a boolean value`);
                return target.resolvedType_ = TypeRef.INVALID;
            }
            if (!this.checkCompatibleTypes(left, right, OperationType.BINARY))
            {
                this.error(target.location, `Incompatible types for ternary operator ('${left}' and '${right}')`);
                return target.resolvedType_ = TypeRef.INVALID;
            }
            return target.resolvedType_ = left;
        }
    }

    protected visitTemplateStringExpr(target: TemplateStringExpr): TypeRef
    {
        for (let expr of target.value)
            this.dispatch(expr);
        return target.resolvedType_ = this.createTypeRefById(TypeId.STRING);
    }

    visitTypeCastExpr(target: TypeCastExpr): TypeRef
    {
        return target.resolvedType_ = this.dispatch(target.type);
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
            if (result && !this.isAssignable(result, itype))
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
            if (!stmt) stmt = this.unit.functions.get(name);
            if (!stmt) stmt = this.unit.enums.get(name);
            if (!stmt) stmt = this.unit.imports_.get(name);
            if (stmt)
            {
                entry = new ScopeEntry();
                entry.target = stmt;
                entry.type = new TypeRef(TypeId.OBJECT, new Name([name]), 0);
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
        return target.resolvedType_ = this.createTypeRefById(TypeId.STRING);
    }

    visitNumberLiteral(target: NumberLiteral) : TypeRef
    {
        // TODO: treat 'char' as numeric type
        if (target.value.indexOf('.') >= 0)
        {
            let value = Number.parseFloat(target.value);
            if (value > 3.4028234664e+38 || value < 1.1754943508e-38)
                return target.resolvedType_ = this.createTypeRefById(TypeId.DOUBLE);
            else
                return target.resolvedType_ = this.createTypeRefById(TypeId.FLOAT);
        }
        else
        {
            // TODO: set 'value' as 'ulong' when self hosting
            // TODO: detect signal before convertion when self hosting
            let value = Number.parseInt(target.value);
            if (value > 0)
            {
                if (value <= 0x7F) return target.resolvedType_ = this.createTypeRefById(TypeId.BYTE);
                if (value <= 0xFF) return target.resolvedType_ = this.createTypeRefById(TypeId.UBYTE);
                if (value <= 0x7FFF) return target.resolvedType_ = this.createTypeRefById(TypeId.SHORT);
                if (value <= 0xFFFF) return target.resolvedType_ = this.createTypeRefById(TypeId.USHORT);
                if (value <= 0x7FFFFFFF) return target.resolvedType_ = this.createTypeRefById(TypeId.INT);
                if (value <= 0xFFFFFFFF) return target.resolvedType_ = this.createTypeRefById(TypeId.UINT);
                if (value <= 0x7FFFFFFFFFFFFFFF) return target.resolvedType_ = this.createTypeRefById(TypeId.LONG);
                return target.resolvedType_ = this.createTypeRefById(TypeId.ULONG);
            }
            else
            {
                if (value <= 0x7F) return target.resolvedType_ = this.createTypeRefById(TypeId.BYTE);
                if (value <= 0x7FFF) return target.resolvedType_ = this.createTypeRefById(TypeId.SHORT);
                if (value <= 0x7FFFFFFF) return target.resolvedType_ = this.createTypeRefById(TypeId.INT);
                return target.resolvedType_ = this.createTypeRefById(TypeId.LONG);
            }
        }
    }

    visitBoolLiteral(target: BoolLiteral) : TypeRef
    {
        return target.resolvedType_ = this.createTypeRefById(TypeId.BOOLEAN);
    }

    visitNameLiteral(target: NameLiteral) : TypeRef
    {
        let entry = this.find(target.value);
        if (entry == null)
        {
            this.error(target.location, `Cannot find name '${target.value}'`);
            return TypeRef.INVALID;
        }
        else
        {
            //Logger.writeln('---- visitNameLiteral -> ' + target.value + ' is a ' + entry.type.qualified);
            return target.resolvedType_ = entry.type;
        }
    }

    visitGroup(target: Group) : TypeRef
    {
        return target.resolvedType_ = this.dispatch(target.expr);
    }

    visitNullLiteral(target: NullLiteral) : TypeRef
    {
        return target.resolvedType_ = this.createTypeRefById(TypeId.OBJECT);
    }

    visitLogicalExpr(target: LogicalExpr) : TypeRef
    {
        let left = this.dispatch(target.left);
        let right = this.dispatch(target.right);
        if (left != null && right != null)
        {
            if (!this.checkCompatibleTypes(left, right, OperationType.LOGICAL))
            {
                this.error(target.location, 'Incompatible types for logical operator');
                return TypeRef.INVALID;
            }
            return target.resolvedType_ = new TypeRef(TypeId.BOOLEAN, new Name(['boolean']), 0);
        }
        return target.resolvedType_ = TypeRef.INVALID;
    }

    visitBinaryExpr(target: BinaryExpr) : TypeRef
    {
        let left = this.dispatch(target.left);
        let right = this.dispatch(target.right);
        if (left != null && right != null)
        {
            if (left.tid == TypeId.STRING || right.tid == TypeId.STRING)
            {
                const STYPES : TokenType[] = [TokenType.PLUS, TokenType.NULLISH, TokenType.EQUALITY, TokenType.S_EQUALITY, TokenType.INEQUALITY, TokenType.S_INEQUALITY];
                if (STYPES.indexOf(target.oper) < 0)
                {
                    this.error(target.location, `The operator ${target.oper.lexeme} cannot be used on strings`);
                    return TypeRef.INVALID;
                }
                return target.resolvedType_ = this.createTypeRefById(TypeId.STRING);
            }
            if (!this.checkCompatibleTypes(left, right, OperationType.BINARY))
            {
                this.error(target.location, `Incompatible types for binary operator ('${left}' and '${right}')`);
                return TypeRef.INVALID;
            }
            return target.resolvedType_ = left; // TODO: use the best fit between left and right
        }
        return target.resolvedType_ = TypeRef.INVALID;
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
            target.tid == TypeId.NUMBER ||
            target.tid == TypeId.CHAR);
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
        {
            this.error(target.location, `Incompatible types for assignment ('${left}' and '${right}')`);
            return TypeRef.INVALID;
        }
        const SOPERS = [TokenType.PLUS_EQUAL, TokenType.EQUAL, TokenType.NULLISH_EQUAL];
        if (left.tid == TypeId.STRING && SOPERS.indexOf(target.oper) < 0)
        {
            this.error(target.location, `The operator ${target.oper.lexeme} cannot be used on strings`);
            return TypeRef.INVALID;
        }
        return target.resolvedType_ = left;
    }

    visitUnaryExpr(target: UnaryExpr) : TypeRef
    {
        return target.resolvedType_ = this.dispatch(target.expr);
    }

    visitCallExpr(target: CallExpr) : TypeRef
    {
        // TODO: make sure target.callee is a function
        let type = this.dispatch(target.callee);
        if (!type || !type.isFunction || !type.ref || !(type.ref instanceof FunctionStmt))
        {
            this.error(target.location, 'Callee must be a function');
            return target.resolvedType_ = null;
        }
        else
        {
            type = (<FunctionStmt>type.ref).type;
            return target.resolvedType_ = type;
        }
    }

    visitArrayExpr(target: ArrayExpr) : TypeRef
    {
        if (target.values.length > 0)
        {
            const type = this.dispatch(target.values[0]); // TODO: check all elements and use the biggest type
            return target.resolvedType_ = new TypeRef(type.tid, type.name, type.dims+1, type.location);
        }
        return target.resolvedType_ = TypeRef.INVALID; // TODO: empty array match any type
    }

    visitArrayAccessExpr(target: ArrayAccessExpr) : TypeRef
    {
        const type = this.dispatch(target.callee);
        if (type.dims == 0)
        {
            if (type.tid == TypeId.STRING)
                return target.resolvedType_ = this.createTypeRefById(TypeId.CHAR);
            this.error(target.location, 'Expression is not an array');
            return target.resolvedType_ = TypeRef.INVALID;
        }
        return target.resolvedType_ = new TypeRef(type.tid, type.name, type.dims - 1, type.location);
    }

    findMember( name : string, target : ClassStmt ) : IStmt
    {
        for (let stmt of target.stmts)
        {
            if (stmt instanceof FunctionStmt && stmt.name.canonical == name)
            {
                if (!stmt.type?.ref) this.dispatch(stmt.type);
                return stmt;
            }
            if (stmt instanceof PropertyStmt && stmt.name.canonical == name)
            {
                if (!stmt.type?.ref) this.dispatch(stmt.type);
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
        let type = this.dispatch(target.callee);
        if (type.ref && type.ref instanceof ClassStmt)
        {
            let stmt = this.findMember(target.name.canonical, type.ref);
            if (stmt instanceof PropertyStmt)
                return target.resolvedType_ = stmt.type;
            else
            if (stmt instanceof FunctionStmt)
            {
                type = this.createTypeRefById(TypeId.FUNCTION);
                type.ref = stmt;
                return target.resolvedType_ = type;
            }
        }
        this.error(target.location, 'Cannot find \'' + target.name.canonical + '\'');
        return TypeRef.INVALID;
    }

    visitOptChainingExpr(target: OptChainingExpr) : TypeRef
    {
        // TODO: returned type may not be primitive (since '.?' can result in null)
        let type = this.dispatch(target.callee);
        if (type.ref && type.ref instanceof ClassStmt)
        {
            let stmt = this.findMember(target.name.canonical, type.ref);
            if (stmt instanceof PropertyStmt)
                return target.resolvedType_ = stmt.type;
            else
            if (stmt instanceof FunctionStmt)
            {
                type = this.createTypeRefById(TypeId.FUNCTION);
                type.ref = stmt;
                return target.resolvedType_ = type;
            }
        }
        this.error(target.location, 'Cannot find \'' + target.name.canonical + '\'');
        return TypeRef.INVALID;
    }

    visitNewExpr(target: NewExpr) : TypeRef
    {
        return target.type = target.resolvedType_ = this.dispatch(target.type);
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
            'ubyte', 'ushort', 'uint', 'ulong', 'float', 'double', 'number', 'string', 'void', 'Function'];
        const TYPES : TypeId[] = [TypeId.BOOLEAN, TypeId.VOID, TypeId.CHAR,TypeId.BYTE, TypeId.SHORT, TypeId.INT, TypeId.LONG,
            TypeId.UBYTE, TypeId.USHORT, TypeId.UINT, TypeId.ULONG, TypeId.FLOAT, TypeId.DOUBLE, TypeId.NUMBER, TypeId.STRING,
            TypeId.VOID, TypeId.FUNCTION];
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
        let name = type.qualified;
        if (this.isPrimitiveType(name)) return this.createTypeRef(name);

        let clazz = this.unit.types.get(name);
        if (clazz)
        {
            type.tid = TypeId.OBJECT;
            type.ref = clazz;
            return type;
        }

        let stmt = this.unit.imports_.get(name);
        if (stmt && stmt instanceof ClassStmt)
        {
            type.tid = TypeId.OBJECT;
            type.ref = stmt;
            return type;
        }

        this.error(type.location, `Unknown type '${name}'`);
        return TypeRef.INVALID;
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
        //if (target.dims > 0)
        //    return this.createArrayType(target.dims, target);
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
        return target.resolvedType_ = TypeRef.INVALID; // unused
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
        if (target.parent instanceof ClassStmt && !target.parent.isInterface)
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

    checkCompatibleTypes( type1 : TypeRef, type2 : TypeRef, oper : OperationType ) : boolean
    {
        const NTYPES : TypeId[] = [TypeId.BYTE,  TypeId.SHORT,  TypeId.INT,  TypeId.LONG,
            TypeId.CHAR, TypeId.UBYTE,  TypeId.USHORT, TypeId.UINT,
            TypeId.ULONG, TypeId.FLOAT, TypeId.DOUBLE, TypeId.NUMBER];

        // logical operator
        if (oper == OperationType.LOGICAL)
            return type1.tid == TypeId.BOOLEAN && type2.tid == TypeId.BOOLEAN;
        // bitwise operator
        const numerics = (NTYPES.indexOf(type1.tid) >= 0) && (NTYPES.indexOf(type2.tid) >= 0);
        if (oper == OperationType.BITWISE)
            return numerics;
        // binary operator
        if (numerics)
            return true;
        if (type1.tid == TypeId.OBJECT && type2.tid == TypeId.OBJECT)
            return type1.ref && type2.ref && (<ClassStmt>type1.ref).name.qualified == (<ClassStmt>type2.ref).name.qualified;
        if (type1.tid != type2.tid || type1.tid == TypeId.INVALID || type1.tid == TypeId.VOID)
            return false;
        return true;
    }

    findFittestType( type1 : TypeRef, type2 : TypeRef ) : TypeRef
    {
       /* if (type1.tid == TypeId.VOID || type2.tid == TypeId.VOID)
            return false;

        const STYPES : TypeId[] = [TypeId.BYTE,  TypeId.SHORT,  TypeId.INT,  TypeId.LONG, TypeId.LONG];
        const UTYPES : TypeId[] = [TypeId.UBYTE, TypeId.USHORT, TypeId.UINT, TypeId.CHAR, TypeId.ULONG];
        const FTYPES : TypeId[] = [TypeId.FLOAT, TypeId.DOUBLE, TypeId.NUMBER];
        if (type1.tid != TypeId.BOOLEAN && type1.tid != TypeId.STRING)
        {
            // TODO: if operands are numeric, find the best fit between them
        }*/
        return null;
    }

    visitVariableDecl(target: VariableDecl) : TypeRef
    {
        let result : TypeRef = null;
        if (target.type)
            result = target.type = this.dispatch(target.type);
        if (target.init)
        {
            let itype = this.dispatch(target.init);
            if (result && !this.isAssignable(result, itype))
                this.error(target.location, `Initializer expression incompatible with variable type ('${result}' and '${itype}')`);

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
            for (let stmt of target.stmts)
            {
                this.dispatch(stmt);
            }
        } catch (error)
        {
            //this.ctx.listener.onError(error.location, error);
            console.error(error);
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
        this.visitUnit(unit);
        return true;
    }
}