#!/usr/bin/python

#
# Copyright 2020 Bruno Ribeiro
# <https://github.com/brunexgeek/beagle-lang>
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

import sys;

types = []

def printType(name, fields, parent = None):
    types.append(name)
    sys.stdout.write('export class ' + name)
    if parent != None: sys.stdout.write(' implements ' + parent)
    sys.stdout.write('\n{\n')

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
    sys.stdout.write('\tconstructor( ')
    for f in fields:
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
    for f in fields:
        if 'ctor' in f and f['ctor'] == False: continue
        sys.stdout.write('\t\tthis.' + f['name'] + ' = ' + f['name'] + ';\n')
    sys.stdout.write('\t}\n')

    # visitor caller
    sys.stdout.write('\taccept( visitor : Visitor ) : void { visitor.visit' + name + '(this); }\n')

    # class name helper
    sys.stdout.write('\tclassName() : string { return \'' + name + '\'; }\n')

    sys.stdout.write('}\n\n')

def printVisitor():
    # interface
    sys.stdout.write('''export interface IVisitor{\n''')
    for t in types:
        sys.stdout.write('\tvisit' + t + '( target : ' + t + ') : void;\n')
    sys.stdout.write('}\n\n')

    # class
    sys.stdout.write('''export class Visitor implements IVisitor {\n''')
    for t in types:
        sys.stdout.write('\tvisit' + t + '( target : ' + t + ') : void {}\n')
    sys.stdout.write('}\n\n')

sys.stdout.write('''
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

/*
 * AUTO-GENERATED CODE. DO NOT EDIT!
 */

import { TokenType } from './tokenizer';

export interface IStmt
{
    accept( visitor : Visitor ) : void;
    className(): string;
}

export interface IExpr
{
    accept( visitor : Visitor ) : void;
    className(): string;
}

''')

printType('Name', [{'name' : 'lexemes', 'type' : 'string[]'}], 'IExpr')

printType('StringLiteral', [
    {'name' : 'value', 'type' : 'string'},
    {'name' : 'type', 'type' : 'TokenType'}
    ], 'IExpr')

printType('NumberLiteral', [
    {'name' : 'value', 'type' : 'string'},
    {'name' : 'converted', 'type' : 'number'}
    ], 'IExpr')

printType('BoolLiteral', [
    {'name' : 'converted', 'type' : 'boolean'}
    ], 'IExpr')

printType('NameLiteral', [{'name' : 'value', 'type' : 'string'}], 'IExpr')

printType('Group', [{'name' : 'expr', 'type' : 'IExpr'}], 'IExpr')

printType('NullLiteral', [], 'IExpr')

printType('LogicalExpr', [
    {'name' : 'left', 'type' : 'IExpr'},
    {'name' : 'oper', 'type' : 'TokenType'},
    {'name' : 'right', 'type' : 'IExpr'}
    ], 'IExpr')

printType('BinaryExpr', [
    {'name' : 'left', 'type' : 'IExpr'},
    {'name' : 'oper', 'type' : 'TokenType'},
    {'name' : 'right', 'type' : 'IExpr'}
    ], 'IExpr')

printType('AssignExpr', [
    {'name' : 'left', 'type' : 'IExpr'},
    {'name' : 'oper', 'type' : 'TokenType'},
    {'name' : 'right', 'type' : 'IExpr'}
    ], 'IExpr')

printType('UnaryExpr', [
    {'name' : 'oper', 'type' : 'TokenType'},
    {'name' : 'expr', 'type' : 'IExpr'},
    {'name' : 'post', 'type' : 'boolean'}
    ], 'IExpr')

printType('CallExpr', [
    {'name' : 'callee', 'type' : 'IExpr'},
    {'name' : 'args', 'type' : 'IExpr[]'}
    ], 'IExpr')

printType('ArrayExpr', [
    {'name' : 'values', 'type' : 'IExpr[]'}
    ], 'IExpr')

printType('ArrayAccessExpr', [
    {'name' : 'callee', 'type' : 'IExpr'},
    {'name' : 'index', 'type' : 'IExpr'}
    ], 'IExpr')

printType('FieldExpr', [
    {'name' : 'callee', 'type' : 'IExpr'},
    {'name' : 'name', 'type' : 'Name'},
    ], 'IExpr')

printType('NewExpr', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'args', 'type' : 'IExpr[]'}
    ], 'IExpr')

printType('Accessor', [
    {'name' : 'values', 'type' : 'TokenType[]'}
    ])

printType('BlockStmt', [{'name' : 'stmts', 'type' : 'IStmt[]'}], 'IStmt')

printType('ReturnStmt', [{'name' : 'expr', 'type' : 'IExpr'}], 'IStmt')

printType('NamespaceStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'stmts', 'type' : 'IStmt[]'}
    ], 'IStmt')

printType('TypeRef', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'dims', 'type' : 'number'},
    {'name' : 'uid', 'type' : 'string', 'init' : '', 'ctor' : False},
    ])

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

printType('ForOfStmt', [
    {'name' : 'variable', 'type' : 'VariableStmt'},
    {'name' : 'expr', 'type' : 'IExpr'},
    {'name' : 'stmt', 'type' : 'IStmt'}
    ], 'IExpr')

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

printType('ExpandExpr', [
    {'name' : 'name', 'type' : 'Name'}
    ], 'IExpr')

printType('FunctionStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'params', 'type' : 'Parameter[]'},
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'body', 'type' : 'BlockStmt'},
    {'name' : 'accessor', 'type' : 'Accessor', 'init' : 'null', 'ctor' : False},
    {'name' : 'property', 'type' : 'TokenType', 'init' : 'null', 'ctor' : False},
    {'name' : 'uid', 'type' : 'string', 'init' : '', 'ctor' : False},
    ], 'IStmt')

printType('ClassStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'extended', 'type' : 'Name'},
    {'name' : 'implemented', 'type' : 'Name[]'},
    {'name' : 'stmts', 'type' : 'IStmt[]'},
    {'name' : 'uid', 'type' : 'string', 'init' : '', 'ctor' : False},
    ], 'IStmt')

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
    {'name' : 'constant', 'type' : 'boolean', 'init' : 'false'},
    {'name' : 'accessor', 'type' : 'Accessor', 'ctor' : False},
    {'name' : 'uid', 'type' : 'string', 'init' : '', 'ctor' : False},
    ], 'IStmt')

printType('TryCatchStmt', [
    {'name' : 'block', 'type' : 'IStmt'},
    {'name' : 'variable', 'type' : 'Name'},
    {'name' : 'cblock', 'type' : 'IStmt'},
    {'name' : 'fblock', 'type' : 'IStmt'}
    ], 'IStmt')

printType('ThrowStmt', [
    {'name' : 'expr', 'type' : 'IExpr'}
    ], 'IStmt')

printType('Unit', [{'name' : 'stmts', 'type' : 'IStmt[]'}])

printVisitor()
