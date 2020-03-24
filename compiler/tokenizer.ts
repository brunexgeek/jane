namespace beagle.compiler {

export class SourceLocation
{
    constructor( public fileName : string, public line : number = 1, public column : number = 1 )
    {
    }

    clone() : SourceLocation
    {
        return new SourceLocation(this.fileName, this.line, this.column);
    }

    toString() : string
    {
        return this.line + ':' + this.column;
    }
}

export class Scanner
{
    source : string;
    index : number;
    context : CompilationContext;
    pos : SourceLocation;

    constructor( ctx : CompilationContext, fileName : string, source : string )
    {
        this.source = source;
        this.index = 0;
        this.pos = new SourceLocation(fileName, 1, 1);
    }

    get position() : SourceLocation
    {
        return this.pos.clone();
    }

    eof() : boolean
    {
        return this.index >= this.source.length;
    }

    peek() : string
    {
        if (this.index < this.source.length)
            return this.source.charAt(this.index);
        return null
    }

    advance() : string
    {
        if (this.eof()) return null;
        let c = this.source.charAt(this.index++);
        if (c == '\n')
        {
            this.pos.line++;
            this.pos.column = 0;
        }
        else
            this.pos.column++;
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
        if (this.source.charAt(this.index) != expected) return false;
        this.index++;
        return true;
    }
}

export class TokenType
{
    public readonly name : string;
	public readonly lexeme : string;
    private static entries: { [name: string] : TokenType } = {};

    // Single-character tokens
    static readonly LEFT_PAREN = new TokenType('LEFT_PAREN');
    static readonly RIGHT_PAREN = new TokenType('RIGHT_PAREN');
    static readonly LEFT_BRACE = new TokenType('LEFT_BRACE');
    static readonly RIGHT_BRACE = new TokenType('RIGHT_BRACE');
    static readonly COMMA = new TokenType('COMMA');
    static readonly DOT = new TokenType('DOT');
    static readonly MINUS = new TokenType('MINUS');
    static readonly PLUS = new TokenType('PLUS');
    static readonly SEMICOLON = new TokenType('SEMICOLON');
    static readonly SLASH = new TokenType('SLASH');
    static readonly STAR = new TokenType('STAR');
    static readonly COLON = new TokenType('COLON');
    static readonly ASSIGN = new TokenType('ASSIGN');
    static readonly QUESTION = new TokenType('QUESTION');
    static readonly PERCENT = new TokenType('PERCENT');
    static readonly AND = new TokenType('AND');
    static readonly OR = new TokenType('OR');
    static readonly EOF = new TokenType('EOF');
    // One or two character tokens
    static readonly BANG = new TokenType('BANG');
    static readonly BANG_EQUAL = new TokenType('BANG_EQUAL');
    static readonly EQUAL = new TokenType('EQUAL');
    static readonly EQUAL_EQUAL = new TokenType('EQUAL_EQUAL');
    static readonly GREATER = new TokenType('GREATER');
    static readonly GREATER_EQUAL = new TokenType('GREATER_EQUAL');
    static readonly LESS = new TokenType('LESS');
    static readonly LESS_EQUAL = new TokenType('LESS_EQUAL');
    static readonly PLUS_ASSIGN = new TokenType('PLUS_ASSIGN');
    static readonly MINUS_ASSIGN = new TokenType('MINUS_ASSIGN');
    static readonly STAR_ASSIGN = new TokenType('STAR_ASSIGN');
    static readonly SLASH_ASSIGN = new TokenType('SLASH_ASSIGN');

    // Literals
    static readonly IDENTIFIER = new TokenType('IDENTIFIER');
    static readonly STRING = new TokenType('STRING');
    static readonly NUMBER = new TokenType('NUMBER');

    // Keywords
    static readonly ELSE = new TokenType('ELSE', 'else');
    static readonly FALSE = new TokenType('FALSE', 'true');
    static readonly FUNCTION = new TokenType('FUNCTION', 'function');
    static readonly FOR = new TokenType('FOR', 'for');
    static readonly IF = new TokenType('IF', 'if');
    static readonly NIL = new TokenType('NIL', 'null');
    static readonly PRINT = new TokenType('PRINT', 'print');
    static readonly RETURN = new TokenType('RETURN', 'return');
    static readonly TRUE = new TokenType('TRUE', 'true');
    static readonly LET = new TokenType('LET', 'let');
    static readonly WHILE = new TokenType('WHILE', 'while');

    private constructor(name : string, lexeme : string = "")
    {
        this.name = name;
		this.lexeme = lexeme;
        if (this.lexeme.length > 0) TokenType.entries[lexeme] = this;
	}

	public static resolve( name : string ) : TokenType
	{
		let item = TokenType.entries[name];
		if (item != null && item.lexeme.length > 0) return item;
		return TokenType.IDENTIFIER;
	}
}

export class Token
{
    type : TokenType;
    lexeme : string;
    literal : string;
    location : SourceLocation;

    constructor(type : TokenType, lexeme : string, location : SourceLocation)
    {
      this.type = type;
      this.lexeme = lexeme;
      this.location = location;
    }

    toString() : string
    {
      return `[${this.type.name}] ${this.lexeme}`;
    }
}

export class Tokenizer
{
    ctx : CompilationContext;
    scanner : Scanner;
    stack : Token[] = []
    end : Token = new Token(TokenType.EOF, null, null);

    constructor( ctx : CompilationContext, scanner : Scanner )
    {
        this.ctx = ctx;
        this.scanner = scanner;
    }

    next() : Token
    {
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
                    return this.token(TokenType.RIGHT_BRACE);
                case ',':
                    return this.token(TokenType.COMMA);
                case '.':
                    return this.token(TokenType.DOT);
                case '-':
                    if (this.scanner.match('=')) return this.token(TokenType.MINUS_ASSIGN);
                    return this.token(TokenType.MINUS);
                case '+':
                    if (this.scanner.match('=')) return this.token(TokenType.PLUS_ASSIGN);
                    return this.token(TokenType.PLUS);
                case ';':
                    return this.token(TokenType.SEMICOLON);
                case ':':
                    return this.token(TokenType.SEMICOLON);
                case '=':
                    return this.token(TokenType.ASSIGN);
                case '*':
                    if (this.scanner.match('=')) return this.token(TokenType.STAR_ASSIGN);
                    return this.token(TokenType.STAR);
                case '/':
                    if (this.scanner.match('=')) return this.token(TokenType.SLASH_ASSIGN);
                    return this.token(TokenType.SLASH);
                case '\'':
                case '"':
                    return this.string();
                case '?':
                    return this.token(TokenType.QUESTION);
                case '%':
                    return this.token(TokenType.PERCENT);
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
                    return this.identifier();
                case ' ':
                case '\t':
                case '\n':
                case '\r':
                    continue;
                default:
                    throw Error('Invalid character \'' + c + '\' at ' + this.scanner.pos.toString());
            }
        }
        return this.end;
    }

    token( type : TokenType, lexeme? : string ) : Token
    {
        if (lexeme == undefined) lexeme = null;
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
                if (escape)
                {
                    value += '\\';
                    escape = false;
                }
                else
                    escape = true;
            }
            else
                value += c;
        }

        this.scanner.advance();
        return new Token(TokenType.STRING, value, this.scanner.position);
    }

    private isIdentifier( c : string ) : boolean
    {
        return ((c >= 'A' && c <= 'Z') ||
            (c >= 'a' && c <= 'z') ||
            (c >= '0' && c <= '9') ||
             c == '_');
    }

    private identifier() : Token
    {
        let lexeme = this.scanner.previous();
        let location = this.scanner.position;

        while (this.isIdentifier(this.scanner.peek()))
        {
            lexeme += this.scanner.advance();
        }

        let type = TokenType.resolve(lexeme);
        if (type == TokenType.IDENTIFIER)
            return new Token(TokenType.IDENTIFIER, lexeme, location);
        else
            return new Token(type, null, location);
    }

    private isDigit( c : string ) : boolean
    {
        return (c >= '0' && c <= '9');
    }

    private number() : Token
    {
        let lexeme = this.scanner.previous();
        let location = this.scanner.position;

        while (this.isDigit(this.scanner.peek()))
        {
            lexeme += this.scanner.advance();
        }
        return new Token(TokenType.NUMBER, lexeme, location);
    }

}

}