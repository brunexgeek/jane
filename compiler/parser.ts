/// <reference path="types.ts" />
/// <reference path="tokenizer.ts" />


namespace beagle.compiler {

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

    constructor( tok : Tokenizer, ctx : CompilationContext )
    {
        this.tok = tok;
        this.ctx = ctx;
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

    consume( type : TokenType, message : string = '' ) : Token
    {
        if (this.peek().type == type)
        {
            let tt = this.peek();
            this.advance();
            return tt;
        }
        else
        {
            let found = this.peek().type.lexeme;
            if (this.peek().type == TokenType.NAME) found = this.peek().lexeme;

            if (message.length == 0)
                throw this.error(this.peek(), `Expected '${type.lexeme}', but found '${found}'`);
            else
                throw this.error(this.peek(), message);
        }
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
        this.ctx.listener.onError(token.location, message);
        return new ParseError(message, token.location);
    }

    synchronize()
    {
        let prev = this.advance();

        while (this.peek().type != TokenType.EOF)
        {
            //if (prev.type == TokenType.SEMICOLON) return;

            switch (this.peek().type)
            {
            case TokenType.FUNCTION:
            case TokenType.LET:
            case TokenType.FOR:
            case TokenType.IF:
            case TokenType.WHILE:
            case TokenType.RETURN:
                return;
            }

            this.advance();
        }
    }

    parseTopLevel() : Unit
    {
        let stmts : IStmt[] = [];
        let tt : Token;
        let hasError = false;

        do {
            try
            {
                if (this.peek().type == TokenType.NAMESPACE)
                    stmts.push( this.parseNamespace() );
                else
                    stmts.push( this.parseDeclationStmt() );
            } catch (error)
            {
                console.error(error);
                hasError = true;
                this.synchronize();
            }
        } while (this.peek().type != TokenType.EOF);

        if (hasError) throw Error('The code has one or more errors');

        return new Unit(stmts);
    }

    parseNamespace() : IStmt
    {
        let stmts : IStmt[] = [];
        this.consume(TokenType.NAMESPACE);
        let name = this.parseName(true);
        this.consume(TokenType.LEFT_BRACE);

        do {
                stmts.push( this.parseDeclationStmt() );
        } while (!this.match(TokenType.RIGHT_BRACE));

        return new NamespaceStmt(name, stmts);
    }

    parseArgument() : Parameter
    {
        let name = this.consume(TokenType.NAME, 'Missing argument name');
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

        return new Parameter( new Name([name.lexeme]), type, value);
    }

    parseFunction() : FunctionStmt
    {
        this.consume(TokenType.FUNCTION, 'Missing function keyword');
        let name = this.consume(TokenType.NAME, 'Missing function name');

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

        let block = this.parseBlock();

        return new FunctionStmt(new Name([name.lexeme]), args, type, block);
    }

    parseName( qualified : boolean = false ) : Name
    {
        let lexemes : string[] = [];
        do {
            lexemes.push( this.consume(TokenType.NAME, 'Expected identifier').lexeme );
        } while (qualified && this.match(TokenType.DOT));
        return new Name(lexemes);
    }

    parseTypeRef() : TypeRef
    {
        return new TypeRef(this.parseName(true));
    }

    parseExpression() : IExpr
    {
        return this.parseAssignment();
    }

    parseAssignment() : IExpr
    {
        let tt = this.peek();
        let expr = this.parseOr();

        let operator = this.peek().type;
        switch (operator)
        {
            case TokenType.EQUAL:
            case TokenType.PLUS_EQUAL:
            case TokenType.MINUS_EQUAL:
            case TokenType.SLASH_EQUAL:
            case TokenType.STAR_EQUAL:
                this.advance();
                let right = this.parseAssignment();
                if (expr instanceof NameLiteral || expr instanceof FieldExpr)
                    return expr = new AssignExpr(expr, operator, right);
                throw this.error(tt, 'Invalid assignment l-value');
        }

        return expr;
    }

    parseOr() : IExpr
    {
        let expr = this.parseAnd();

        let operator = this.peek().type;
        while (this.match(TokenType.OR))
        {
            let right = this.parseAnd();
            expr = new LogicalExpr(expr, operator, right);
        }

        return expr;
    }

    parseAnd() : IExpr
    {
        let expr = this.parseEquality();

        let operator = this.peek().type;
        while (this.match(TokenType.AND))
        {
            let right = this.parseEquality();
            expr = new LogicalExpr(expr, operator, right);
        }

        return expr;
    }

    parseEquality() : IExpr
    {
        let expr = this.parseComparison();

        let operator = this.peek().type;
        while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL))
        {
            let right = this.parseComparison();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    parseComparison() : IExpr
    {
        let expr = this.parseAddition();

        let operator = this.peek().type;
        while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL))
        {
            let right = this.parseAddition();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    parseAddition() : IExpr
    {
        let expr = this.parseMultiplication();

        let operator = this.peek().type;
        while (this.match(TokenType.PLUS, TokenType.MINUS))
        {
            let right = this.parseMultiplication();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    parseMultiplication() : IExpr
    {
        let expr = this.parsePreUnary();

        let operator = this.peek().type;
        while (this.match(TokenType.STAR, TokenType.SLASH))
        {
            let right = this.parsePreUnary();
            expr = new BinaryExpr(expr, operator, right);
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
            if (this.match(TokenType.DOT))
            {
                let name = new Name([this.consume(TokenType.NAME, 'Expect name after \'.\'.').lexeme]);
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

        if (this.match(TokenType.FALSE)) return new BoolLiteral(false);
        if (this.match(TokenType.TRUE)) return new BoolLiteral(true);
        if (this.match(TokenType.NIL)) return new NullLiteral();
        if (this.peek().type == TokenType.NAME) return new NameLiteral(this.advance().lexeme);

        if (this.match(TokenType.NUMBER))
            return new NumberLiteral( tt.lexeme, parseInt(tt.lexeme) );
        if (this.match(TokenType.SSTRING, TokenType.TSTRING, TokenType.DSTRING))
            return new StringLiteral(tt.lexeme, tt.type);

        if (this.match(TokenType.LEFT_PAREN))
        {
            let expr = this.parseExpression();
            this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
            return new Group(expr);
        }

        throw this.error(this.peek(), 'Invalid expression with ' + this.peek().type.lexeme);
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

    parseDeclationStmt() : IStmt
    {
        let cur = this.peek().type;
        switch (cur)
        {
            case TokenType.LET:
            case TokenType.CONST:
                return this.parseVariable();
            case TokenType.FUNCTION:
                return this.parseFunction();
            case TokenType.CLASS:
            case TokenType.INTERFACE:
                return this.parseClass();
        }

        return this.parseStatement();
    }

    parseClass() : ClassStmt
    {
        let type = this.advance().type;
        let name = new Name([this.consume(TokenType.NAME, 'Missing class name').lexeme]);
        let extended : Name = null;
        let implemented : Name[] = null;

        if (this.match(TokenType.EXTENDS))
        {
            extended = this.parseName(true);
        }

        if (this.match(TokenType.IMPLEMENTS))
        {
            implemented = [];
            do {
                implemented.push(this.parseName(true));
            } while (this.match(TokenType.COMMA));
        }

        this.consume(TokenType.LEFT_BRACE);

        let funcs : FunctionStmt[] = [];
        let vars : VariableStmt[] = [];
        while (!this.eof() && this.peek().type != TokenType.RIGHT_BRACE)
        {
            let accessor = this.parseAccessor();

            if (this.peek().type == TokenType.NAME)
            {
                let name = this.advance();
                if (this.peek().type == TokenType.LEFT_PAREN)
                {
                    let func = this.parseMethod(name);
                    func.accessor = accessor;
                    funcs.push(func);
                }
                else
                {
                    let vari = this.parseVariable(name);
                    vari.accessor = accessor;
                    vars.push(vari);
                }
            }
        }
        this.consume(TokenType.RIGHT_BRACE);

        return new ClassStmt(name, extended, implemented, vars, funcs);
    }

    parseMethod( name : Token ) : FunctionStmt
    {
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

        let block = this.parseBlock();

        return new FunctionStmt(new Name([name.lexeme]), args, type, block);
    }

    parseAccessor() : Accessor
    {
        let values : TokenType[] = [];
        while (true)
        {
            let cur = this.peek().type;
            if (!this.match(TokenType.PUBLIC, TokenType.PRIVATE, TokenType.PROTECTED, TokenType.READONLY))
                break;
            values.push(cur);
        }
        if (values.length == 0) return null;
        return new Accessor(values);
    }

    parseVariableOrStatement() : IStmt
    {
        if (this.peek().type == TokenType.LET || this.peek().type == TokenType.CONST)
            return this.parseVariable();
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
                break;
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
        let variable = this.parseVariable();
        this.consume(TokenType.RIGHT_PAREN);
        let stmt = this.parseBlockOrStmt();

        return new ForOfStmt(variable, stmt);
    }

    parseVariable( tname : Token = null) : VariableStmt
    {
        let constant : boolean = false;

        if (!tname)
        {
            constant = this.advance().type == TokenType.CONST;
            tname = this.consume(TokenType.NAME, 'Missing variable name');
        }

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

        return new VariableStmt(name, type, value, constant);
    }
}


}