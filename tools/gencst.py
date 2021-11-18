#!/usr/bin/python

#
# Copyright 2020-2021 Bruno Ribeiro
# <https://github.com/brunexgeek/jane>
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

#
# Generate the 'Code Syntax Tree' which is the tree representing the source code
# the way it was written. This tree can be converted back to the original source code,
# including comments.
#

import sys
import map
from genbasic import *

sys.stdout.write('''
/*
 *   Copyright 2021 Bruno Ribeiro
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

/*
 * AUTO-GENERATED CODE. DO NOT EDIT!
 */

import { TokenType } from './tokenizer';
import { SourceLocation } from './compiler';

export enum TypeId
{
    INVALID,
    VOID,
    NUMBER,
    BYTE,
    SHORT,
    INT,
    LONG,
    UBYTE,
    USHORT,
    UINT,
    ULONG,
    FLOAT,
    DOUBLE,
    STRING,
    BOOLEAN,
    CHAR,
    OBJECT
}

export interface INode
{
    accept( visitor : IVisitor ) : void;
    className(): string;
}

export interface IStmt extends INode { }

export interface IExpr extends INode {
    resolvedType() : TypeRef;
}

export abstract class Expr implements IExpr {
    resolvedType_ : TypeRef;
	resolvedType() : TypeRef { return this.resolvedType_; }
	abstract accept( visitor : IVisitor ) : void;
    abstract className(): string;
}

''')

printType('Name', [
    {'name' : 'lexemes', 'type' : 'string[]'}
    ], 'Expr', True)
sys.stdout.write('''\ttoString() : string { return this.lexemes.join('.'); }
    get canonical() : string { return this.lexemes[this.lexemes.length - 1]; }
    get qualified() : string { return this.toString(); }
    get context() : string { return this.lexemes.slice(1).join('.'); }
    append( name : Name ) { for (let s of name.lexemes) this.lexemes.push(s); }
    push( name : string ) { this.lexemes.push(name); }
    clone() : Name { return new Name([...this.lexemes], this.location); }
    get parent() : Name {
        let name = this.clone();
        name.lexemes.pop();
        return name;
    }
}
''')

printType('StringLiteral', [
    {'name' : 'value', 'type' : 'string'},
    {'name' : 'type', 'type' : 'TokenType'}
    ], 'Expr')

printType('TemplateStringExpr', [
    {'name' : 'value', 'type' : 'IExpr[]'}
    ], 'Expr')

printType('NumberLiteral', [
    {'name' : 'value', 'type' : 'string'}
    ], 'Expr')

printType('BoolLiteral', [
    {'name' : 'converted', 'type' : 'boolean'}
    ], 'Expr')

printType('NameLiteral', [{'name' : 'value', 'type' : 'string'}], 'Expr')

printType('Group', [{'name' : 'expr', 'type' : 'IExpr'}], 'Expr')

printType('NullLiteral', [], 'Expr')

printType('LogicalExpr', [
    {'name' : 'left', 'type' : 'IExpr'},
    {'name' : 'oper', 'type' : 'TokenType'},
    {'name' : 'right', 'type' : 'IExpr'}
    ], 'Expr')

printType('BinaryExpr', [
    {'name' : 'left', 'type' : 'IExpr'},
    {'name' : 'oper', 'type' : 'TokenType'},
    {'name' : 'right', 'type' : 'IExpr'}
    ], 'Expr')

printType('AssignExpr', [
    {'name' : 'left', 'type' : 'IExpr'},
    {'name' : 'oper', 'type' : 'TokenType'},
    {'name' : 'right', 'type' : 'IExpr'}
    ], 'Expr')

printType('UnaryExpr', [
    {'name' : 'oper', 'type' : 'TokenType'},
    {'name' : 'expr', 'type' : 'IExpr'},
    {'name' : 'post', 'type' : 'boolean'}
    ], 'Expr')

printType('TypeCastExpr', [
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'expr', 'type' : 'IExpr'}
    ], 'Expr')

printType('CallExpr', [
    {'name' : 'callee', 'type' : 'IExpr'},
    {'name' : 'args', 'type' : 'IExpr[]'}
    ], 'Expr')

printType('ArrayExpr', [
    {'name' : 'values', 'type' : 'IExpr[]'}
    ], 'Expr')

printType('ArrayAccessExpr', [
    {'name' : 'callee', 'type' : 'IExpr'},
    {'name' : 'index', 'type' : 'IExpr'}
    ], 'Expr')

printType('FieldExpr', [
    {'name' : 'callee', 'type' : 'IExpr'},
    {'name' : 'name', 'type' : 'Name'},
    ], 'Expr')

printType('NewExpr', [
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'args', 'type' : 'IExpr[]'}
    ], 'Expr')

printType('Accessor', [
    {'name' : 'values', 'type' : 'TokenType[]'}
    ], None, True)
sys.stdout.write('''get isStatic() : boolean { return this.values.indexOf(TokenType.STATIC) >= 0; }
}''')

printType('BlockStmt', [
    {'name' : 'stmts', 'type' : 'IStmt[]'}
    ], 'IStmt')

