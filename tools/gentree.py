#!/usr/bin/python

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
    sys.stdout.write('\taccept( visitor : Visitor ) : void\n\t{\n')
    sys.stdout.write('\t\tvisitor.visit' + name + '(this);\n')
    sys.stdout.write('\t}\n')

    # class name helper
    sys.stdout.write('\tclassName() : string\n\t{\n\t\treturn \'' + name + '\';\n\t}\n')

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


sys.stdout.write('namespace beagle.compiler {\n')

sys.stdout.write('''export interface IStmt
{
    accept( visitor : Visitor ) : void;
    className(): string;
}\n\n''')

sys.stdout.write('''export interface IExpr
{
    accept( visitor : Visitor ) : void;
    className(): string;
}\n\n''')

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
    ], 'IStmt')

printType('ClassStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'extended', 'type' : 'Name'},
    {'name' : 'implemented', 'type' : 'Name[]'},
    {'name' : 'variables', 'type' : 'VariableStmt[]'},
    {'name' : 'functions', 'type' : 'FunctionStmt[]'},
    ], 'IStmt')

printType('ExprStmt', [
    {'name' : 'expr', 'type' : 'IExpr'},
    ], 'IStmt');

printType('BreakStmt', [], 'IStmt');
printType('ContinueStmt', [], 'IStmt');

printType('VariableStmt', [
    {'name' : 'name', 'type' : 'Name'},
    {'name' : 'type', 'type' : 'TypeRef'},
    {'name' : 'init', 'type' : 'IExpr'},
    {'name' : 'constant', 'type' : 'boolean', 'init' : 'false'},
    {'name' : 'accessor', 'type' : 'Accessor', 'ctor' : False},
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

sys.stdout.write('}// namespace beagle.compiler\n')