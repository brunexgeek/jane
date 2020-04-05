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
    NameAndGenerics } from './types';

import {
    TokenType,
    Tokenizer,
    Token } from './tokenizer';

import {
    SourceLocation,
    CompilationContext } from './compiler';

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
    private unit : Unit = null;

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
            //    console.error('--- ' + this.stack[0].toString());
        }
        return this.stack[0];
    }

    advance() : Token
    {
        let tt = this.peek();
        this.stack.pop();
        return tt;
    }

    consume( ...types : TokenType[] ) : Token
    {
        return this.consumeEx(null, ...types);
    }

    consumeEx( message : string, ...types : TokenType[] ) : Token
    {
        for (let tt of types)
        {
            if (this.peek().type == tt)
            {
                let tt = this.peek();
                this.advance();
                return tt;
            }
        }

        let found = this.peek().type.lexeme;
        if (this.peek().type == TokenType.NAME) found = this.peek().lexeme;

        if (message && message.length > 0)
            throw this.error(this.peek(), message);

        let names = '';
        let first = true;
        for (let tt of types)
        {
            if (!first) names += ' or ';
            first = false;
            names += `'${tt.lexeme}'`;
        }
        throw this.error(this.peek(), `Expected ${names}, but found '${found}'`);
    }

    match( ...type : TokenType[] ) : boolean
    {
        for (let t of type)
        {
            if (this.peek().type == t)
            {
                this.advance();
                return true;
            }
        }
        return false;
    }

    eof() : boolean
    {
        return this.peek().type == TokenType.EOF;
    }

    error( token : Token, message : string ) : ParseError
    {
        let result = new ParseError(message, token.location);
        this.ctx.listener.onError(token.location, result);
        return result;
    }

    synchronize()
    {
        let prev = this.advance();

        while (this.peek().type != TokenType.EOF)
        {
            //if (prev.type == TokenType.SEMICOLON) return;

           switch (this.peek().type)
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
        let hasError = false;

        do {
            try
            {
                if (this.peek().type == TokenType.IMPORT)
                {
                    let result = this.parseImport();
                    stmts.push(result);
                    imports.push(result);
                }
                else
                    stmts.push( this.parseNamespaceOrDeclaration() );
            } catch (error)
            {
                console.error(error);
                hasError = true;
                this.synchronize();
            }
        } while (this.peek().type != TokenType.EOF);

        if (hasError) throw this.error(null, 'The code has one or more errors');

        this.unit.imports = imports;
        this.unit.stmts = stmts;
        return this.unit;
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
            throw this.error(tt, 'String literal expected');
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
        while (this.peek().type != TokenType.RIGHT_BRACE && this.peek().type != TokenType.CASE && this.peek().type != TokenType.DEFAULT)
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
        while (this.peek().type != TokenType.RIGHT_BRACE)
            stmts.push(this.parseCaseStmt());
        this.consume(TokenType.RIGHT_BRACE);

        return new SwitchStmt(expr, stmts);
    }

    parseNamespaceOrDeclaration()
    {
        let accessor = this.parseAccessor();

        if (this.peek().type == TokenType.NAMESPACE)
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
            stmts.push( this.parseNamespaceOrDeclaration() );
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
        if (this.peek().type == TokenType.COLON)
        {
            this.advance();
            type = this.parseTypeRef();
        }
        if (this.peek().type == TokenType.EQUAL)
        {
            this.advance();
            value = this.parseExpression();
        }

        if (type == null && value == null)
        {
            throw this.error(name, 'Missing argument type');
        }

        return new Parameter( new Name([name.lexeme]), type, value, vararg, name.location);
    }

    parseFunction( accessor : Accessor ) : FunctionStmt
    {
        this.consumeEx('Missing function keyword', TokenType.FUNCTION);
        let name = this.consumeEx('Missing function name', TokenType.NAME);

        let generics : Name[] = [];
        if (this.match(TokenType.LESS))
        {
            do {
                generics.push( this.parseName() );
            } while (this.match(TokenType.COMMA));
            this.consume(TokenType.GREATER);
        }

        let args : Parameter[] = [];
        this.consume(TokenType.LEFT_PAREN);
        if (this.peek().type != TokenType.RIGHT_PAREN)
        {
            do {
                args.push( this.parseArgument() );
            } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN);

        let type : TypeRef = null;
        if (this.peek().type == TokenType.COLON)
        {
            this.advance();
            type = this.parseTypeRef();
        }
        else
            type = new TypeRef(new Name(['void']), [], 0, false, null);

        let block = this.parseBlock();

        let result = new FunctionStmt(new Name([name.lexeme]), generics, args, type, block, accessor, name.location);
        result.nspace = this.ctx.currentNamespace;
        return result;
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

    parseNameAndGenerics() : NameAndGenerics
    {
        let location = this.peek().location;
        let name = this.parseName(true);
        let dims = 0;

        let generics : NameAndGenerics[] = [];
        if (this.match(TokenType.LESS))
        {
            do {
                generics.push( this.parseNameAndGenerics() );
            } while (this.match(TokenType.COMMA));
            this.consume(TokenType.GREATER);
        }

        return new NameAndGenerics(name, generics, location);
    }

    parseTypeRef() : TypeRef
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
        let operator = this.peek().type;
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
                if (expr instanceof NameLiteral || expr instanceof FieldExpr)
                    return expr = new AssignExpr(expr, operator, right, location);
                throw this.error(tt, 'Invalid assignment l-value');
            }
        }

        return expr;
    }

    parseOr() : IExpr
    {
        let expr = this.parseAnd();

        let location = this.peek().location;
        let operator = this.peek().type;
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
        let operator = this.peek().type;
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
        let operator = this.peek().type;
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
        let operator = this.peek().type;
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
        let operator = this.peek().type;
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
        let operator = this.peek().type;
        while (this.match(TokenType.STAR, TokenType.SLASH))
        {
            let right = this.parsePreUnary();
            expr = new BinaryExpr(expr, operator, right, location);
        }

        return expr;
    }

    parsePreUnary() : IExpr
    {
        let operator = this.peek().type;
        if (this.match(TokenType.BANG, TokenType.MINUS, TokenType.MINUS_MINUS, TokenType.PLUS_PLUS))
        {
            let expr = this.parsePreUnary();
            return new UnaryExpr(operator, expr, false);
        }

        return this.parsePostUnary();
    }

    parsePostUnary() : IExpr
    {
        let expr = this.parseCall();

        let operator = this.peek().type;
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
                if (this.peek().type != TokenType.RIGHT_PAREN)
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

        if (this.match(TokenType.FALSE)) return new BoolLiteral(false, location);
        if (this.match(TokenType.TRUE)) return new BoolLiteral(true, location);
        if (this.match(TokenType.NIL)) return new NullLiteral(location);
        if (this.peek().type == TokenType.NAME)
            return new NameLiteral(this.advance().lexeme, location);

        if (this.match(TokenType.NUMBER))
            return new NumberLiteral( tt.lexeme, parseInt(tt.lexeme), location );
        if (this.match(TokenType.SSTRING, TokenType.TSTRING, TokenType.DSTRING))
            return new StringLiteral(tt.lexeme, tt.type, location);

        if (this.match(TokenType.LEFT_PAREN))
        {
            let expr = this.parseExpression();
            this.consumeEx(`Expect \')\' after expression`, TokenType.RIGHT_PAREN);
            return new Group(expr, location);
        }

        if (this.match(TokenType.LEFT_BRACKET))
        {
            let values : IExpr[] = [];
            if (this.peek().type != TokenType.RIGHT_BRACKET)
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

        if (this.peek().type == TokenType.NEW)
        {
            return this.parseNewExpr();
        }

        throw this.error(this.peek(), 'Invalid expression with ' + this.peek().type.lexeme);
    }

    parseNewExpr() : IExpr
    {
        this.consume(TokenType.NEW);
        let type = this.parseTypeRef();

        this.consume(TokenType.LEFT_PAREN);

        let args : IExpr[] = [];
        if (this.peek().type != TokenType.RIGHT_PAREN)
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
        while(this.peek().type != TokenType.RIGHT_BRACE)
        {
            stmts.push( this.parseVariableOrStatement() );
        }
        this.consume(TokenType.RIGHT_BRACE);

        return new BlockStmt(stmts);
    }

    parseBlockOrStmt() : IStmt
    {
        if (this.peek().type == TokenType.LEFT_BRACE)
            return this.parseBlock();
        else
            return this.parseStatement();
    }

    qualifyName( name : Name ) : string
    {
        let qname = this.ctx.currentNamespaceString;
        if (qname.length > 0) qname += '.';
        return qname += name.toString();
    }

    // used by top-level and namespaces
    parseDeclationStmt( accessor : Accessor ) : IStmt
    {
        let cur = this.peek().type;
        switch (cur)
        {
            case TokenType.LET:
            case TokenType.CONST:
            {
                let stmt = this.parseVariable(accessor);
                let qname = this.qualifyName(stmt.name);
                this.unit.variables.set(qname, stmt);
                return stmt;
            }
            case TokenType.FUNCTION:
            {
                let stmt = this.parseFunction(accessor);
                let qname = this.qualifyName(stmt.name);
                this.unit.functions.set(qname, stmt);
                return stmt;
            }
            /*case TokenType.CLASS:
            case TokenType.INTERFACE:
                {
                let stmt = this.parseClass(accessor);
                let qname = stmt.name.qualified;
                this.unit.types.set(qname, stmt);
                this.ctx.types.set(qname, stmt);
                return stmt;
            }*/
        }

        throw this.error(this.peek(), 'Unexpected token');


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
            return new Token(result, value.lexeme, value.location);
        }
        return null;
    }

    parseClass( accessor : Accessor ) : ClassStmt
    {
        let type = this.advance().type;
        //let name = new Name([this.consumeEx('Missing class name', TokenType.NAME).lexeme]);
        let name = this.parseNameAndGenerics();
        let extended : NameAndGenerics = null;
        let implemented : NameAndGenerics[] = null;

        if (this.match(TokenType.EXTENDS))
        {
            extended = this.parseNameAndGenerics();
        }

        if (this.match(TokenType.IMPLEMENTS))
        {
            implemented = [];
            do {
                implemented.push(this.parseNameAndGenerics());
            } while (this.match(TokenType.COMMA));
        }

        this.consume(TokenType.LEFT_BRACE);

        let stmts : IStmt[] = [];
        while (!this.eof() && this.peek().type != TokenType.RIGHT_BRACE)
        {
            let accessor = this.parseAccessor();
            let property = this.parsePropertyPrefix();

            if (this.peek().type == TokenType.NAME)
            {
                let name = this.advance();
                if (this.peek().type == TokenType.LEFT_PAREN || this.peek().type == TokenType.LESS)
                {
                    let func = this.parseMethod(name);
                    func.accessor = accessor;
                    if (property) func.property = property.type;
                    stmts.push(func);
                }
                else
                {
                    if (property) this.error(property, 'Property or signature expected');
                    let vari = this.parseProperty(name, accessor);
                    vari.accessor = accessor;
                    stmts.push(vari);
                }
            }
            else
                throw this.error(this.peek(), 'Invalid token ' + this.peek().type.name);
        }
        this.consume(TokenType.RIGHT_BRACE);

        let result = new ClassStmt(name, extended, implemented, stmts, accessor);
        result.nspace = this.ctx.currentNamespace;

        return result;
    }

    parseMethod( name : Token ) : FunctionStmt
    {
        let generics : Name[] = [];
        if (this.match(TokenType.LESS))
        {
            do {
                generics.push( this.parseName() );
            } while (this.match(TokenType.COMMA));
            this.consume(TokenType.GREATER);
        }

        let args : Parameter[] = [];
        this.consume(TokenType.LEFT_PAREN);
        if (this.peek().type != TokenType.RIGHT_PAREN)
        {
            do {
                args.push( this.parseArgument() );
            } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN);

        let type : TypeRef = null;
        if (this.peek().type == TokenType.COLON)
        {
            this.advance();
            type = this.parseTypeRef();
        }
        else
            type = new TypeRef(new Name(['void']), [], 0, false, null);

        let block : BlockStmt = null;
        if (this.peek().type == TokenType.LEFT_BRACE)
            block = this.parseBlock();
        else
            this.consume(TokenType.SEMICOLON);

        return new FunctionStmt(new Name([name.lexeme]), generics, args, type, block);
    }

    parseAccessor() : Accessor
    {
        let values : TokenType[] = [];
        while (true)
        {
            let cur = this.peek().type;
            if (!this.match(TokenType.PUBLIC, TokenType.PRIVATE, TokenType.PROTECTED,
                TokenType.READONLY, TokenType.EXPORT, TokenType.STATIC, TokenType.DECLARE))
                break;
            values.push(cur);
        }
        if (values.length == 0) return null;
        return new Accessor(values);
    }

    parseVariableOrStatement() : IStmt
    {
        if (this.peek().type == TokenType.LET || this.peek().type == TokenType.CONST)
            return this.parseVariable(null);
        return this.parseStatement();
    }

    parseStatement() : IStmt
    {
        let cur = this.peek().type;
        // parse language statements
        switch (cur)
        {
            case TokenType.LET:
            case TokenType.CONST:
                throw this.error(this.peek(), `'${cur.lexeme}' declarations can only be declared inside a block.`);
            case TokenType.IF:
                return this.parseIfThenElse();
            case TokenType.RETURN:
                return this.parseReturn();
            case TokenType.DO:
                return this.parseDoWhileStmt();
            case TokenType.WHILE:
                return this.parseWhileStmt();
            case TokenType.FOR:
                return this.parseForOfStmt();
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
        if (this.peek().type != TokenType.SEMICOLON)
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

    parseForOfStmt() : IStmt
    {
        this.consume(TokenType.FOR);
        this.consume(TokenType.LEFT_PAREN);
        let type = this.consume(TokenType.CONST, TokenType.LET).type;
        let name = this.parseName();
        this.consume(TokenType.OF);
        let expr = this.parseExpression();
        this.consume(TokenType.RIGHT_PAREN);
        let stmt = this.parseBlockOrStmt();

        let variable = new VariableStmt(name, null, null, type == TokenType.CONST);
        return new ForOfStmt(variable, expr, stmt);
    }

    parseProperty( tname : Token, accessor : Accessor ) : VariableStmt
    {
        let name = new Name([tname.lexeme]);
        let type : TypeRef = null;
        let value : IExpr = null;
        if (this.peek().type == TokenType.COLON)
        {
            this.advance();
            type = this.parseTypeRef();
        }
        if (this.peek().type == TokenType.EQUAL)
        {
            this.advance();
            value = this.parseExpression();
        }

        if (type == null && value == null)
        {
            throw this.error(tname, 'Missing argument type');
        }
        this.consume(TokenType.SEMICOLON);

        let result = new VariableStmt(name, type, value, false, accessor);
        result.nspace = this.ctx.currentNamespace;
        result.location = tname.location;
        return result;
    }

    parseVariable( accessor : Accessor ) : VariableStmt
    {
        let constant : boolean = false;

        constant = this.advance().type == TokenType.CONST;
        let tname = this.consumeEx('Missing variable name', TokenType.NAME);

        let name = new Name([tname.lexeme]);
        let type : TypeRef = null;
        let value : IExpr = null;
        if (this.peek().type == TokenType.COLON)
        {
            this.advance();
            type = this.parseTypeRef();
        }
        if (this.peek().type == TokenType.EQUAL)
        {
            this.advance();
            value = this.parseExpression();
        }

        if (type == null && value == null)
        {
            throw this.error(tname, 'Missing argument type');
        }
        this.consume(TokenType.SEMICOLON);

        let result = new VariableStmt(name, type, value, constant, accessor, tname.location);
        result.nspace = this.ctx.currentNamespace;
        return result;
    }

    parseThrow() : IStmt
    {
        this.consume(TokenType.THROW);
        let expr : IExpr = null;
        if (this.peek().type != TokenType.SEMICOLON)
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
            this.error(tt, 'Either catch or finally is required');

        return new TryCatchStmt(block, variable, cblock, fblock);
    }
}