printType('ReturnStmt', [
    {'name' : 'expr', 'type' : 'IExpr'}
    ], 'IStmt')

printType('NamespaceStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'stmts', 'type' : 'IStmt[]'},
    {'name' : 'accessor', 'type' : 'Accessor', 'init' : 'null'},
    ], 'IStmt')

printType('TypeRef', [
    {'name' : 'tid', 'type' : 'TypeId'},
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'dims', 'type' : 'number'},
    {'name' : 'ref', 'type' : 'ClassStmt', 'init' : 'null', 'ctor' : False},
    ], None, True)
sys.stdout.write('''\ttoString() : string { return this.name.qualified; }
    get canonical() : string { return this.name.canonical; }
    get qualified() : string { return this.name.qualified; }
    get nullable() : boolean { return this.tid == TypeId.STRING || this.tid == TypeId.OBJECT; }
    static readonly VOID : TypeRef = new TypeRef(TypeId.VOID, new Name(['void']), 0);
    static readonly INVALID : TypeRef = new TypeRef(TypeId.INVALID, new Name(['invalid']), 0);
    isDerived( qname : string ) : boolean
    {
        if (this.ref && this.ref instanceof ClassStmt)
            return this.ref.isDerived(qname);
        return false;
    }
    private readonly PRIMITIVES : string[] = ['boolean','void','char','byte', 'short', 'int', 'long',
            'ubyte', 'ushort', 'uint', 'ulong', 'number', 'string', 'void'];
    isPrimitive() : boolean {
        return this.PRIMITIVES.indexOf(this.name.qualified) >= 0;
    }
}
''')

printType('CaseStmt', [
    {'name' : 'expr', 'type' : 'IExpr'},
    {'name' : 'stmts', 'type' : 'IStmt[]'},
    ], 'IStmt')

printType('SwitchStmt', [
    {'name' : 'expr', 'type' : 'IExpr'},
    {'name' : 'cases', 'type' : 'IStmt[]'},
    ], 'IStmt')

printType('IfStmt', [
    {'name' : 'condition', 'type' : 'IStmt'},
    {'name' : 'thenSide', 'type' : 'IStmt'},
    {'name' : 'elseSide', 'type' : 'IStmt'}
    ], 'IStmt')

printType('TernaryExpr', [
    {'name' : 'condition', 'type' : 'IExpr'},
    {'name' : 'thenSide', 'type' : 'IExpr'},
    {'name' : 'elseSide', 'type' : 'IExpr'}
    ], 'Expr')

printType('ForOfStmt', [
    {'name' : 'variable', 'type' : 'VariableStmt'},
    {'name' : 'expr', 'type' : 'IExpr'},
    {'name' : 'stmt', 'type' : 'IStmt'}
    ], 'IStmt')

printType('ForStmt', [
    {'name' : 'init', 'type' : 'IStmt'},
    {'name' : 'condition', 'type' : 'IExpr'},
    {'name' : 'fexpr', 'type' : 'IExpr'},
    {'name' : 'stmt', 'type' : 'IStmt'}
    ], 'IStmt')

printType('DoWhileStmt', [
    {'name' : 'stmt', 'type' : 'IStmt'},
    {'name' : 'condition', 'type' : 'IExpr'},
    ], 'IStmt')

printType('WhileStmt', [
    {'name' : 'condition', 'type' : 'IStmt'},
    {'name' : 'stmt', 'type' : 'IStmt'},
    ], 'IStmt')

printType('Parameter', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'init', 'type' : 'IExpr'},
    {'name' : 'vararg', 'type' : 'boolean'},
    ])


# TODO: rename to 'SpreadExpr'
printType('ExpandExpr', [
    {'name' : 'name', 'type' : 'Name'}
    ], 'Expr')

printType('FunctionStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'generics', 'type' : 'Name[]'},
    {'name' : 'params', 'type' : 'Parameter[]'},
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'body', 'type' : 'BlockStmt'},
    {'name' : 'accessor', 'type' : 'Accessor', 'init' : 'null'},
    {'name' : 'property', 'type' : 'TokenType', 'init' : 'null', 'ctor' : False},
    {'name' : 'unit', 'type' : 'Unit', 'init' : 'null', 'ctor' : False},
    {'name' : 'parent', 'type' : 'INode', 'init' : 'null', 'ctor' : False},
    ], 'IStmt', True)
sys.stdout.write('''
    toString(): string
    {
        let result = '';
        if (this.property == TokenType.SET)
            result += 'set ';
        else
        if (this.property == TokenType.GET)
            result += 'get ';
        result += `${this.name.toString()}(`;
        let first = true;
        for (let par of this.params)
        {
            if (!first) result += ',';
            first = false;
            if (par.vararg) result += '...';
            result += `${par.name.toString()}:${par.type.toString()}`;
        }
        result += `):${this.type.toString()}`;
        return result;
    }
    get isGeneric() : boolean { return this.generics && this.generics.length > 0; }
    get isStatic() : boolean { return this.accessor && this.accessor.isStatic; }
    get isAbstract() : boolean { return this.body == null; }
}
''')

