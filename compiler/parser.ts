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
    ForStmt,
    DispatcherTypeRef,
    TypeCastExpr,
    PropertyStmt} from './types';

import {
    TokenType,
    Tokenizer,
    Token } from './tokenizer';

import {
    SourceLocation,
    CompilationContext } from './compiler';

import { Logger } from './utils';

export class ParseError extends Error
{
    public location : SourceLocation;

    constructor( message : string, location : SourceLocation )
    {
        super(`${message} at ${location.toString()}`);
        this.location = location;
    }
}

export class Parser
{
    private tok : Tokenizer;
    private ctx : CompilationContext;
    private stack : Token[] = [];
    private previous : Token = null;
    private unit : Unit = null;
    private hasError = false;
    private hasAborted = false;

    constructor( tok : Tokenizer, ctx : CompilationContext )
    {
        this.tok = tok;
        this.ctx = ctx;
        this.unit = new Unit([], []);
        this.unit.fileName = tok.scanner.pos.fileName;
    }

    peek() : Token
    {
        if (this.stack.length == 0)
        {
            this.stack.push(this.tok.next());
            //if (this.stack[0].type == TokenType.NAME)
            //    Logger.writeln('--- ' + this.stack[0].toString());
        }
        return this.stack[this.stack.length - 1];
    }

    peekType() : TokenType
    {
        return this.peek().type;
    }

    unget()
    {
        if (this.previous == null) throw this.error(null, "Not previous token");
        this.stack.push(this.previous);
        this.previous = null;
    }

    check( ...types : TokenType[] ) : boolean
    {
        let cur = this.peekType();
        for (let type of types)
            if (cur == type) return true;
        return false;
    }

    advance() : Token
    {
        this.previous = this.peek();
        this.stack.pop();
        return this.previous;
    }

    consume( ...types : TokenType[] ) : Token
    {
        return this.consumeEx(null, ...types);
    }

    consumeEx( message : string, ...types : TokenType[] ) : Token
    {
        for (let tt of types)
        {
            if (this.peekType() == tt)
            {
                let tt = this.peek();
                this.advance();
                return tt;
            }
        }

        let found = this.peekType().lexeme;
        if (this.peekType() == TokenType.NAME) found = this.peek().lexeme;

        if (message && message.length > 0)
            throw this.error(this.peek().location, message);

        let names = '';
        let first = true;
        for (let tt of types)
        {
            if (!first) names += ' or ';
            first = false;
            names += `'${tt.lexeme}'`;
        }
        throw this.error(this.peek().location, `Expected ${names}, but found '${found}'`);
    }

    match( ...type : TokenType[] ) : boolean
    {
        for (let t of type)
        {
            if (this.peekType() == t)
            {
                this.advance();
                return true;
            }
        }
        return false;
    }

    eof() : boolean
    {
        return this.peekType() == TokenType.EOF;
    }

    error( location : SourceLocation, message : string ) : ParseError
    {
        let result = new ParseError(message, location);
        this.hasAborted = !this.ctx.listener.onError(location, result);
        if (this.hasAborted) throw result;
        return result;
    }

    synchronize()
    {
        let prev = this.advance();

        while (this.peekType() != TokenType.EOF)
        {
            //if (prev.type == TokenType.SEMICOLON) return;

           switch (this.peekType())
            {
                case TokenType.NAMESPACE:
                case TokenType.EXPORT:
                case TokenType.FUNCTION:
                case TokenType.CLASS:
                case TokenType.LET:
                    return;
            }

            prev = this.advance();
        }
    }

    parse() : Unit
    {
        let stmts : IStmt[] = [];
        let imports : ImportStmt[] = [];

        do {
            try
            {
                if (this.peekType() == TokenType.IMPORT)
                {
                    let result = this.parseImport();
                    stmts.push(result);
                    imports.push(result);
                }
                else
                    stmts.push( this.parseNamespaceOrDeclaration() );
            } catch (error)
            {
                Logger.writeln(error.toString());
                Logger.writeln(error.stack);
                this.hasError = true;
                if (this.hasAborted) return null;
                this.synchronize();
            }
        } while (this.peekType() != TokenType.EOF);

        if (!this.hasError)
        {
            this.unit.imports = imports;
            this.unit.stmts = stmts;

            for (let stmt of this.unit.generics.values())
                stmt.parent = this.unit;
            for (let stmt of this.unit.types.values())
                stmt.parent = this.unit;
            for (let stmt of this.unit.functions.values())
                stmt.parent = this.unit;
            for (let stmt of this.unit.variables.values())
                stmt.parent = this.unit;

            return this.unit;
        }
        else
            return null;
    }

