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

types = []

def printType(name, fields, parent = None, keep_open = False ):
    types.append(name)
    sys.stdout.write('export class ' + name)
    if parent == None: parent = 'INode';
    if parent.startswith('I'):
        sys.stdout.write(' implements ' + parent)
    else:
        sys.stdout.write(' extends ' + parent)
    sys.stdout.write('\n{\n')

    fields.append( {'name' : 'location', 'type' : 'SourceLocation', 'ctor' : True, 'init' : 'null'} )

    # fields
    for f in fields:
        sys.stdout.write('\t' + f['name'] + ' : ' + f['type'])
        if 'init' in f and ('ctor' in f and f['ctor'] == False):
            sys.stdout.write(' = ')
            if f['type'] == 'string':
                sys.stdout.write('\'' + f['init'] + '\'')
            else:
                sys.stdout.write(f['init'])
        sys.stdout.write(';\n')

    # constructor
    first = True;
    hasSuper = False;
    sys.stdout.write('\tconstructor( ')
    for f in fields:
        if 'super' in f and f['super'] == True: hasSuper = True
        if 'ctor' in f and f['ctor'] == False: continue
        if not first: sys.stdout.write(', ')
        first = False
        sys.stdout.write(f['name'] + ' : ' + f['type'])
        if 'init' in f:
            sys.stdout.write(' = ')
            if f['type'] == 'string':
                sys.stdout.write('\'' + f['init'] + '\'')
            else:
                sys.stdout.write(f['init'])
    sys.stdout.write(' )\n\t{\n')
    if hasSuper:
        sys.stdout.write('\t\tsuper(')
        first = True
        for f in fields:
            if not 'super' in f or f['super'] == False: continue
            if not first: sys.stdout.write(',')
            first = False
            sys.stdout.write(f['name'])
        sys.stdout.write(')\n')
    else:
        if not parent.startswith('I'):
            sys.stdout.write('\t\tsuper();\n')
    for f in fields:
        if 'super' in f and f['super'] == True: continue
        if 'ctor' in f and f['ctor'] == False: continue
        sys.stdout.write('\t\tthis.' + f['name'] + ' = ' + f['name'] + ';\n')

    # clone()
    #sys.stdout.write('\t\tclone() : ' + name + ' {\n');
    #for f in fields:
    #    if 'copy' in f and f['copy'] == False: continue
    #    sys.stdout.write('\t\tthis.' + f['name'] + ' = ' + f['name'] + ';\n')
    #sys.stdout.write('\t\t}\n');

    sys.stdout.write('\t}\n')

    # visitor caller
    sys.stdout.write('\taccept( visitor : IVisitor ) : void { visitor.visit' + name + '(this); }\n')

    # class name helper
    sys.stdout.write('\tclassName() : string { return \'' + name + '\'; }\n')

    if (not keep_open): sys.stdout.write('}\n\n')

def printVisitor():
    # interface
    sys.stdout.write('''export interface IVisitor {\n''')
    for t in types:
        sys.stdout.write('\tvisit' + t + '( target : ' + t + ') : void;\n')
    sys.stdout.write('}\n\n')

    # class
    sys.stdout.write('''export class Visitor implements IVisitor {\n''')
    for t in types:
        sys.stdout.write('\tvisit' + t + '( target : ' + t + ') : void {}\n')
    sys.stdout.write('}\n\n')

def printDispatcher(type):
    name = type[0].upper() + type[1:];
    sys.stdout.write('export abstract class Dispatcher' + name + ' {\n')
    for t in types:
        sys.stdout.write('\tprotected abstract visit' + t + '( target : ' + t + ') : ' + type + ';\n')
    sys.stdout.write('\tprotected dispatch( node : INode ) : ' + type + ' {\n\t\tif (!node) return;\n\t\tswitch (node.className()) {\n')
    for t in types:
        sys.stdout.write('\t\t\tcase \'' + t + '\': return this.visit' + t + '(<' + t + '>node);\n')
    sys.stdout.write('\t\t}\n\t\tthrow new Error(`Unable to dispatch an object of \'${node.className()}\'`);\n\t}\n}\n\n')

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

printType('ChainingExpr', [
    {'name' : 'callee', 'type' : 'IExpr'},
    {'name' : 'name', 'type' : 'Name'},
    ], 'Expr')

printType('OptChainingExpr', [
    {'name' : 'callee', 'type' : 'IExpr'},
    {'name' : 'name', 'type' : 'Name'},
    ], 'Expr')

printType('NewExpr', [
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'args', 'type' : 'IExpr[]'}
    ], 'Expr')

printType('Modifier', [
    {'name' : 'values', 'type' : 'TokenType[]'}
    ], None, True)
