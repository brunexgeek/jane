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
        Logger.writeln(`Adding '${name}' -> ${target.className()}`);
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

export function findSymbol( unit : Unit, name : string ) : IStmt
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

    visitTypeCastExpr(target: TypeCastExpr): TypeRef
    {
        throw new Error("Method not implemented.");
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
                let stmt = findSymbol(unit, name.qualified);
                if (!stmt) this.error(name.location, `Unable to find symbol ${name.qualified}`);
                this.imports.set(name.qualified, stmt);
            }
        }
    }

    visitForStmt(target: ForStmt): TypeRef {
        return null;
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
        if (entry)
            Logger.writeln(`Found '${name}' (${this.stack.length} scopes)`);
        else
            Logger.writeln(`Missing '${name}'  (${this.stack.length} scopes)`);
        return entry;
    }

    visitName(target: Name) : TypeRef {
        return null;
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
            this.error(target.location, `Cannot find name '${target.value}'`);
        else
            return entry.type;
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
        /*
        let left = this.dispatch(target.left);
        let right = this.dispatch(target.right);
        if (!this.checkCompatibleTypes(left, right))
            throw this.error(target.location, 'Incompatible types for logical operator');
        return TypeRef.BOOLEAN;
        */
        return null;
    }

    visitBinaryExpr(target: BinaryExpr) : TypeRef
    {
        /*
        let left = this.dispatch(target.left);
        let right = this.dispatch(target.right);
        if (!this.checkCompatibleTypes(left, right))
            this.error(target.location, `Incompatible types for binary operator (${left} and ${right})`);
        if (left == TypeRef.STRING && target.oper != TokenType.PLUS)
            this.error(target.location, `The operator ${target.oper.lexeme} cannot be used on strings`);
        return left;
        */
        return null;
    }

    visitAssignExpr(target: AssignExpr) : TypeRef
    {
        /*let left = this.dispatch(target.left);
        let right = this.dispatch(target.right);
        if (left != right)
            throw this.error(target.location, 'Incompatible types for logical operator');
        if (left == TypeRef.STRING && target.oper != TokenType.PLUS_EQUAL && target.oper != TokenType.EQUAL)
            throw this.error(target.location, `The operator ${target.oper.lexeme} cannot be used on strings`);
        return left;*/
        return null;
    }

    visitUnaryExpr(target: UnaryExpr) : TypeRef
    {
        return this.dispatch(target.expr);
    }

    visitCallExpr(target: CallExpr) : TypeRef
    {
        return this.dispatch(target.callee);
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

    visitFieldExpr(target: FieldExpr) : TypeRef
    {
        let type = this.dispatch(target.callee);
        return null;
    }

    visitNewExpr(target: NewExpr) : TypeRef
    {
        return target.type = this.dispatch(target.type);
    }

    visitAccessor(target: Accessor) : TypeRef
    {
        return null;
    }

    visitBlockStmt(target: BlockStmt) : TypeRef {
        this.push();

        for (let stmt of target.stmts)
            this.dispatch(stmt);

        this.pop();
        return null;
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
        return null;
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
    resolveType( type : TypeRef ) : TypeRef
    {
        /*if (type.isGeneric)
        {
            let generic = this.findGeneric(type.name.qualified);
            if (!generic) throw this.error(type.location, `Unknown generic type '${type.name.qualified}'`);
            this.specializeGeneric(generic, type.generics);
        }*/

        let name = type.qualified;

        if (name == 'string' || name == 'number' || name == 'boolean' || name == 'void') return type;
        if (this.unit.types.has(name)) return type;
        if (this.imports.has(name)) return type;
        throw this.error(type.location, `Unknown type '${name}'`);
    }

    visitTypeRef(target: TypeRef) : TypeRef
    {
        return this.resolveType(target);
    }

    visitCaseStmt(target: CaseStmt) : TypeRef
    {
        this.dispatch(target.expr);
        for (let stmt of target.stmts) this.dispatch(stmt);

        return null;
    }

    visitSwitchStmt(target: SwitchStmt) : TypeRef
    {
        this.dispatch(target.expr);
        for (let stmt of target.cases) this.dispatch(stmt);
        return null;
    }

    visitIfStmt(target: IfStmt) : TypeRef
    {
        this.dispatch(target.condition);
        if (target.thenSide) this.dispatch(target.thenSide);
        if (target.elseSide) this.dispatch(target.elseSide);

        return null;
    }

    visitForOfStmt(target: ForOfStmt) : TypeRef
    {
        this.dispatch(target.expr);
        this.dispatch(target.stmt);
        return null;
    }

    visitDoWhileStmt(target: DoWhileStmt) : TypeRef
    {
        this.dispatch(target.condition);
        this.dispatch(target.stmt);
        return null;
    }

    visitWhileStmt(target: WhileStmt) : TypeRef
    {
        this.dispatch(target.condition);
        this.dispatch(target.stmt);
        return null;
    }

    visitParameter(target: Parameter) : TypeRef
    {
        return null;
    }

    visitExpandExpr(target: ExpandExpr) : TypeRef
    {
        return null;
    }

    visitFunctionStmt(target: FunctionStmt) : TypeRef
    {
        if (target.isGeneric) return null;
        this.push();

        if (!target.type)
            target.type = TypeRef.VOID;
        else
            this.dispatch(target.type);

        for (let param of target.params)
        {
            this.dispatch(param.type);
            this.top().insert(param.name.toString(), param, param.type);
        }
        if (target.parent instanceof ClassStmt)
        {
            let type = new TypeRef(target.name, null, 0, true);
            let self = new VariableStmt(new Name(['this']), type, null, false);
            this.top().insert('this', self, type);
        }

        if (target.body) this.dispatch(target.body);

        this.pop();

        return target.type;
    }

    visitClassStmt(target: ClassStmt) : TypeRef
    {
        this.push();

        for (let stmt of target.stmts)
            this.dispatch(stmt);

        this.pop();
        return null;
    }

    visitExprStmt(target: ExprStmt) : TypeRef
    {
        return this.dispatch(target.expr);
    }

    visitBreakStmt(target: BreakStmt) : TypeRef {
        return null;
    }

    visitContinueStmt(target: ContinueStmt) : TypeRef
    {
        return null;
    }

    visitImportStmt(target: ImportStmt) : TypeRef
    {
        return null;
    }

    checkCompatibleTypes( type1 : TypeRef, type2 : TypeRef ) : boolean
    {
        if (type1 == TypeRef.BOOLEAN || type1 == TypeRef.NUMBER)
            return type2.toString() == type1.toString();
        if (type1 == TypeRef.STRING || type2 == TypeRef.NULL)
            return true;
        if (type1 == TypeRef.ANY || type2 == TypeRef.ANY)
            return true;
        return type2.toString() == type1.toString();
    }

    visitVariableStmt(target: VariableStmt) : TypeRef
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

    visitTryCatchStmt(target: TryCatchStmt) : TypeRef
    {
        this.dispatch(target.block);
        this.dispatch(target.cblock);
        this.dispatch(target.fblock);
        return null;
    }

    visitThrowStmt(target: ThrowStmt) : TypeRef
    {
        this.dispatch(target.expr);
        return null;
    }

    visitUnit(target: Unit) : TypeRef
    {
        try {
            this.unit = target;
            this.processImports();
            for (let stmt of target.stmts) this.dispatch(stmt);
        } catch (error)
        {
            this.ctx.listener.onError(error.location, error);
        }

        return null;
    }


}