    parseImport() : ImportStmt
    {
        let location = this.consume(TokenType.IMPORT).location;
        this.consume(TokenType.LEFT_BRACE);

        let names : Name[] = [];
        do {
            names.push( this.parseName() );
        } while (this.match(TokenType.COMMA));

        this.consume(TokenType.RIGHT_BRACE);
        this.consume(TokenType.FROM);

        let tt = this.peek();
        if (tt.type != TokenType.SSTRING && tt.type != TokenType.DSTRING && tt.type != TokenType.TSTRING)
            throw this.error(tt.location, 'String literal expected');
        this.advance();
        this.consume(TokenType.SEMICOLON);

        let result = new ImportStmt(names, tt.lexeme);
        result.location = location;
        return result;
    }

    parseCaseStmt() : IStmt
    {
        let type = this.consume(TokenType.CASE, TokenType.DEFAULT).type;
        let expr : IExpr = null;
        if (type == TokenType.CASE) expr = this.parseExpression();
        this.consume(TokenType.COLON);

        let stmts : IStmt[] = [];
        while (this.peekType() != TokenType.RIGHT_BRACE && this.peekType() != TokenType.CASE && this.peekType() != TokenType.DEFAULT)
        {
            let stmt = this.parseBlockOrStmt();
            stmts.push(stmt);
            if (stmt instanceof BlockStmt) break;
        }

        return new CaseStmt(expr, stmts);
    }

    parseSwitchStmt() : IStmt
    {
        this.consume(TokenType.SWITCH);
        this.consume(TokenType.LEFT_PAREN);
        let expr = this.parseExpression();
        this.consume(TokenType.RIGHT_PAREN);

        this.consume(TokenType.LEFT_BRACE);
        let stmts : IStmt[] = [];
        while (this.peekType() != TokenType.RIGHT_BRACE)
            stmts.push(this.parseCaseStmt());
        this.consume(TokenType.RIGHT_BRACE);

        return new SwitchStmt(expr, stmts);
    }

    parseNamespaceOrDeclaration()
    {
        let accessor = this.parseAccessor();

        if (this.peekType() == TokenType.NAMESPACE)
            return this.parseNamespace(accessor);
        else
            return this.parseDeclationStmt(accessor);
    }

    parseNamespace( accessor : Accessor ) : IStmt
    {
        let stmts : IStmt[] = [];
        let location = this.consume(TokenType.NAMESPACE).location;
        let name = this.parseName(true);
        this.ctx.namespaceStack.push(name);
        this.consume(TokenType.LEFT_BRACE);

        do {
            try {
                stmts.push( this.parseNamespaceOrDeclaration() );
            } catch (error)
            {
                Logger.writeln(error.toString());
                Logger.writeln(error.stack);
                this.hasError = true;
                if (this.hasAborted) throw error;
                this.synchronize();
            }
        } while (!this.match(TokenType.RIGHT_BRACE));

        this.ctx.namespaceStack.pop();

        return new NamespaceStmt(name, stmts, accessor, location);
    }

    parseArgument() : Parameter
    {
        let vararg = this.match(TokenType.DOT_DOT_DOT);

        let name = this.consumeEx('Missing argument name', TokenType.NAME);
        let type : TypeRef = null;
        let value : IExpr = null;
        if (this.peekType() == TokenType.COLON)
        {
            this.advance();
            type = this.parseTypeRef();
        }
        if (this.peekType() == TokenType.EQUAL)
        {
            this.advance();
            value = this.parseExpression();
        }

        if (type == null && value == null)
        {
            throw this.error(name.location, 'Missing argument type');
        }

        return new Parameter( new Name([name.lexeme]), type, value, vararg, name.location);
    }

