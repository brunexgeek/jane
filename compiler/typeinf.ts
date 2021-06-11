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
    IStmt,
    TypeCastExpr,
    PropertyStmt,
    ForStmt,
    DispatcherTypeRef,
    StrIStmtMap} from './types';
import { TokenType } from './tokenizer';
import { realpath, dirname, Logger } from './utils';
import { createObject, createCallable, createError, createString } from './parser';

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

export class SemanticError extends Error
{
    public location : SourceLocation;

    constructor( message : string, location : SourceLocation = null )
    {
        //if (location) message += ' at ' + location.toString();
        super(message);
        this.location = location;
    }
}

export class TypeInference extends DispatcherTypeRef
{
    ctx : CompilationContext;
    stack : Scope[] = [new Scope()];
    imports : StrIStmtMap = new StrIStmtMap();
    unit : Unit = null;

    constructor( ctx : CompilationContext )
    {
        super();
        this.ctx = ctx;
    }

    findSymbol( unit : Unit, name : string ) : IStmt
    {
        let stmt = <IStmt> unit.variables.get(name);
        if (stmt) return stmt;
        stmt = <IStmt> unit.functions.get(name);
        if (stmt) return stmt;
        stmt = <IStmt> unit.types.get(name);
        if (stmt) return stmt;
        stmt = <IStmt> unit.generics.get(name);
        if (stmt) return stmt;
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
                this.error(target.location, `Initialize incompatible with variable type (${result} and ${itype}`);

            if (!result) result = itype;
        }
        target.type = result;

        this.top().insert(target.name.toString(), target, result);
        return result;
    }

    processImports()
    {
        let dir = dirname(this.unit.fileName);
        for (let imp of this.unit.imports)
        {
            let source = realpath(dir + imp.source + '.ts');
            let unit = this.ctx.units.get(source);
            if (!unit) this.error(imp.location, `Missing symbols for ${source}`); // never should happen
            for (let name of imp.names)
            {
                let stmt = this.findSymbol(unit, name.qualified);
                if (!stmt) this.error(name.location, `Unable to find symbol ${name.qualified}`);
                this.imports.set(name.qualified, stmt);
            }
        }

        // built-in types
        let type = createObject();
        this.imports.set(type.name.qualified, type);
        type = createCallable();
        this.imports.set(type.name.qualified, type);
        type = createError();
        this.imports.set(type.name.qualified, type);
        type = createString();
        this.imports.set(type.name.qualified, type);
    }

    visitForStmt(target: ForStmt): TypeRef {
        return TypeRef.VOID;
    }

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
            if (!stmt) stmt = this.imports.get(name);
            if (stmt && stmt instanceof ClassStmt)
            {
                entry = new ScopeEntry();
                entry.target = stmt;
                entry.type = new TypeRef((<ClassStmt>stmt).name, null, 0, true);
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
        return TypeRef.VOID;
    }

    visitStringLiteral(target: StringLiteral) : TypeRef
    {
        return TypeRef.STRING;
    }

    visitNumberLiteral(target: NumberLiteral) : TypeRef
    {
        return TypeRef.NUMBER;
    }

    visitBoolLiteral(target: BoolLiteral) : TypeRef
    {
        return TypeRef.BOOLEAN;
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
        return TypeRef.VOID;
    }

    visitGroup(target: Group) : TypeRef
    {
        return this.dispatch(target.expr);
    }

    visitNullLiteral(target: NullLiteral) : TypeRef
    {
        return TypeRef.NULL;
    }

    visitLogicalExpr(target: LogicalExpr) : TypeRef
    {
        let left = this.dispatch(target.left);
        let right = this.dispatch(target.right);
        if (left != null && right != null)
        {
            if (!this.checkCompatibleTypes(left, right))
                throw this.error(target.location, 'Incompatible types for logical operator');
            return TypeRef.BOOLEAN;
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
                throw this.error(target.location, `Incompatible types for binary operator (${left} and ${right})`);
            if (left == TypeRef.STRING && target.oper != TokenType.PLUS)
                throw this.error(target.location, `The operator ${target.oper.lexeme} cannot be used on strings`);
            return left;
        }
        return null;
    }

    isAssignable( lhs : TypeRef, rhs : TypeRef )
    {
        if (!lhs || !rhs) return false;
        if (lhs == TypeRef.BOOLEAN || lhs == TypeRef.NUMBER)
            return lhs.qualified == rhs.qualified;
        if (lhs == TypeRef.VOID)
            return false;
        if (rhs == TypeRef.NULL)
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
            throw this.error(target.location, 'Incompatible types for assignment (' + left + ' and ' + right + ')');
        if (left == TypeRef.STRING && target.oper != TokenType.PLUS_EQUAL && target.oper != TokenType.EQUAL)
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
            return this.dispatch(target.values[0]);
        return TypeRef.ANY;
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
            return this.findMember(name, target.extended.ref);
        if (target.implemented)
        {
            for (let intf of target.implemented)
            {
                if (!intf.ref) continue;
                let result = this.findMember(name, intf.ref);
                if (result) return result;
            }
        }
        return null;
    }

    visitFieldExpr(target: FieldExpr) : TypeRef
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

    visitAccessor(target: Accessor) : TypeRef
    {
        return TypeRef.VOID;
    }

    visitBlockStmt(target: BlockStmt) : TypeRef {
        this.push();

        for (let stmt of target.stmts)
            this.dispatch(stmt);

        this.pop();
        return TypeRef.VOID;
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
        return TypeRef.VOID;
    }

    /**
     * Try to find a generic type in the current unit or in the import list.
     */
    findGeneric( name : string ) : ClassStmt
    {
        let stmt = this.unit.generics.get(name);
        if (stmt) return stmt;
        // TODO: validate the type of the imported symbol
        // TODO: make sure the imported symbol is a generic
        stmt = <ClassStmt> this.imports.get(name);
        if (stmt) return stmt;
        return null;
    }