sys.stdout.write('''get isStatic() : boolean { return this.values && this.values.indexOf(TokenType.STATIC) >= 0; }
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
    {'name' : 'modifier', 'type' : 'Modifier', 'init' : 'null'},
    ], 'IStmt')

printType('TypeRef', [
    {'name' : 'tid', 'type' : 'TypeId'},
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'dims', 'type' : 'number'},
    {'name' : 'ref', 'type' : 'IStmt', 'init' : 'null', 'ctor' : False},
    ], None, True)
sys.stdout.write('''\ttoString() : string {
        let tname = this.name.qualified;
        for (let i = 0; i < this.dims; ++i) tname += '[]';
        return tname;
    }
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
            'ubyte', 'ushort', 'uint', 'ulong', 'float', 'double', 'number', 'string', 'void'];
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
    {'name' : 'params', 'type' : 'Parameter[]'},
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'body', 'type' : 'BlockStmt'},
    {'name' : 'modifier', 'type' : 'Modifier', 'init' : 'null'},
    {'name' : 'accessor', 'type' : 'TokenType', 'init' : 'null', 'ctor' : False},
    {'name' : 'unit', 'type' : 'Unit', 'init' : 'null', 'ctor' : False},
    {'name' : 'parent', 'type' : 'INode', 'init' : 'null', 'ctor' : False},
    ], 'IStmt', True)
sys.stdout.write('''
    toString(): string
    {
        let result = '';
        if (this.accessor == TokenType.SET)
            result += 'set ';
        else
        if (this.accessor == TokenType.GET)
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
    get isStatic() : boolean { return this.modifier && this.modifier.isStatic; }
    get isAbstract() : boolean { return this.body == null; }
}
''')

printType('ClassStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'extended', 'type' : 'TypeRef'},
    {'name' : 'implemented', 'type' : 'TypeRef[]'},
    {'name' : 'stmts', 'type' : 'IStmt[]'},
    {'name' : 'modifier', 'type' : 'Modifier', 'init' : 'null'},
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
    isDerived( qname : string ) : boolean
    {
        if (this.extended && this.extended.name.qualified == qname)
            return true;
        for (let intf of this.implemented)
            if (intf.name.qualified == qname) return true;
        if (this.extended && this.extended.ref && this.extended.ref instanceof ClassStmt)
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

printType('VariableDecl', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'init', 'type' : 'IExpr'},
    {'name' : 'constant', 'type' : 'boolean'},
    {'name' : 'modifier', 'type' : 'Modifier', 'init' : 'null'},
    {'name' : 'unit', 'type' : 'Unit', 'init' : 'null', 'ctor' : False},
    {'name' : 'parent', 'type' : 'INode', 'init' : 'null', 'ctor' : False},
    ], 'IStmt', True)
sys.stdout.write('''
    toString() {
        return `${this.constant ? 'const' : 'let'} ${this.name.canonical} : ${this.type.toString()};`;
    }
}''')

printType('VariableStmt', [
    {'name' : 'decls', 'type' : 'VariableDecl[]'},
    ], 'IStmt', True)
sys.stdout.write('''
    set parent( ref : INode ) {
        for (let decl of this.decls) decl.parent = ref;
    }
}''')

printType('PropertyStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'init', 'type' : 'IExpr'},
    {'name' : 'modifier', 'type' : 'Modifier', 'init' : 'null'},
    ], 'IStmt', True)
sys.stdout.write('''
    toString() : string
    {
        let result = this.name.toString();
        if (this.type) result += ` : ${this.type.toString()}`;
        return result;
    }
    get isStatic() : boolean { return this.modifier && this.modifier.isStatic; }
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

printType('EnumDecl', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'init', 'type' : 'IExpr'}
    ], None)

printType('EnumStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'values', 'type' : 'EnumDecl[]'}
    ], 'IStmt')

map.createMap('StrIStmtMap', 'string', 'IStmt')
map.createMap('StrUnitMap', 'string', 'Unit')
map.createMap('StrVarMap', 'string', 'VariableDecl')
map.createMap('StrClassMap', 'string', 'ClassStmt')
map.createMap('StrFuncMap', 'string', 'FunctionStmt')
map.createMap('StrEnumMap', 'string', 'EnumStmt')
map.createMap('StrClassStmtMap', 'string', 'ClassStmt')

printType('Unit', [
    {'name' : 'fileName', 'type' : 'string', 'init' : '', 'ctor' : False},
    {'name' : 'stmts', 'type' : 'IStmt[]'},
    {'name' : 'imports', 'type' : 'ImportStmt[]'},
    {'name' : 'variables', 'type' : 'StrVarMap', 'init' : 'new StrVarMap()', 'ctor' : False},
    {'name' : 'types', 'type' : 'StrClassMap', 'init' : 'new StrClassMap()', 'ctor' : False},
    {'name' : 'functions', 'type' : 'StrFuncMap', 'init' : 'new StrFuncMap()', 'ctor' : False},
    {'name' : 'enums', 'type' : 'StrEnumMap', 'init' : 'new StrEnumMap()', 'ctor' : False},
    # map full qualified names to statements
    {'name' : 'imports_', 'type' : 'StrIStmtMap', 'init' : 'new StrIStmtMap()', 'ctor' : False}
    ])

printVisitor()

printDispatcher('TypeRef')
printDispatcher('void')