    parseGenerics() : Name[]
    {
        let generics : Name[] = [];
        if (this.match(TokenType.LESS))
        {
            do {
                generics.push( this.parseName() );
            } while (this.match(TokenType.COMMA));
            this.consume(TokenType.GREATER);
        }
        return generics;
    }

    parseFunction( accessor : Accessor ) : FunctionStmt
    {
        this.consumeEx('Missing function keyword', TokenType.FUNCTION);
        let name = this.ctx.currentNamespace;
        name.push( this.consumeEx('Missing function name', TokenType.NAME).lexeme );

        let generics = this.parseGenerics();

        let args : Parameter[] = [];
        this.consume(TokenType.LEFT_PAREN);
        if (this.peekType() != TokenType.RIGHT_PAREN)
        {
            do {
                args.push( this.parseArgument() );
            } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN);

        let type : TypeRef = null;
        if (this.peekType() == TokenType.COLON)
        {
            this.advance();
            type = this.parseTypeRef();
        }
        else
            type = new TypeRef(new Name(['void']), [], 0, false, null);

        let block = this.parseBlock();

        return new FunctionStmt(name, generics, args, type, block, accessor, name.location);
    }

    parseName( qualified : boolean = false ) : Name
    {
        let location = this.peek().location;
        let lexemes : string[] = [];
        do {
            lexemes.push( this.consumeEx('Expected identifier', TokenType.NAME).lexeme );
        } while (qualified && this.match(TokenType.DOT));
        return new Name(lexemes, location);
    }

    parseTypeRef( allow_array : boolean = true ) : TypeRef
    {
        let location = this.peek().location;
        let name = this.parseName(true);
        let dims = 0;
        let nullable = false;

        let generics : TypeRef[] = [];
        if (this.match(TokenType.LESS))
        {
            do {
                generics.push( this.parseTypeRef() );
            } while (this.match(TokenType.COMMA));
            this.consume(TokenType.GREATER);
        }

        if (!allow_array && this.peekType() == TokenType.LEFT_BRACKET)
            throw this.error(this.peek().location, "Array specified not allowed here");
        while (this.match(TokenType.LEFT_BRACKET))
        {
            dims++;
            this.consume(TokenType.RIGHT_BRACKET);
        }

        if (this.match(TokenType.PIPE))
        {
            let token = this.consume(TokenType.NIL);
            nullable = true;
        }

        return new TypeRef(name, generics, dims, nullable, location);
    }

    parseExpression() : IExpr
    {
        return this.parseAssignment();
    }

    parseAssignment() : IExpr
    {
        let tt = this.peek();
        let expr = this.parseOr();

        let location = this.peek().location;
        let operator = this.peekType();
        switch (operator)
        {
            case TokenType.EQUAL:
            case TokenType.PLUS_EQUAL:
            case TokenType.MINUS_EQUAL:
            case TokenType.SLASH_EQUAL:
            case TokenType.STAR_EQUAL:
            {
                this.advance();
                let right = this.parseAssignment();
                if (expr instanceof NameLiteral || expr instanceof FieldExpr || expr instanceof ArrayAccessExpr)
                    return expr = new AssignExpr(expr, operator, right, location);
                throw this.error(tt.location, 'Invalid assignment l-value');
            }
        }

        return expr;
    }

    parseOr() : IExpr
    {
        let expr = this.parseAnd();

        let location = this.peek().location;
        let operator = this.peekType();
        while (this.match(TokenType.OR))
        {
            let right = this.parseAnd();
            expr = new LogicalExpr(expr, operator, right, location);
        }

        return expr;
    }

    parseAnd() : IExpr
    {
        let expr = this.parseEquality();

        let location = this.peek().location;
        let operator = this.peekType();
        while (this.match(TokenType.AND))
        {
            let right = this.parseEquality();
            expr = new LogicalExpr(expr, operator, right, location);
        }

        return expr;
    }

