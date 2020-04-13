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
    sys.stdout.write('\t\t}\n\t\tthrow Error(`Unable to dispatch an object of \'${node.className()}\'`);\n\t}\n}\n\n')


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
import { SourceLocation } from './compiler';

export interface INode
{
    accept( visitor : IVisitor ) : void;
    className(): string;
}

export interface IStmt extends INode { }

export interface IExpr extends INode { }

''')

printType('Name', [
    {'name' : 'lexemes', 'type' : 'string[]'}
    ], 'IExpr', True)
sys.stdout.write('''\ttoString() : string
    {
        let result = '';
        let first = true;
        for (let i of this.lexemes)
        {
            if (!first) result += '.';
            first = false;
            result += i;
        }
        return result;
    }
    get canonical() : string {
        if (this.lexemes.length > 0)
            return this.lexemes[ this.lexemes.length - 1 ];
        else
            return '';
    }
    get qualified() : string { return this.toString(); }
    append( name : Name ) {
        for (let s of name.lexemes) this.lexemes.push(s);
    }
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

printType('TypeCastExpr', [
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'expr', 'type' : 'IExpr'}
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
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'args', 'type' : 'IExpr[]'}
    ], 'IExpr')

printType('Accessor', [
    {'name' : 'values', 'type' : 'TokenType[]'}
    ], None, True)
sys.stdout.write('''isStatic() : boolean { return this.values.indexOf(TokenType.STATIC) >= 0; }
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
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'generics', 'type' : 'TypeRef[]'},
    {'name' : 'dims', 'type' : 'number'},
    {'name' : 'nullable', 'type' : 'boolean'},
    ], None, True)
sys.stdout.write('''\ttoString( qualified : boolean = true) : string
    {
        let result = '';
        if (qualified)
            result = this.name.qualified;
        else
            result = this.name.canonical;
        if (this.generics && this.generics.length > 0)
        {
            result += '<';
            let first = true;
            for (let i of this.generics)
            {
                if (!first) result += ',';
                first = false;
                result += i.toString(qualified);
            }
            result += '>';
            let i = this.dims;
            while (i-- > 0) result += '[]';
            return result;
        }
        //if (this.nullable) result += '?';
        return result;
    }
    get canonical() : string { return this.toString(false); }
    get qualified() : string { return this.toString(); }
    static readonly VOID = new TypeRef(new Name(['void']), null, 0, false);
    static readonly NUMBER = new TypeRef(new Name(['number']), null, 0, false);
    static readonly STRING = new TypeRef(new Name(['string']), null, 0, true);
    static readonly BOOLEAN = new TypeRef(new Name(['boolean']), null, 0, false);
    static readonly NULL = new TypeRef(new Name(['null']), null, 0, false);
    static readonly ANY = new TypeRef(new Name(['any']), null, 0, false);
    get isGeneric() : boolean { return this.generics && this.generics.length > 0; }
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

printType('ForOfStmt', [
    {'name' : 'variable', 'type' : 'VariableStmt'},
    {'name' : 'expr', 'type' : 'IExpr'},
    {'name' : 'stmt', 'type' : 'IStmt'}
    ], 'IExpr')

printType('ForStmt', [
    {'name' : 'init', 'type' : 'IStmt'},
    {'name' : 'condition', 'type' : 'IExpr'},
    {'name' : 'fexpr', 'type' : 'IExpr'},
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


# TODO: rename to 'SpreadExpr'
printType('ExpandExpr', [
    {'name' : 'name', 'type' : 'Name'}
    ], 'IExpr')

printType('FunctionStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'generics', 'type' : 'Name[]'},
    {'name' : 'params', 'type' : 'Parameter[]'},
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'body', 'type' : 'BlockStmt'},
    {'name' : 'accessor', 'type' : 'Accessor', 'init' : 'null'},
    {'name' : 'property', 'type' : 'TokenType', 'init' : 'null', 'ctor' : False},
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
}
''')

printType('ClassStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'generics', 'type' : 'Name[]'},
    {'name' : 'extended', 'type' : 'TypeRef'},
    {'name' : 'implemented', 'type' : 'TypeRef[]'},
    {'name' : 'stmts', 'type' : 'IStmt[]'},
    {'name' : 'accessor', 'type' : 'Accessor', 'init' : 'null'},
    {'name' : 'unit', 'type' : 'Unit', 'init' : 'null', 'ctor' : False, 'copy' : False},
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

map.createMap('StrUnitMap', 'string', 'Unit')
map.createMap('StrVarMap', 'string', 'VariableStmt')
map.createMap('StrClassMap', 'string', 'ClassStmt')
map.createMap('StrFuncMap', 'string', 'FunctionStmt')

printType('Unit', [
    {'name' : 'fileName', 'type' : 'string', 'init' : '', 'ctor' : False},
    {'name' : 'stmts', 'type' : 'IStmt[]'},
    {'name' : 'imports', 'type' : 'ImportStmt[]'},
    {'name' : 'variables', 'type' : 'StrVarMap', 'init' : 'new StrVarMap()', 'ctor' : False},
    {'name' : 'types', 'type' : 'StrClassMap', 'init' : 'new StrClassMap()', 'ctor' : False},
    {'name' : 'generics', 'type' : 'StrClassMap', 'init' : 'new StrClassMap()', 'ctor' : False},
    {'name' : 'functions', 'type' : 'StrFuncMap', 'init' : 'new StrFuncMap()', 'ctor' : False}
    ])

printVisitor()

printDispatcher('TypeRef')
printDispatcher('void')
