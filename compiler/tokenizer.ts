/*
 *   Copyright 2019-2021 Bruno Ribeiro
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

import { CompilationContext, SourceLocation } from './compiler';
import { Logger } from './utils';

export class Scanner
{
    source : string;
    fileName : string;
    index : number;
    context : CompilationContext;
    lbreaks : number[] = [0];

    constructor( ctx : CompilationContext, fileName : string, source : string )
    {
        this.source = source;
        this.index = 0;
        this.fileName = fileName;
    }

    get position() : SourceLocation
    {
        let lb : number = 0;
        for (let i = 0; i < this.lbreaks.length; ++i)
        {
            if (this.lbreaks[i] > this.index) break;
            lb = i;
        }

        return new SourceLocation(this.fileName, lb + 1, this.index - this.lbreaks[lb]);
    }

    eof() : boolean
    {
        return this.index >= this.source.length;
    }

    peek() : string
    {
        if (this.index < this.source.length)
            return this.source.charAt(this.index);
        return null;
    }

    advance() : string
    {
        if (this.eof()) return null;
        let c = this.peek();
        ++this.index;
        if (c == '\n') this.lbreaks.push(this.index);
        return c;
    }

    previous() : string
    {
        if (this.index == 0) return null;
        return this.source.charAt(this.index - 1);
    }

    unget() : string
    {
        if (this.index > 0) this.index--;
        return this.peek();
    }

    match( expected : string ) : boolean
    {
        if (this.eof()) return false;
        if (this.peek() != expected) return false;
        this.index++;
        return true;
    }
}

export class TokenType
{
    public readonly name : string;
	public readonly lexeme : string;
    private static names : string[] = [];
    private static tokens : TokenType[] = [];

    // Single-character tokens
    static readonly LEFT_PAREN : TokenType = new TokenType('LEFT_PAREN', '(');
    static readonly RIGHT_PAREN : TokenType = new TokenType('RIGHT_PAREN', ')');
    static readonly LEFT_BRACE : TokenType = new TokenType('LEFT_BRACE', '{');
    static readonly RIGHT_BRACE : TokenType = new TokenType('RIGHT_BRACE', '}');
    static readonly LEFT_BRACKET : TokenType = new TokenType('LEFT_BRACKET', '[');
    static readonly RIGHT_BRACKET : TokenType = new TokenType('RIGHT_BRACKET', ']');
    static readonly COMMA : TokenType = new TokenType('COMMA', ',');
    static readonly DOT : TokenType = new TokenType('DOT', '.');
    static readonly SPREAD : TokenType = new TokenType('SPREAD', '...');
    static readonly MINUS : TokenType = new TokenType('MINUS', '-');
    static readonly PLUS : TokenType = new TokenType('PLUS', '+');
    static readonly SEMICOLON : TokenType = new TokenType('SEMICOLON', ';');
    static readonly SLASH : TokenType = new TokenType('SLASH', '/');
    static readonly STAR : TokenType = new TokenType('STAR', '*');
    static readonly COLON : TokenType = new TokenType('COLON', ':');
    static readonly QUESTION : TokenType = new TokenType('QUESTION', '?');
    static readonly MOD : TokenType = new TokenType('MOD', '%');
    static readonly MOD_EQUAL : TokenType = new TokenType('MOD_EQUAL', '%=');
    static readonly AND : TokenType = new TokenType('AND', '&&');
    static readonly AND_EQUAL : TokenType = new TokenType('AND', '&&=');
    static readonly BAND : TokenType = new TokenType('BAND', '&');
    static readonly BAND_EQUAL : TokenType = new TokenType('BAND_EQUAL', '&=');
    static readonly OR : TokenType = new TokenType('OR', '||');
    static readonly OR_EQUAL : TokenType = new TokenType('OR', '||=');
    static readonly EOF : TokenType = new TokenType('EOF');
    static readonly BOR : TokenType = new TokenType('|');
    static readonly BOR_EQUAL : TokenType = new TokenType('BOR_EQUAL', '|=');
    static readonly CHAINING : TokenType = new TokenType('CHAINING', '?.');
    static readonly NULLISH : TokenType = new TokenType('NULLISH', '??');
    static readonly NULLISH_EQUAL : TokenType = new TokenType('NULLISH_EQUAL', '??=');
    static readonly XOR : TokenType = new TokenType('XOR', '^');
    static readonly XOR_EQUAL : TokenType = new TokenType('XOR_EQUAL', '^=');

    static readonly BANG : TokenType = new TokenType('BANG', '!');
    static readonly INEQUALITY : TokenType = new TokenType('INEQUALITY', '!=');
    static readonly S_INEQUALITY : TokenType = new TokenType('S_INEQUALITY', '!==');
    static readonly EQUAL : TokenType = new TokenType('EQUAL', '=');
    static readonly EQUALITY : TokenType = new TokenType('EQUALITY', '==');
    static readonly S_EQUALITY : TokenType = new TokenType('S_EQUALITY', '===');
    static readonly GREATER : TokenType = new TokenType('GREATER', '>');
    static readonly SHR : TokenType = new TokenType('SHR', '>>');
    static readonly SHR_EQUAL : TokenType = new TokenType('SHR_EQUAL', '>>=');
    static readonly USHR : TokenType = new TokenType('USHR', '>>>');
    static readonly USHR_EQUAL : TokenType = new TokenType('USHR_EQUAL', '>>>=');
    static readonly GREATER_EQUAL : TokenType = new TokenType('GREATER_EQUAL', '>=');
    static readonly LESS : TokenType = new TokenType('LESS', '<');
    static readonly SHL : TokenType = new TokenType('SHL', '<<');
    static readonly SHL_EQUAL : TokenType = new TokenType('SHL_EQUAL', '<<=');
    static readonly LESS_EQUAL : TokenType = new TokenType('LESS_EQUAL', '<=');
    static readonly PLUS_EQUAL : TokenType = new TokenType('PLUS_EQUAL', '+=');
    static readonly MINUS_EQUAL : TokenType = new TokenType('MINUS_EQUAL', '-=');
    static readonly MUL_EQUAL : TokenType = new TokenType('MUL_EQUAL', '*=');
    static readonly DIV_EQUAL : TokenType = new TokenType('DIV_EQUAL', '/=');
    static readonly INCREMENT : TokenType = new TokenType('INCREMENT', '++');
    static readonly DECREMENT : TokenType = new TokenType('DECREMENT', '--');
    static readonly EXPONENT : TokenType = new TokenType('EXPONENT', '**');
    static readonly EXPONENT_EQUAL : TokenType = new TokenType('EXPONENT_EQUAL', '**=');
    static readonly TILDE : TokenType = new TokenType('TILDE', '~');

    // Literals
    static readonly NAME : TokenType = new TokenType('NAME');
    static readonly TSTRING : TokenType = new TokenType('TSTRING');
    static readonly TSTRING_BEGIN : TokenType = new TokenType('TSTRING_BEGIN');
    static readonly TSTRING_END : TokenType = new TokenType('TSTRING_END');
    static readonly SSTRING : TokenType = new TokenType('SSTRING');
    static readonly DSTRING : TokenType = new TokenType('DSTRING');
    static readonly NUMBER : TokenType = new TokenType('NUMBER');

    // Keywords
    static readonly ENUM : TokenType = new TokenType('ENUM', 'enum', true);
    static readonly GET : TokenType = new TokenType('GET', 'get');
    static readonly SET : TokenType = new TokenType('SET', 'set');
    static readonly ELSE : TokenType = new TokenType('ELSE', 'else', true);
    static readonly FALSE : TokenType = new TokenType('FALSE', 'false', true);
    static readonly FUNCTION : TokenType = new TokenType('FUNCTION', 'function', true);
    static readonly FOR : TokenType = new TokenType('FOR', 'for', true);
    static readonly OF : TokenType = new TokenType('OF', 'of', true);
    static readonly IF : TokenType = new TokenType('IF', 'if', true);
    static readonly NIL : TokenType = new TokenType('NIL', 'null', true);
    static readonly RETURN : TokenType = new TokenType('RETURN', 'return', true);
    static readonly TRUE : TokenType = new TokenType('TRUE', 'true', true);
    static readonly LET : TokenType = new TokenType('LET', 'let', true);
    static readonly WHILE : TokenType = new TokenType('WHILE', 'while', true);
    static readonly DO : TokenType = new TokenType('DO', 'do', true);
    static readonly CONST : TokenType = new TokenType('CONST', 'const', true);
    static readonly CLASS : TokenType = new TokenType('CLASS', 'class', true);
    static readonly PUBLIC : TokenType = new TokenType('PUBLIC', 'public', true);
    static readonly PRIVATE : TokenType = new TokenType('PRIVATE', 'private', true);
    static readonly PROTECTED : TokenType = new TokenType('PROTECTED', 'protected', true);
    static readonly READONLY : TokenType = new TokenType('READONLY', 'readonly', true);
    static readonly EXTENDS : TokenType = new TokenType('EXTENDS', 'extends', true);
    static readonly IMPLEMENTS : TokenType = new TokenType('IMPLEMENTS', 'implements', true);
    static readonly INTERFACE : TokenType = new TokenType('INTERFACE', 'interface', true);
    static readonly NAMESPACE : TokenType = new TokenType('NAMESPACE', 'namespace', true);
    static readonly EXPORT : TokenType = new TokenType('EXPORT', 'export', true);
    static readonly THROW : TokenType = new TokenType('THROW', 'throw', true);
    static readonly TRY : TokenType = new TokenType('TRY', 'try', true);
    static readonly CATCH : TokenType = new TokenType('CATCH', 'catch', true);
    static readonly FINALLY : TokenType = new TokenType('FINALLY', 'finally', true);
    static readonly NEW : TokenType = new TokenType('NEW', 'new', true);
    static readonly SWITCH : TokenType = new TokenType('SWITCH', 'switch', true);
    static readonly CASE : TokenType = new TokenType('CASE', 'case', true);
    static readonly CONTINUE : TokenType = new TokenType('CONTINUE', 'continue', true);
    static readonly BREAK : TokenType = new TokenType('BREAK', 'break', true);
    static readonly INSTANCEOF : TokenType = new TokenType('INSTANCEOF', 'instanceof', true);
    static readonly IN : TokenType = new TokenType('IN', 'in', true);
    static readonly STATIC : TokenType = new TokenType('STATIC', 'static', true);
    static readonly DEFAULT : TokenType = new TokenType('DEFAULT', 'default', true);
    static readonly IMPORT : TokenType = new TokenType('IMPORT', 'import', true);
    static readonly FROM : TokenType = new TokenType('FROM', 'from', true);
    static readonly DECLARE : TokenType = new TokenType('DECLARE', 'declare', true);
    static readonly ABSTRACT : TokenType = new TokenType('ABSTRACT', 'abstract', true);
    static readonly TYPE : TokenType = new TokenType('TYPE', 'type', false);
    static readonly TYPEOF : TokenType = new TokenType('TYPEOF', 'typeof', false);

    private constructor(name : string, lexeme : string = "", kword : boolean = false )
    {
        this.name = this.lexeme = name;
        if (lexeme.length != 0) this.lexeme = lexeme;
        if (kword && lexeme != null)
        {
            TokenType.names.push(lexeme);
            TokenType.tokens.push(this);
        }
	}

	public static resolve( name : string ) : TokenType
	{
        let i = TokenType.names.indexOf(name);
        if (i < 0) return TokenType.NAME;
        return TokenType.tokens[i];
    }
}

export class Token
{
    type : TokenType;
    lexeme : string;
    location : SourceLocation;

    constructor(type : TokenType, lexeme : string, location : SourceLocation)
    {
        this.type = type;
        this.lexeme = lexeme;
        this.location = location;
    }

    toString() : string
    {
        if (this.lexeme)
            return `[${this.type.name}] ${this.lexeme}`;
        else
            return `[${this.type.name}]`;
    }
}

export class TokenizerError extends Error
{
    public location : SourceLocation;

    constructor( message : string, location : SourceLocation )
    {
        super(`${message} at ${location.toString()}`);
        this.location = location;
    }
}

export class Tokenizer
{
    ctx : CompilationContext;
    scanner : Scanner;
    fifo : Token[] = [];
    end : Token = new Token(TokenType.EOF, null, null);
    hasAborted : boolean = false;
    tslevel : number = 0;

    constructor( ctx : CompilationContext, scanner : Scanner )
    {
        this.ctx = ctx;
        this.scanner = scanner;
    }

    error( location : SourceLocation, message : string ) : TokenizerError
    {
        let result = new TokenizerError(message, location);
        this.hasAborted = !this.ctx.listener.onError(location, result);
        if (this.hasAborted) throw result;
        return result;
    }

    next() : Token
    {
        if (this.fifo.length)
            return this.fifo.shift();

        while (!this.scanner.eof())
        {
            let c = this.scanner.advance();
            switch (c)
            {
                case '(':
                    return this.token(TokenType.LEFT_PAREN);
                case ')':
                    return this.token(TokenType.RIGHT_PAREN);
                case '{':
                    return this.token(TokenType.LEFT_BRACE);
                case '}':
                    if (this.tslevel > 0)
                    {
                        this.tstring();
                        return this.fifo.shift();
                    }
                    return this.token(TokenType.RIGHT_BRACE);
                case '[':
                    return this.token(TokenType.LEFT_BRACKET);
                case ']':
                    return this.token(TokenType.RIGHT_BRACKET);
                case ',':
                    return this.token(TokenType.COMMA);
                case '.':
                    if (this.scanner.match('.'))
                    {
                        if (this.scanner.match('.')) return this.token(TokenType.SPREAD);
                        this.scanner.unget();
                    }
                    if (this.isDigit(this.scanner.peek()))
                        return this.number();
                    return this.token(TokenType.DOT);
                case '-':
                    if (this.scanner.match('=')) return this.token(TokenType.MINUS_EQUAL);
                    if (this.scanner.match('-')) return this.token(TokenType.DECREMENT);
                    return this.token(TokenType.MINUS);
                case '+':
                    if (this.scanner.match('=')) return this.token(TokenType.PLUS_EQUAL);
                    if (this.scanner.match('+')) return this.token(TokenType.INCREMENT);
                    return this.token(TokenType.PLUS);
                case '!':
                    if (this.scanner.match('='))
                    {
                        if (this.scanner.match('=')) return this.token(TokenType.S_INEQUALITY);
                        return this.token(TokenType.INEQUALITY);
                    }
                    return this.token(TokenType.BANG);
                case ';':
                    return this.token(TokenType.SEMICOLON);
                case '~':
                    return this.token(TokenType.TILDE);
                case ':':
                    return this.token(TokenType.COLON);
                case '=':
                    if (this.scanner.match('='))
                    {
                        if (this.scanner.match('=')) return this.token(TokenType.S_EQUALITY);
                        return this.token(TokenType.EQUALITY);
                    }
                    return this.token(TokenType.EQUAL);
                case '*':
                    if (this.scanner.match('*'))
                    {
                        if (this.scanner.match('=')) return this.token(TokenType.EXPONENT_EQUAL);
                        return this.token(TokenType.EXPONENT);
                    }
                    if (this.scanner.match('=')) return this.token(TokenType.MUL_EQUAL);
                    return this.token(TokenType.STAR);
                case '/':
                    if (this.scanner.match('=')) return this.token(TokenType.DIV_EQUAL);
                    if (this.scanner.match('/') || this.scanner.match('*'))
                    {
                        this.comment();
                        continue;
                    }
                    return this.token(TokenType.SLASH);
                case '\'':
                case '"':
                    return this.string();
                case '`':
                    this.fifo.push( new Token(TokenType.TSTRING_BEGIN, '', this.scanner.position) );
                    ++this.tslevel;
                    this.tstring();
                    return this.fifo.shift();
                case '|':
                    if (this.scanner.match('|'))
                    {
                        if (this.scanner.match('=')) return this.token(TokenType.OR_EQUAL);
                        return this.token(TokenType.OR);
                    }
                    if (this.scanner.match('=')) return this.token(TokenType.BOR_EQUAL);
                    return this.token(TokenType.BOR);
                case '?':
                    if (this.scanner.match('?'))
                    {
                        if (this.scanner.match('=')) return this.token(TokenType.NULLISH_EQUAL);
                        return this.token(TokenType.NULLISH);
                    }
                    if (this.scanner.match('.')) return this.token(TokenType.CHAINING);
                    return this.token(TokenType.QUESTION);
                case '%':
                    if (this.scanner.match('=')) return this.token(TokenType.MOD_EQUAL);
                    return this.token(TokenType.MOD);
                case '<':
                    if (this.scanner.match('<'))
                    {
                        if (this.scanner.match('=')) return this.token(TokenType.SHL_EQUAL);
                        return this.token(TokenType.SHL);
                    }
                    if (this.scanner.match('=')) return this.token(TokenType.LESS_EQUAL);
                    return this.token(TokenType.LESS);
                case '>':
                    if (this.scanner.match('>'))
                    {
                        if (this.scanner.match('>'))
                        {
                            if (this.scanner.match('=')) return this.token(TokenType.USHR_EQUAL);
                            return this.token(TokenType.USHR);
                        }
                        if (this.scanner.match('=')) return this.token(TokenType.SHR_EQUAL);
                        return this.token(TokenType.SHR);
                    }
                    if (this.scanner.match('=')) return this.token(TokenType.GREATER_EQUAL);
                    return this.token(TokenType.GREATER);
                case '&':
                    if (this.scanner.match('&'))
                    {
                        if (this.scanner.match('=')) return this.token(TokenType.AND_EQUAL);
                        return this.token(TokenType.AND);
                    }
                    if (this.scanner.match('=')) return this.token(TokenType.BAND_EQUAL);
                    return this.token(TokenType.BAND);
                case '^':
                    if (this.scanner.match('=')) return this.token(TokenType.XOR_EQUAL);
                    return this.token(TokenType.XOR);
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    return this.number();
                case 'A':
                case 'B':
                case 'C':
                case 'D':
                case 'E':
                case 'F':
                case 'G':
                case 'H':
                case 'I':
                case 'J':
                case 'K':
                case 'L':
                case 'M':
                case 'N':
                case 'O':
                case 'P':
                case 'Q':
                case 'R':
                case 'S':
                case 'T':
                case 'U':
                case 'V':
                case 'W':
                case 'X':
                case 'Y':
                case 'Z':
                case 'a':
                case 'b':
                case 'c':
                case 'd':
                case 'e':
                case 'f':
                case 'g':
                case 'h':
                case 'i':
                case 'j':
                case 'k':
                case 'l':
                case 'm':
                case 'n':
                case 'o':
                case 'p':
                case 'q':
                case 'r':
                case 's':
                case 't':
                case 'u':
                case 'v':
                case 'w':
                case 'x':
                case 'y':
                case 'z':
                case '$':
                case '_':
                    return this.name();
                case ' ':
                case '\t':
                case '\n':
                case '\r':
                    continue;
            }
            this.error(this.scanner.position, `Invalid character '${c}' at '${this.scanner.position.toString()}'`);
        }
        return this.end;
    }

    comment()
    {
        if (this.scanner.previous() == '/')
        {
            while (!this.scanner.eof() && this.scanner.previous() != '\n' ) this.scanner.advance();
        }
        else
        {
            let content : string;
            while (!this.scanner.eof())
            {
                while (!this.scanner.eof() && this.scanner.previous() != '*' ) content += this.scanner.advance();
                if (this.scanner.match('/'))
                {
                    // check for '@jane-skip' to discard everything in the current line
                    if (content.indexOf('@jane-skip') >= 0)
                        while (!this.scanner.eof() && this.scanner.previous() != '\n' ) this.scanner.advance();
                    return;
                }
                content += this.scanner.advance();
            }
            this.error(this.scanner.position, 'Unterminated block comment');
        }
    }

    token( type : TokenType, lexeme : string = null ) : Token
    {
        return new Token(type, lexeme, this.scanner.position);
    }

    private string() : Token
    {
        let type = this.scanner.previous();
        let escape = false;
        let value = '';

        while (this.scanner.peek() != type || escape)
        {
            let c = this.scanner.advance();
            if (c == '\\')
            {
                if (escape) value += '\\';
                escape = !escape;
            }
            else
            {
                if (escape)
                {
                    switch (c)
                    {
                        case 'n': c = '\n'; break;
                        case 'r': c = '\r'; break;
                        case 't': c = '\t'; break;
                        case 'b': c = '\b'; break;
                        case '\'':
                        case '"':
                        case '`':
                            break;
                        default:
                            this.error(this.scanner.position, 'Invalid escape sequence');
                    }
                    escape = false;
                }
                value += c;
            }
        }

        this.scanner.advance();
        let ttype = TokenType.SSTRING;
        if (type == '"')
            ttype = TokenType.DSTRING;

        return new Token(ttype, value, this.scanner.position);
    }

    private tstring() : void
    {
        let escape = false;
        let value = '';

        while (!this.scanner.eof() && this.scanner.peek() != '`' || escape)
        {
            let c = this.scanner.advance();
            if (c == '$' && this.scanner.peek() == '{')
            {
                this.scanner.advance();
                this.fifo.push( new Token(TokenType.TSTRING, value, this.scanner.position) );
                return;
            }
            else
            if (c == '\\')
            {
                if (escape) value += '\\';
                escape = !escape;
            }
            else
            {
                if (escape)
                {
                    switch (c)
                    {
                        case 'n': c = '\n'; break;
                        case 'r': c = '\r'; break;
                        case 't': c = '\t'; break;
                        case 'b': c = '\b'; break;
                        case '\'':
                        case '"':
                        case '`':
                            break;
                        default:
                            this.error(this.scanner.position, 'Invalid escape sequence');
                    }
                    escape = false;
                }
                value += c;
            }
        }

        if (this.scanner.advance() == '`')
        {
            --this.tslevel;
            this.fifo.push( new Token(TokenType.TSTRING, value, this.scanner.position) );
            this.fifo.push( new Token(TokenType.TSTRING_END, '', this.scanner.position) );
        }
        else
            this.error(this.scanner.position, 'Invalid template string');
    }

    private isIdentifier( c : string ) : boolean
    {
        return ((c >= 'A' && c <= 'Z') ||
            (c >= 'a' && c <= 'z') ||
            (c >= '0' && c <= '9') ||
             c == '_');
    }

    private name() : Token
    {
        // NOTE: the caller ensures the first character is not a digit

        let lexeme = this.scanner.previous();
        let location = this.scanner.position;

        while (this.isIdentifier(this.scanner.peek()))
        {
            lexeme += this.scanner.advance();
        }

        let type = TokenType.resolve(lexeme);
        if (type == TokenType.NAME)
            return new Token(TokenType.NAME, lexeme, location);
        else
            return new Token(type, null, location);
    }

    private isDigit( c : string ) : boolean
    {
        return (c >= '0' && c <= '9');
    }

    private isHexDigit( c : string ) : boolean
    {
        return (c >= '0' && c <= '9') ||
            (c >= 'a' && c <= 'f') ||
            (c >= 'A' && c <= 'F');
    }

    private isBinDigit( c : string ) : boolean
    {
        return (c >= '0' && c <= '1');
    }

    private isOctDigit( c : string ) : boolean
    {
        return (c >= '0' && c <= '7');
    }

    private number() : Token
    {
        // NOTE: the caller ensures the first character is a digit

        let lexeme = this.scanner.previous();
        let location = this.scanner.position;
        let base = '';

        // capture the integer part

        if (this.scanner.previous() == '0')
        {
            base = this.scanner.peek();
            // detect base
            if (base == 'x')
            {
                lexeme += this.scanner.advance();
                while (this.isHexDigit(this.scanner.peek()))
                    lexeme += this.scanner.advance();
            }
            else
            if (base == 'b')
            {
                lexeme += this.scanner.advance();
                while (this.isBinDigit(this.scanner.peek()))
                    lexeme += this.scanner.advance();
            }
            else
            if (base == 'o')
            {
                lexeme += this.scanner.advance();
                while (this.isOctDigit(this.scanner.peek()))
                    lexeme += this.scanner.advance();
            }
            else
            {
                base = '';
                while (this.isDigit(this.scanner.peek()))
                    lexeme += this.scanner.advance();
            }
        }
        else
        {
            // decimal value
            while (this.isDigit(this.scanner.peek()))
                lexeme += this.scanner.advance();
        }

        // capture the decimal part, if any
        let ifp = false;
        if (base == '' && this.scanner.peek() == '.')
        {
            ifp = true;
            lexeme += this.scanner.advance();
            while (this.isDigit(this.scanner.peek()))
                lexeme += this.scanner.advance();
        }

        // exponent part
        if (base == '' && this.scanner.peek() == 'e')
        {
            lexeme += this.scanner.advance();
            if (this.scanner.peek() == '-' || this.scanner.peek() == '+')
                lexeme += this.scanner.advance();
            while (this.isDigit(this.scanner.peek()))
                lexeme += this.scanner.advance();
        }

        // float-point suffix
        if (this.scanner.peek() == 'f' || this.scanner.peek() == 'F')
            lexeme += this.scanner.advance();
        // bigint suffix
        if (!ifp && this.scanner.peek() == 'u' || this.scanner.peek() == 'U')
            lexeme += this.scanner.advance();

        return new Token(TokenType.NUMBER, lexeme, location);
    }

}