    parseEquality() : IExpr
    {
        let expr = this.parseComparison();

        let location = this.peek().location;
        let operator = this.peekType();
        while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL))
        {
            let right = this.parseComparison();
            expr = new BinaryExpr(expr, operator, right, location);
        }

        return expr;
    }

    parseComparison() : IExpr
    {
        let expr = this.parseAddition();

        let location = this.peek().location;
        let operator = this.peekType();
        while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS,
            TokenType.LESS_EQUAL, TokenType.IN, TokenType.INSTANCEOF))
        {
            let right = this.parseAddition();
            expr = new BinaryExpr(expr, operator, right, location);
        }

        return expr;
    }

    parseAddition() : IExpr
    {
        let expr = this.parseMultiplication();

        let location = this.peek().location;
        let operator = this.peekType();
        while (this.match(TokenType.PLUS, TokenType.MINUS))
        {
            let right = this.parseMultiplication();
            expr = new BinaryExpr(expr, operator, right, location);
        }

        return expr;
    }

    parseMultiplication() : IExpr
    {
        let expr = this.parsePreUnary();

        let location = this.peek().location;
        let operator = this.peekType();
        while (this.match(TokenType.STAR, TokenType.SLASH))
        {
            let right = this.parsePreUnary();
            expr = new BinaryExpr(expr, operator, right, location);
        }

        return expr;
    }

    parsePreUnary() : IExpr
    {
        let operator = this.peekType();
        if (this.match(TokenType.BANG,
            TokenType.MINUS,
            TokenType.MINUS_MINUS,
            TokenType.PLUS,
            TokenType.PLUS_PLUS
            ))
        {
            let expr = this.parsePreUnary();
            return new UnaryExpr(operator, expr, false);
        }
        else
        if (this.match(TokenType.LESS))
        {
            let type = this.parseTypeRef();
            this.consume(TokenType.GREATER);
            let expr = this.parsePreUnary();
            return new TypeCastExpr(type, expr);
        }

        return this.parsePostUnary();
    }

    parsePostUnary() : IExpr
    {
        let expr = this.parseCall();

        let operator = this.peekType();
        if (this.match(TokenType.MINUS_MINUS, TokenType.PLUS_PLUS))
            return new UnaryExpr(operator, expr, true);

        return expr;
    }

    parseCall() : IExpr
    {
        let expr = this.parseAtomic();

        while (true)
        {
            if (this.match(TokenType.LEFT_PAREN))
            {
                let args : IExpr[] = [];
                if (this.peekType() != TokenType.RIGHT_PAREN)
                {
                    do {
                        args.push(this.parseExpression());
                    } while (this.match(TokenType.COMMA));
                }
                this.consume(TokenType.RIGHT_PAREN);
                expr = new CallExpr(expr, args);
            }
            else
            if (this.match(TokenType.LEFT_BRACKET))
            {
                let index = this.parseExpression();
                this.consume(TokenType.RIGHT_BRACKET);
                expr = new ArrayAccessExpr(expr, index);
            }
            else
            if (this.match(TokenType.DOT))
            {
                let name = new Name([this.consumeEx('Expect name after \'.\'.', TokenType.NAME).lexeme]);
                expr = new FieldExpr(expr, name);
            }
            else
                break;
        }

        return expr;
      }

    parseAtomic() : IExpr
    {
        let tt = this.peek();
        let location = tt.location;

        if (this.match(TokenType.LEFT_BRACKET))
        {
            let values : IExpr[] = [];
            if (this.peekType() != TokenType.RIGHT_BRACKET)
            {
                do {
                    values.push(this.parseExpression());
                } while (this.match(TokenType.COMMA));
            }
            this.consume(TokenType.RIGHT_BRACKET);
            return new ArrayExpr(values, location);
        }
        if (this.match(TokenType.DOT_DOT_DOT))
        {
            return new ExpandExpr( this.parseName(), location );
        }
        if (this.peekType() == TokenType.NEW)
        {
            return this.parseNewExpr();
        }

        if (this.match(TokenType.LEFT_PAREN))
        {
            let expr = this.parseExpression();
            this.consumeEx(`Expect \')\' after expression`, TokenType.RIGHT_PAREN);
            return new Group(expr, location);
        }

        if (this.match(TokenType.FALSE)) return new BoolLiteral(false, location);
        if (this.match(TokenType.TRUE)) return new BoolLiteral(true, location);
        if (this.match(TokenType.NIL)) return new NullLiteral(location);
        if (this.peekType() == TokenType.NAME)
            return new NameLiteral(this.advance().lexeme, location);
        if (this.match(TokenType.NUMBER))
            return new NumberLiteral( tt.lexeme, parseInt(tt.lexeme), location );
        if (this.match(TokenType.SSTRING, TokenType.TSTRING, TokenType.DSTRING))
            return new StringLiteral(tt.lexeme, tt.type, location);

        throw this.error(this.peek().location, 'Invalid expression with ' + this.peekType().lexeme);
    }

    parseNewExpr() : IExpr
    {
        this.consume(TokenType.NEW);
        let type = this.parseTypeRef();

        this.consume(TokenType.LEFT_PAREN);

        let args : IExpr[] = [];
        if (this.peekType() != TokenType.RIGHT_PAREN)
        {
            do {
                args.push(this.parseExpression());
            } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN);

        return new NewExpr(type, args);
    }

    parseBlock() : BlockStmt
    {
        let stmts : IStmt[] = [];

        this.consume(TokenType.LEFT_BRACE);
        while(this.peekType() != TokenType.RIGHT_BRACE)
        {
            stmts.push( this.parseVariableStmtOrStatement() );
        }
        this.consume(TokenType.RIGHT_BRACE);

        return new BlockStmt(stmts);
    }

    parseBlockOrStmt() : IStmt
    {
        if (this.peekType() == TokenType.LEFT_BRACE)
            return this.parseBlock();
        else
            return this.parseStatement();
    }

    // used by top-level and namespaces
    parseDeclationStmt( accessor : Accessor ) : IStmt
    {
        let cur = this.peekType();
        switch (cur)
        {
            case TokenType.LET:
            case TokenType.CONST:
            {
                let stmt = this.parseVariableStmt(accessor);
                this.unit.variables.set(stmt.name.qualified, stmt);
                return stmt;
            }
            case TokenType.FUNCTION:
            {
                let stmt = this.parseFunction(accessor);
                Logger.writeln(`Adding function ${stmt.name.qualified}`);
                this.unit.functions.set(stmt.name.qualified, stmt);
                return stmt;
            }
            case TokenType.CLASS:
            case TokenType.INTERFACE:
                {
                let stmt = this.parseClass(accessor);
                let qname = stmt.name.qualified;
                if (stmt.isGeneric)
                    this.unit.generics.set(qname, stmt);
                else
                {
                    this.unit.types.set(qname, stmt);
                    this.ctx.types.set(qname, stmt);
                }
                return stmt;
            }
        }

        throw this.error(this.peek().location, `Unexpected token ${this.peek().type.name}`);


        //return this.parseStatement();
    }

    parsePropertyPrefix() : Token
    {
        let value = this.peek();

        if (value.type != TokenType.NAME) return null;

        let result : TokenType = null;
        if (value.lexeme == TokenType.SET.lexeme)
            result = TokenType.SET;
        else
        if (value.lexeme == TokenType.GET.lexeme)
            result = TokenType.GET;

        if (result != null)
        {
            this.advance();
            if (this.peekType() != TokenType.LEFT_PAREN)
                return new Token(result, value.lexeme, value.location);
            else
                this.unget();
        }
        return null;
    }

    parseClass( accessor : Accessor ) : ClassStmt
    {
        let type = this.advance().type;
        let name = this.parseName();
        let generics = this.parseGenerics();
        let extended : TypeRef = null;
        let implemented : TypeRef[] = null;

        if (this.match(TokenType.EXTENDS))
            extended = this.parseTypeRef();
        else
            extended = objectRef;

        if (this.match(TokenType.IMPLEMENTS))
        {
            implemented = [];
            do {
                implemented.push(this.parseTypeRef());
            } while (this.match(TokenType.COMMA));
        }

        this.consume(TokenType.LEFT_BRACE);

        let stmts : IStmt[] = [];
        while (!this.eof() && this.peekType() != TokenType.RIGHT_BRACE)
        {
            let accessor = this.parseAccessor();
            let property = this.parsePropertyPrefix();

            if (this.peekType() == TokenType.NAME)
            {
                let tname = this.advance();
                let temp = name.clone();
                temp.lexemes.push(tname.lexeme);
                temp.location = tname.location;
                if (this.peekType() == TokenType.LEFT_PAREN || this.peekType() == TokenType.LESS)
                {
                    let func = this.parseMethod(temp);
                    func.accessor = accessor;
                    if (property) func.property = property.type;
                    stmts.push(func);
                }
                else
                {
                    if (property) this.error(property.location, 'Property or signature expected');
                    let vari = this.parseProperty(temp, accessor);
                    vari.accessor = accessor;
                    stmts.push(vari);
                }
            }
            else
                throw this.error(this.peek().location, 'Invalid token ' + this.peekType().name);
        }
        this.consume(TokenType.RIGHT_BRACE);

        let result = new ClassStmt(name, generics, extended, implemented, stmts, accessor);
        for (let stmt of stmts)
            if (stmt instanceof VariableStmt || stmt instanceof FunctionStmt) stmt.parent = result;
        return result;
    }

    parseMethod( name : Name ) : FunctionStmt
    {
        let generics = this.parseGenerics();

        let args : Parameter[] = [];
        this.consume(TokenType.LEFT_PAREN);
        if (this.peekType() != TokenType.RIGHT_PAREN)
        {
            do {
                args.push( this.parseArgument() );
            } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN);

        let type : TypeRef = null;
        if (this.peekType() == TokenType.COLON)
        {
            this.advance();
            type = this.parseTypeRef();
        }
        else
            type = new TypeRef(new Name(['void']), [], 0, false, this.peek().location);

        let block : BlockStmt = null;
        if (this.peekType() == TokenType.LEFT_BRACE)
            block = this.parseBlock();
        else
            this.consume(TokenType.SEMICOLON);

        return new FunctionStmt(name, generics, args, type, block);
    }

    parseAccessor() : Accessor
    {
        let values : TokenType[] = [];
        while (true)
        {
            let cur = this.peekType();
            if (!this.match(TokenType.PUBLIC, TokenType.PRIVATE, TokenType.PROTECTED,
                TokenType.READONLY, TokenType.EXPORT, TokenType.STATIC, TokenType.DECLARE,
                TokenType.ABSTRACT))
                break;
            values.push(cur);
        }
        if (values.length == 0) return null;
        return new Accessor(values);
    }

    parseVariableStmtOrStatement() : IStmt
    {
        if (this.peekType() == TokenType.LET || this.peekType() == TokenType.CONST)
            return this.parseVariableStmt(null);
        return this.parseStatement();
    }

    parseStatement() : IStmt
    {
        let cur = this.peekType();
        // parse language statements
        switch (cur)
        {
            case TokenType.LET:
            case TokenType.CONST:
                throw this.error(this.peek().location, `'${cur.lexeme}' declarations can only be declared inside a block.`);
            case TokenType.IF:
                return this.parseIfThenElse();
            case TokenType.RETURN:
                return this.parseReturn();
            case TokenType.DO:
                return this.parseDoWhileStmt();
            case TokenType.WHILE:
                return this.parseWhileStmt();
            case TokenType.FOR:
                return this.parseFor();
            case TokenType.THROW:
                return this.parseThrow();
            case TokenType.TRY:
                return this.parseTryCatchStmt();
            case TokenType.SWITCH:
                return this.parseSwitchStmt();
            case TokenType.BREAK:
                this.advance();
                this.consume(TokenType.SEMICOLON);
                return new BreakStmt();
            case TokenType.CONTINUE:
                this.advance();
                this.consume(TokenType.SEMICOLON);
                return new ContinueStmt();
            case TokenType.LEFT_BRACE:
                return this.parseBlock();
        }
        // all we have left is a expression statement
        let expr = this.parseExpression();
        this.consume(TokenType.SEMICOLON);
        return new ExprStmt(expr);
    }

    parseReturn() : IStmt
    {
        this.consume(TokenType.RETURN);
        let expr : IExpr = null;
        if (this.peekType() != TokenType.SEMICOLON)
            expr = this.parseExpression();
        this.consume(TokenType.SEMICOLON);
        return new ReturnStmt(expr);
    }

    parseIfThenElse() : IStmt
    {
        this.consume(TokenType.IF);
        this.consume(TokenType.LEFT_PAREN);
        let cond = this.parseExpression();
        this.consume(TokenType.RIGHT_PAREN);

        let thenSide = this.parseBlockOrStmt();
        let elseSide : IStmt = null;
        if (this.match(TokenType.ELSE))
            elseSide = this.parseBlockOrStmt();

        return new IfStmt(cond, thenSide, elseSide);
    }

    parseDoWhileStmt() : IStmt
    {
        this.consume(TokenType.DO);
        let stmt = this.parseBlock();
        this.consume(TokenType.WHILE);
        this.consume(TokenType.LEFT_PAREN);
        let cond = this.parseExpression();
        this.consume(TokenType.RIGHT_PAREN);
        this.consume(TokenType.SEMICOLON);

        return new DoWhileStmt(stmt, cond);
    }

    parseWhileStmt() : IStmt
    {
        this.consume(TokenType.WHILE);
        this.consume(TokenType.LEFT_PAREN);
        let cond = this.parseExpression();
        this.consume(TokenType.RIGHT_PAREN);
        let stmt = this.parseBlockOrStmt();

        return new WhileStmt(cond, stmt);
    }

    parseFor() : IStmt
    {
        this.consume(TokenType.FOR);
        this.consume(TokenType.LEFT_PAREN);

        let init : IStmt = null;
        let expr : IExpr = null;
        let fexpr : IExpr = null;
        let stmt : IStmt = null;

        if (this.peekType() != TokenType.SEMICOLON)
        {
            // is it a variable declaration?
            if (this.peekType() == TokenType.LET || this.peekType() == TokenType.CONST)
            {
                let cosntant = this.advance().type == TokenType.CONST;
                let name = this.parseName();
                let type : TypeRef = null;
                let value : IStmt = null;
                if (this.match(TokenType.COLON))
                    type = this.parseTypeRef();
                if (this.match(TokenType.EQUAL))
                    value = this.parseExpression();
                init = new VariableStmt(name, type, value, cosntant);
            }
            else
                // only accept expression statements
                init = new ExprStmt( this.parseExpression() );
        }

        if (this.peekType() == TokenType.SEMICOLON)
        {
            // for ([initialization]; [condition]; [final-expression]) statement
            this.advance(); // ;
            expr = this.parseExpression();
            this.consume(TokenType.SEMICOLON);
            fexpr = this.parseExpression();
            this.consume(TokenType.RIGHT_PAREN);
            stmt = this.parseBlockOrStmt();
            return new ForStmt(init, expr, fexpr, stmt);
        }
        else
        if (this.peekType() == TokenType.OF)
        {
            // for (variable of iterable) statement
            if (!init || !(init instanceof VariableStmt))
                throw this.error(this.peek().location, 'Missing variable declaration');
            if (init.init) throw this.error(this.peek().location, 'The variable declaration of a \'for...of\' statement cannot have an initializer.');
            this.consume(TokenType.OF);
            expr = this.parseExpression();
            this.consume(TokenType.RIGHT_PAREN);
            stmt = this.parseBlockOrStmt();
            return new ForOfStmt(<VariableStmt>init, expr, stmt);
        }

        throw this.error(this.peek().location, `Invalid for statement ${this.peek().lexeme}`);
    }

    parseProperty( name : Name, accessor : Accessor ) : PropertyStmt
    {
        let type : TypeRef = null;
        let value : IExpr = null;
        if (this.match(TokenType.COLON))
            type = this.parseTypeRef();
        if (this.match(TokenType.EQUAL))
            value = this.parseExpression();

        if (type == null && value == null)
            throw this.error(name.location, 'Missing argument type');
        this.consume(TokenType.SEMICOLON);

        return new PropertyStmt(name, type, value, accessor, name.location);
    }

    parseVariableStmt( accessor : Accessor ) : VariableStmt
    {
        let constant : boolean = false;

        constant = this.advance().type == TokenType.CONST;
        let tname = this.consumeEx('Missing variable name', TokenType.NAME);

        let name = this.ctx.currentNamespace;
        name.push(tname.lexeme);
        let type : TypeRef = null;
        let value : IExpr = null;
        if (this.match(TokenType.COLON))
            type = this.parseTypeRef();
        if (this.match(TokenType.EQUAL))
            value = this.parseExpression();
        if (type == null && value == null)
            throw this.error(tname.location, 'Missing argument type');

        this.consume(TokenType.SEMICOLON);

        return new VariableStmt(name, type, value, constant, accessor, tname.location);
    }

    parseThrow() : IStmt
    {
        this.consume(TokenType.THROW);
        let expr : IExpr = null;
        if (this.peekType() != TokenType.SEMICOLON)
            expr = this.parseExpression();
        this.consume(TokenType.SEMICOLON);
        return new ThrowStmt(expr);
    }

    parseTryCatchStmt() : IStmt
    {
        let tt = this.consume(TokenType.TRY);
        let block = this.parseBlock();
        let variable : Name = null;
        let cblock : IStmt = null;
        let fblock : IStmt = null;

        if (this.match(TokenType.CATCH))
        {
            this.consume(TokenType.LEFT_PAREN);
            variable = this.parseName();
            this.consume(TokenType.RIGHT_PAREN);
            cblock = this.parseBlock();
        }

        if (this.match(TokenType.FINALLY))
            fblock = this.parseBlock();

        if (!cblock && !fblock)
            this.error(tt.location, 'Either catch or finally is required');

        return new TryCatchStmt(block, variable, cblock, fblock);
    }
}

