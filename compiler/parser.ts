/*
 *   Copyright 2020 Bruno Ribeiro
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
    ForStmt,
    DispatcherTypeRef,
    TypeCastExpr,
    PropertyStmt,
    TypeId,
    TemplateStringExpr,
    EnumStmt,
    TernaryExpr,
    EnumDecl,
    VariableDecl} from './types';

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
        this.unit.fileName = tok.scanner.fileName;
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

    // Try to synchronize after a parse error
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
        let modifier = this.parseModifier();

        if (this.peekType() == TokenType.NAMESPACE)
            return this.parseNamespace(modifier);
        else
            return this.parseDeclationStmt(modifier);
    }

    parseNamespace( modifier : Modifier ) : IStmt
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

        return new NamespaceStmt(name, stmts, modifier, location);
    }

    parseArgument() : Parameter
    {
        let modifier = this.match(TokenType.PUBLIC);
        let vararg = this.match(TokenType.SPREAD);

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

    parseFunction( modifier : Modifier ) : FunctionStmt
    {
        this.consumeEx('Missing function keyword', TokenType.FUNCTION);
        let name = this.ctx.currentNamespace;
        name.push( this.consumeEx('Missing function name', TokenType.NAME).lexeme );

        //let generics = this.parseGenerics();
        let generics = null;

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
            type = new TypeRef(TypeId.OBJECT, new Name(['void']), 0);

        let block = this.parseBlock();

        return new FunctionStmt(name, generics, args, type, block, modifier, name.location);
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

    getTypeId( type : string ) : TypeId
    {
        const PRIMITIVES : string[] = ['boolean','void','char','byte', 'short', 'int', 'long',
            'ubyte', 'ushort', 'uint', 'ulong', 'number', 'string', 'void'];
        const TYPES : TypeId[] = [TypeId.BOOLEAN, TypeId.VOID, TypeId.CHAR,TypeId.BYTE, TypeId.SHORT, TypeId.INT, TypeId.LONG,
            TypeId.UBYTE, TypeId.USHORT, TypeId.UINT, TypeId.ULONG, TypeId.NUMBER, TypeId.STRING, TypeId.VOID];
        let idx = PRIMITIVES.indexOf(type);
        return (idx >= 0) ? TYPES[idx] : TypeId.INVALID;
    }

    parseTypeRef( allow_array : boolean = true ) : TypeRef
    {
        let location = this.peek().location;
        let name = this.parseName(true);
        let dims = 0;

        if (!allow_array && this.peekType() == TokenType.LEFT_BRACKET)
            throw this.error(this.peek().location, "Array specified not allowed here");
        while (this.match(TokenType.LEFT_BRACKET))
        {
            dims++;
            this.consume(TokenType.RIGHT_BRACKET);
        }

        return new TypeRef(this.getTypeId(name.qualified), name, dims, location);
    }

    parseExpression() : IExpr
    {
        return this.parseAssignment();
    }

    parseAssignment() : IExpr
    {
        let tt = this.peek();
        let expr = this.parseTernary();

        let location = this.peek().location;
        let operator = this.peekType();
        switch (operator)
        {
            case TokenType.EQUAL:
            case TokenType.PLUS_EQUAL:
            case TokenType.MINUS_EQUAL:
            case TokenType.DIV_EQUAL:
            case TokenType.MUL_EQUAL:
            case TokenType.MOD_EQUAL:
            case TokenType.BAND_EQUAL:
            case TokenType.BOR_EQUAL:
            case TokenType.XOR_EQUAL:
            case TokenType.SHL_EQUAL:
            case TokenType.SHR_EQUAL:
            case TokenType.USHR_EQUAL:
            case TokenType.OR_EQUAL:
            case TokenType.AND_EQUAL:
            case TokenType.NULLISH_EQUAL:
            case TokenType.EXPONENT_EQUAL:
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

    parseTernary() : IExpr
    {
        let expr = this.parseNullish();
        if (this.peekType() == TokenType.QUESTION)
        {
            this.consume(TokenType.QUESTION);
            let tside = this.parseNullish();
            this.consume(TokenType.COLON);
            let eside = this.parseExpression();
            return new TernaryExpr(expr, tside, eside);
        }
        return expr;
    }

    parseNullish() : IExpr
    {
        let expr = this.parseOr();

        let location = this.peek().location;
        let operator = this.peekType();
        while (this.match(TokenType.NULLISH))
        {
            let right = this.parseOr();
            expr = new LogicalExpr(expr, operator, right, location);
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
        let expr = this.parseBitwiseOr();

        let location = this.peek().location;
        let operator = this.peekType();
        while (this.match(TokenType.AND))
        {
            let right = this.parseBitwiseOr();
            expr = new LogicalExpr(expr, operator, right, location);
        }

        return expr;
    }

    parseBitwiseOr() : IExpr
    {
        let expr = this.parseBitwiseXor();

        let location = this.peek().location;
        let operator = this.peekType();
        while (this.match(TokenType.BOR))
        {
            let right = this.parseBitwiseXor();
            expr = new BinaryExpr(expr, operator, right, location);
        }

        return expr;
    }

    parseBitwiseXor() : IExpr
    {
        let expr = this.parseBitwiseAnd();

        let location = this.peek().location;
        let operator = this.peekType();
        if (this.match(TokenType.XOR))
        {
            let right = this.parseBitwiseAnd();
            expr = new BinaryExpr(expr, operator, right, location);
        }

        return expr;
    }

    parseBitwiseAnd() : IExpr
    {
        let expr = this.parseEquality();

        let location = this.peek().location;
        let operator = this.peekType();
        if (this.match(TokenType.BAND))
        {
            let right = this.parseEquality();
            expr = new BinaryExpr(expr, operator, right, location);
        }

        return expr;
    }

    parseEquality() : IExpr
    {
        let expr = this.parseComparison();

        let location = this.peek().location;
        let operator = this.peekType();
        if (this.match(TokenType.INEQUALITY, TokenType.EQUALITY, TokenType.S_EQUALITY))
        {
            let right = this.parseComparison();
            expr = new BinaryExpr(expr, operator, right, location);
        }

        return expr;
    }

    parseComparison() : IExpr
    {
        let expr = this.parseBitShift();

        let location = this.peek().location;
        let operator = this.peekType();
        if (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS,
            TokenType.LESS_EQUAL, TokenType.IN, TokenType.INSTANCEOF))
        {
            let right = this.parseBitShift();
            expr = new BinaryExpr(expr, operator, right, location);
        }

        return expr;
    }

    parseBitShift() : IExpr
    {
        let expr = this.parseAddition();

        let location = this.peek().location;
        let operator = this.peekType();
        if (this.match(TokenType.SHL, TokenType.SHR, TokenType.USHR))
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
        while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.MOD))
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
            TokenType.DECREMENT,
            TokenType.PLUS,
            TokenType.INCREMENT,
            TokenType.TILDE
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
        if (this.match(TokenType.DECREMENT, TokenType.INCREMENT))
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
                let loc = this.previous.location;
                let args : IExpr[] = [];
                if (this.peekType() != TokenType.RIGHT_PAREN)
                {
                    do {
                        args.push(this.parseExpression());
                    } while (this.match(TokenType.COMMA));
                }
                this.consume(TokenType.RIGHT_PAREN);
                expr = new CallExpr(expr, args, loc);
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
                let tname = this.consume(TokenType.NAME);
                let name = new Name([tname.lexeme], tname.location);
                expr = new FieldExpr(expr, name, name.location);
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
        if (this.match(TokenType.SPREAD))
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
            return new NumberLiteral( tt.lexeme, location );
        if (this.match(TokenType.SSTRING, TokenType.DSTRING, TokenType.TSTRING))
            return new StringLiteral(tt.lexeme, tt.type, location);
        if (this.match(TokenType.TSTRING_BEGIN))
            return this.parseTemplateString();

        throw this.error(this.peek().location, 'Invalid expression with ' + this.peekType().lexeme);
    }

    parseTemplateString() : IExpr
    {
        let entries : IExpr[] = [];
        while (!this.match(TokenType.TSTRING_END))
        {
            let tmp = this.parseExpression();
            if (tmp) entries.push(tmp);
        }
        return new TemplateStringExpr(entries);
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

    parseEnumStmt( modifier : Modifier ) : EnumStmt
    {
        let values : EnumDecl[] = [];
        this.consume(TokenType.ENUM);
        let name = this.parseName();
        this.consume(TokenType.LEFT_BRACE);
        while (this.peekType() == TokenType.NAME)
        {
            let name = this.parseName();
            let init : IExpr = null;
            if (this.match(TokenType.EQUAL))
                init = this.parseExpression();
            values.push( new EnumDecl(name, init) );
            if (!this.match(TokenType.COMMA)) break;
        }
        this.consume(TokenType.RIGHT_BRACE);
        return new EnumStmt(name, values);
    }

    // used by top-level and namespaces
    parseDeclationStmt( modifier : Modifier ) : IStmt
    {
        let cur = this.peekType();
        switch (cur)
        {
            case TokenType.LET:
            case TokenType.CONST:
            {
                let stmt = this.parseVariableStmt(modifier);
                for (let decl of stmt.decls)
                    this.unit.variables.set(decl.name.qualified, decl);
                return stmt;
            }
            case TokenType.FUNCTION:
            {
                let stmt = this.parseFunction(modifier);
                Logger.writeln(`Adding function ${stmt.name.qualified}`);
                this.unit.functions.set(stmt.name.qualified, stmt);
                return stmt;
            }
            case TokenType.CLASS:
            case TokenType.INTERFACE:
                {
                let stmt = this.parseClass(modifier);
                let qname = stmt.name.qualified;
                if (stmt.isGeneric)
                    this.unit.generics.set(qname, stmt);
                else
                {
                    this.unit.types.set(qname, stmt);
                    //this.ctx.types.set(qname, stmt);
                }
                return stmt;
            }
            case TokenType.ENUM:
            {
                let stmt = this.parseEnumStmt(modifier);
                this.unit.enums.set(stmt.name.qualified, stmt);
                return stmt;
            }
        }

        throw this.error(this.peek().location, `Unexpected token ${this.peek().type.name}`);


        //return this.parseStatement();
    }

    parseAccessorPrefix() : Token
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

    parseClass( modifier : Modifier ) : ClassStmt
    {
        let type = this.advance().type;
        let name = this.parseName();
        //let generics = this.parseGenerics();
        let generics = null;
        let extended : TypeRef = null;
        let implemented : TypeRef[] = null;

        if (this.match(TokenType.EXTENDS))
            extended = this.parseTypeRef();
        else
        if(type != TokenType.INTERFACE)
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
            let modifier = this.parseModifier();
            let accessor = this.parseAccessorPrefix();

            if (this.peekType() == TokenType.NAME)
            {
                let tname = this.advance();
                let temp = name.clone();
                temp.lexemes.push(tname.lexeme);
                temp.location = tname.location;
                if (this.peekType() == TokenType.LEFT_PAREN || this.peekType() == TokenType.LESS)
                {
                    let func = this.parseMethod(temp);
                    func.modifier = modifier;
                    if (accessor) func.accessor = accessor.type;
                    stmts.push(func);
                }
                else
                {
                    if (accessor) this.error(accessor.location, 'Accessor or signature expected');
                    let vari = this.parseProperty(temp, modifier);
                    vari.modifier = modifier;
                    stmts.push(vari);
                }
            }
            else
                throw this.error(this.peek().location, 'Invalid token ' + this.peekType().name);
        }
        this.consume(TokenType.RIGHT_BRACE);

        let result = new ClassStmt(name, generics, extended, implemented, stmts, modifier);
        result.isInterface = type.lexeme == 'interface';
        for (let stmt of stmts)
            if (stmt instanceof VariableStmt || stmt instanceof FunctionStmt) stmt.parent = result;
        return result;
    }

    parseMethod( name : Name ) : FunctionStmt
    {
        //let generics = this.parseGenerics();
        let generics = null;

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
            type = new TypeRef(TypeId.VOID, new Name(['void']), 0, this.peek().location);

        let block : BlockStmt = null;
        if (this.peekType() == TokenType.LEFT_BRACE)
            block = this.parseBlock();
        else
            this.consume(TokenType.SEMICOLON);

        return new FunctionStmt(name, generics, args, type, block);
    }

    parseModifier() : Modifier
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
        return new Modifier(values);
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
                init = this.parseVariableStmt(null, false);
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
        if (this.peekType() == TokenType.OF || this.peekType() == TokenType.IN)
        {
            // for (variable of iterable) statement
            if (!init || !(init instanceof VariableStmt))
                throw this.error(this.peek().location, 'Missing variable declaration');
            if (init.decls == null || init.decls.length != 1)
                throw this.error(this.peek().location, 'Invalid variable declaration');
            if (init.decls[0].init)
                throw this.error(this.peek().location, 'The variable declaration of a \'for...of\' statement cannot have an initializer.');
            this.consume(TokenType.OF,TokenType.IN);
            expr = this.parseExpression();
            this.consume(TokenType.RIGHT_PAREN);
            stmt = this.parseBlockOrStmt();
            return new ForOfStmt(<VariableStmt>init, expr, stmt);
        }

        throw this.error(this.peek().location, `Invalid for statement ${this.peek().lexeme}`);
    }

    parseProperty( name : Name, modifier : Modifier ) : PropertyStmt
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

        return new PropertyStmt(name, type, value, modifier, name.location);
    }

    parseVariableDecl( constant : boolean, modifier : Modifier ) : VariableDecl
    {
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
        return new VariableDecl(name, type, value, constant, modifier);
    }

    parseVariableStmt( modifier : Modifier, semicolon : boolean = true ) : VariableStmt
    {
        let decls : VariableDecl[] = [];
        let constant = this.advance().type == TokenType.CONST;
        let loc = this.peek().location;
        do {
            decls.push( this.parseVariableDecl(constant, modifier) );
        } while(this.match(TokenType.COMMA));
        if (semicolon) this.consume(TokenType.SEMICOLON);
        return new VariableStmt(decls, loc);
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

let errorName = new Name(['Error']);
let objectName = new Name(['Object']);
let objectRef = new TypeRef(TypeId.OBJECT, objectName, 0);
let callableName = new Name(['ICallable']);
let stringName = new Name(['string']);

export function createObject() : ClassStmt
{
    return new ClassStmt(objectName, null, null, null, [], new Modifier([TokenType.EXPORT]));
}

export function createString() : ClassStmt
{
    let stmt1 = new FunctionStmt(
        new Name(['indexOf']),
        null,
        [new Parameter(new Name(['value']), new TypeRef(TypeId.STRING, new Name(['string']), 0), null, false)],
        new TypeRef(TypeId.NUMBER, new Name(['number']), 0),
        null);
    let stmt2 = new VariableStmt(
        [ new VariableDecl(new Name(['length'], null), new TypeRef(TypeId.NUMBER, new Name(['number']), 0), null, false) ]
        );
    return new ClassStmt(stringName, null, null, null, [stmt1, stmt2], new Modifier([TokenType.EXPORT]));
}

export function createCallable() : ClassStmt
{
    return new ClassStmt(callableName, null, objectRef, null, [], new Modifier([TokenType.EXPORT]));
}

export function createError() : ClassStmt
{
    return new ClassStmt(errorName, null, null, null, [], new Modifier([TokenType.EXPORT]));
}