printType('ClassStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'generics', 'type' : 'Name[]'},
    {'name' : 'extended', 'type' : 'TypeRef'},
    {'name' : 'implemented', 'type' : 'TypeRef[]'},
    {'name' : 'stmts', 'type' : 'IStmt[]'},
    {'name' : 'accessor', 'type' : 'Accessor', 'init' : 'null'},
    {'name' : 'isInterface', 'type' : 'boolean', 'init' : 'false', 'ctor' : False},
    {'name' : 'unit', 'type' : 'Unit', 'init' : 'null', 'ctor' : False, 'copy' : False},
    {'name' : 'parent', 'type' : 'Unit', 'init' : 'null', 'ctor' : False, 'copy' : False},
    ], 'IStmt', True)
sys.stdout.write('''toString() : string
    {
        let result = this.name.toString();
        if (this.extended) result += ` extends ${this.extended.toString()}`;
        if (this.implemented && this.implemented.length > 0)
        {
            result += ' implements ';
            let first = true;
            for (let type of this.implemented)
            {
                if (!first) result += ', ';
                first = false;
                result += type.toString();
            }
        }
        return result;
    }
    get isGeneric() : boolean { return this.generics && this.generics.length > 0; }
    isDerived( qname : string ) : boolean
    {
        if (this.extended && this.extended.name.qualified == qname)
            return true;
        for (let intf of this.implemented)
            if (intf.name.qualified == qname) return true;
        if (this.extended && this.extended.ref)
            return this.extended.ref.isDerived(qname);
        return false;
    }
}''')

printType('ExprStmt', [
    {'name' : 'expr', 'type' : 'IExpr'},
    ], 'IStmt');

printType('BreakStmt', [], 'IStmt');

printType('ContinueStmt', [], 'IStmt');

printType('ImportStmt', [
    {'name' : 'names', 'type' : 'Name[]'},
    {'name' : 'source', 'type' : 'string'}
    ], 'IStmt')

printType('VariableStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'init', 'type' : 'IExpr'},
    {'name' : 'constant', 'type' : 'boolean'},
    {'name' : 'accessor', 'type' : 'Accessor', 'init' : 'null'},
    {'name' : 'unit', 'type' : 'Unit', 'init' : 'null', 'ctor' : False},
    {'name' : 'parent', 'type' : 'INode', 'init' : 'null', 'ctor' : False},
    ], 'IStmt', True)
sys.stdout.write('''
    toString() : string
    {
        let result : string;
        if (this.constant) result = 'const '; else result = 'let ';
        result += this.name.toString();
        if (this.type) result += ` : ${this.type.toString()}`;
        return result;
    }
    get isStatic() : boolean { return this.accessor && this.accessor.isStatic; }
}
''')

printType('PropertyStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'init', 'type' : 'IExpr'},
    {'name' : 'accessor', 'type' : 'Accessor', 'init' : 'null'},
    ], 'IStmt', True)
sys.stdout.write('''
    toString() : string
    {
        let result = this.name.toString();
        if (this.type) result += ` : ${this.type.toString()}`;
        return result;
    }
    get isStatic() : boolean { return this.accessor && this.accessor.isStatic; }
}
''')

printType('TryCatchStmt', [
    {'name' : 'block', 'type' : 'IStmt'},
    {'name' : 'variable', 'type' : 'Name'},
    {'name' : 'cblock', 'type' : 'IStmt'},
    {'name' : 'fblock', 'type' : 'IStmt'}
    ], 'IStmt')

printType('ThrowStmt', [
    {'name' : 'expr', 'type' : 'IExpr'}
    ], 'IStmt')

printType('EnumStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'values', 'type' : 'Name[]'}
    ], 'IStmt')

map.createMap('StrIStmtMap', 'string', 'IStmt')
map.createMap('StrUnitMap', 'string', 'Unit')
map.createMap('StrVarMap', 'string', 'VariableStmt')
map.createMap('StrClassMap', 'string', 'ClassStmt')
map.createMap('StrFuncMap', 'string', 'FunctionStmt')
map.createMap('StrClassStmtMap', 'string', 'ClassStmt')

printType('Unit', [
    {'name' : 'fileName', 'type' : 'string', 'init' : '', 'ctor' : False},
    {'name' : 'stmts', 'type' : 'IStmt[]'},
    {'name' : 'imports', 'type' : 'ImportStmt[]'},
    {'name' : 'variables', 'type' : 'StrVarMap', 'init' : 'new StrVarMap()', 'ctor' : False},
    {'name' : 'types', 'type' : 'StrClassMap', 'init' : 'new StrClassMap()', 'ctor' : False},
    {'name' : 'generics', 'type' : 'StrClassMap', 'init' : 'new StrClassMap()', 'ctor' : False},
    {'name' : 'functions', 'type' : 'StrFuncMap', 'init' : 'new StrFuncMap()', 'ctor' : False},
    # map full qualified names to statements
    {'name' : 'imports_', 'type' : 'StrIStmtMap', 'init' : 'new StrIStmtMap()', 'ctor' : False}
    ])

printVisitor()

printDispatcher('TypeRef')
printDispatcher('void')