/**
 * Transform functions into classes and replace the original functions by variables.
 */
export class NodePromoter
{
    protected visitNamespaceStmt(target: NamespaceStmt): void {
        throw new Error("Method not implemented.");
    }

    static readonly parent = new TypeRef(new Name(['Callable'], null), null, 0, true);

    protected promote( target : FunctionStmt ) : ClassStmt
    {
        // TODO: remove 'static' accessor from 'target.accessor'
        Logger.writeln(`Promoting function ${target.name.qualified}`);

        let name = target.name.clone();
        name.lexemes[ name.lexemes.length - 1 ] = `__fn_${target.name.canonical}__`;
        target.name.lexemes[ target.name.lexemes.length - 1 ] = 'call';
        let clazz = new ClassStmt(name, null, NodePromoter.parent, null, [target], target.accessor, target.location);
        target.accessor = new Accessor([TokenType.STATIC]);
        return clazz;
    }

    protected processStatements( unit : Unit, stmts : IStmt[] ): void {
        for (let i = 0; i < stmts.length; ++i)
        {
            if (stmts[i] instanceof FunctionStmt)
            {
                let fun = <FunctionStmt> stmts[i];
                let name = fun.name.clone();
                stmts[i] = this.promote(fun);
                let clazz = <ClassStmt> stmts[i];
                unit.types.set(clazz.name.qualified, clazz);
                unit.functions.delete(name.qualified);
                unit.variables.set( name.qualified,
                    new VariableStmt(name, new TypeRef(clazz.name, null, 0, true, null),
                        new CallExpr( new FieldExpr( new NameLiteral(clazz.name.qualified), new Name(['call'])), []), false) );
            }
            else
            if (stmts[i] instanceof NamespaceStmt)
                this.processStatements(unit, (<NamespaceStmt>stmts[i]).stmts);
        }
    }

    process( unit : Unit )
    {
        if (unit) this.processStatements(unit, unit.stmts);
    }
}

let errorName = new Name(['Error']);
let objectName = new Name(['Object']);
let objectRef = new TypeRef(objectName, null, 0, true);
let callableName = new Name(['ICallable']);

export function createObject() : ClassStmt
{
    return new ClassStmt(objectName, null, null, null, [], new Accessor([TokenType.EXPORT]));
}

export function createCallable() : ClassStmt
{
    return new ClassStmt(callableName, null, objectRef, null, [], new Accessor([TokenType.EXPORT]));
}

export function createError() : ClassStmt
{
    return new ClassStmt(errorName, null, null, null, [], new Accessor([TokenType.EXPORT]));
}