/*
    applyTypes( type : TypeRef, args : Map<string, TypeRef> ) : TypeRef
    {
        let result = type.clone();
        for (let j = 0; j < result.generics.length; ++j)
        {
            let match = args.get(result.generics[j].qualified);
            if (match) result.generics[j] = match;
        }
        return result;
    }

    hashCode( value : string ) : number
    {
        return 0;
    }

    specializeGeneric( stmt : ClassStmt, params : TypeRef[] ) : TypeRef
    {
        if (!stmt.isGeneric) return;
        if (params.length != stmt.generics.length)
            throw this.error(stmt.location, `Incorrect number of generic arguments`);

        stmt = stmt.clone();

        // apply generics and resolve types for inherited classes/interfaces
        let args = new Map<string, TypeRef>();
        for (let i = 0; i < params.length; ++i)
            args.set(stmt.generics[i].canonical, params[i]);
        if (stmt.extended)
        {
            if (stmt.extended.isGeneric)
                stmt.extended = this.applyTypes(stmt.extended, args);
            stmt.extended = this.resolveType(stmt.extended);
        }
        if (stmt.implemented)
        {
            for (let i = 0; i < stmt.implemented.length; ++i)
            {
                if (stmt.implemented[i].isGeneric)
                    stmt.implemented[i] = this.applyTypes(stmt.implemented[i], args);
                stmt.implemented[i] = this.resolveType(stmt.implemented[i]);
            }
        }
        // remove generic types
        stmt.generics.length = 0;
        // generate a new name using generic types
        let hash = 1;
        for (let param of params)
        {
            hash = 37 * hash * this.hashCode(param.qualified);
        }


        // 1. clone class
        // 2.

        for (let subtype of stmt.


    }
*/

    resolveTypeByName( type : Name ) : ClassStmt
    {

        let name = type.qualified;

        if (name == 'number' || name == 'boolean' || name == 'void') return null;

        let clazz = this.unit.types.get(name);
        if (clazz) return clazz;

        let stmt = this.imports.get(name);
        if (stmt && stmt instanceof ClassStmt) return  stmt;

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

        if (name == 'number' || name == 'boolean' || name == 'void') return type;

        let clazz = this.unit.types.get(name);
        if (clazz)
        {
            type.ref = clazz;
            return type;
        }

        let stmt = this.imports.get(name);
        if (stmt && stmt instanceof ClassStmt)
        {
            type.ref = stmt;
            return type;
        }

        throw this.error(type.location, `Unknown type '${name}'`);
    }

    createArrayType( name : Name ) : ClassStmt
    {
        let length = new VariableStmt(new Name(['length']), TypeRef.NUMBER, null, false);
        return new ClassStmt(name, null, null, null, [length]);
    }

    visitTypeRef(target: TypeRef) : TypeRef
    {
        if (target.dims > 0)
        {
            target.name = new Name(['array_' + target.dims + '_'  + target.name.toString()]);
            target.dims = 0;
            if (this.resolveTypeByName(target.name) == null)
            {
                this.unit.types.set(target.name.toString(), this.createArrayType(target.name));
            }
        }
        return this.resolveType(target);
    }

    visitCaseStmt(target: CaseStmt) : TypeRef
    {
        this.dispatch(target.expr);
        for (let stmt of target.stmts) this.dispatch(stmt);

        return TypeRef.VOID;
    }

    visitSwitchStmt(target: SwitchStmt) : TypeRef
    {
        this.dispatch(target.expr);
        for (let stmt of target.cases) this.dispatch(stmt);
        return TypeRef.VOID;
    }

    visitIfStmt(target: IfStmt) : TypeRef
    {
        this.dispatch(target.condition);
        if (target.thenSide) this.dispatch(target.thenSide);
        if (target.elseSide) this.dispatch(target.elseSide);

        return TypeRef.VOID;
    }

    visitForOfStmt(target: ForOfStmt) : TypeRef
    {
        this.push();
        let type = this.dispatch(target.expr);
        target.variable.type = type;
        type = this.dispatch(target.variable);
        this.dispatch(target.expr);
        this.dispatch(target.stmt);
        this.pop();
        return TypeRef.VOID;
    }

    visitDoWhileStmt(target: DoWhileStmt) : TypeRef
    {
        this.dispatch(target.condition);
        this.dispatch(target.stmt);
        return TypeRef.VOID;
    }

    visitWhileStmt(target: WhileStmt) : TypeRef
    {
        this.dispatch(target.condition);
        this.dispatch(target.stmt);
        return TypeRef.VOID;
    }

    visitParameter(target: Parameter) : TypeRef
    {
        return TypeRef.VOID;
    }

    visitExpandExpr(target: ExpandExpr) : TypeRef
    {
        return TypeRef.VOID;
    }

    visitFunctionStmt(target: FunctionStmt) : TypeRef
    {
        if (target.isGeneric) return TypeRef.VOID;
        this.push();

        if (!target.type)
            target.type = TypeRef.VOID;
        else
            this.dispatch(target.type);

        for (let param of target.params)
        {
            this.dispatch(param.type);
            this.top().insert(param.name.canonical, param, param.type);
        }
        if (target.parent instanceof ClassStmt)
        {
            let type = new TypeRef(target.parent.name, null, 0, true);
            type.ref = target.parent;
            let variable = new VariableStmt(new Name(['this']), type, null, false);
            this.top().insert(variable.name.canonical, variable, type);

            type = new TypeRef(target.parent.extended.name, null, 0, true);
            type.ref = target.parent.extended.ref;
            variable = new VariableStmt(new Name(['super']), type, null, false);
            this.top().insert(variable.name.canonical, variable, type);
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
        return TypeRef.VOID;
    }

    visitExprStmt(target: ExprStmt) : TypeRef
    {
        return this.dispatch(target.expr);
    }

    visitBreakStmt(target: BreakStmt) : TypeRef {
        return TypeRef.VOID;
    }

    visitContinueStmt(target: ContinueStmt) : TypeRef
    {
        return TypeRef.VOID;
    }

    visitImportStmt(target: ImportStmt) : TypeRef
    {
        return TypeRef.VOID;
    }

    checkCompatibleTypes( type1 : TypeRef, type2 : TypeRef ) : boolean
    {
        if (type1 == TypeRef.BOOLEAN || type1 == TypeRef.NUMBER)
            return type2.qualified == type1.qualified;
        if (type1 == TypeRef.VOID || type2 == TypeRef.VOID)
            return false;
        if (type1 == TypeRef.NULL || type2 == TypeRef.NULL)
            return true;
        if (type1 == TypeRef.ANY || type2 == TypeRef.ANY)
            return true;
        return type1.qualified == type2.qualified;
    }

    visitVariableStmt(target: VariableStmt) : TypeRef
    {
        let result : TypeRef = null;
        if (target.type)
            result = this.dispatch(target.type);
        if (target.init)
        {
            let itype = this.dispatch(target.init);
            if (result && !this.isAssignable(result, itype))
                this.error(target.location, `Initialize incompatible with variable type (${result} and ${itype}`);

            if (!result) result = itype;
        }
        target.type = result;

        this.top().insert(target.name.toString(), target, result);
        if (!result) return TypeRef.VOID;
        return result;
    }

    visitTryCatchStmt(target: TryCatchStmt) : TypeRef
    {
        this.dispatch(target.block);
        this.dispatch(target.cblock);
        this.dispatch(target.fblock);
        return TypeRef.VOID;
    }

    visitThrowStmt(target: ThrowStmt) : TypeRef
    {
        this.dispatch(target.expr);
        return TypeRef.VOID;
    }

    visitUnit(target: Unit) : TypeRef
    {
        try {
            this.unit = target;
            this.processImports();
            for (let stmt of target.stmts) this.dispatch(stmt);
        } catch (error)
        {
            //this.ctx.listener.onError(error.location, error);
        }

        return TypeRef.VOID;
    }


}