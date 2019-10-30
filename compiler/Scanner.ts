/// <reference path="tree.ts" />


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
}

export enum LookaheadStatus
{
	MATCH,
	NO_MATCH,
	EOI
}

export class ScanString
{

	/**
	 * Begin of input.
	 */
	static BOI : string = '\x01';

	/**
	 * End of input.
	 */
	static EOI : string = '\x04';

	/**
	 * Begin of line.
	 */
	static BOL : string = '\x02';

	/**
	 * End of line.
	 */
	static EOL : string = '\x0A';

	/**
	 * The input buffer.
	 */
	buffer : number[] = [];

	/**
	 * Index of next character to be read
	 */
	index : number;

	// TODO: remove this property, use 'buffer.length' instead
	bufferSize : number = 0;

	context : CompilationContext;

	location : SourceLocation;

	/**
	 * Create a scanner from the input array.
	 */
	constructor(context : CompilationContext, fileName : string, content : string)
	{
		this.context = context;
		this.location = new SourceLocation(fileName);
		//unescape(input);

        this.preprocess(content);
		this.index = -1;
	}

	/**
	 * Cleanup the input source code and ensures every line have its markers ({@link BOL} and {@link EOL}).
	 * @param content
	 * @return
	 */
	preprocess(content : string)
	{
		let total = content.length;

		// discard every EOL at the end of the input
		while (total > 0 && content[total-1] == '\n') --total;

		// check if the content is empty
		if (total == 0)
		{
            this.buffer.length = 2;
            this.buffer[0] = ScanString.EOL.charCodeAt(0);
            this.buffer[1] = ScanString.EOI.charCodeAt(0);
			return;
		}

        // ensure space for ending EOL+EOI markers
        this.buffer.length = content.length + 2;

        let i = 0, j = 0;

		while (i < total)
		{
			let value = content[i];

			// ignores most control characters
			if (value != '\t' && value != '\n' && value < ' ')
				this.buffer[j] = 0x32;
			else
				this.buffer[j] = value.charCodeAt(0);

			++j;
			++i;
		}
		this.buffer[j++] = 0x0A;
        this.buffer[j] = ScanString.EOI.charCodeAt(0);
        this.bufferSize = j++;
	}

	/**
	 * Returns the current character, but do not advances.
	 * @return
	 */
	peek() : string
	{
		return this.peekAt(0);
	}

	/**
	 * Returns some future character, but do not advances.
	 * @return
	 */
	peekAt( offset : number ) : string
	{
		let i = this.index + offset;
		if (i < 0)
			return ScanString.BOI;
		if (i < this.bufferSize)
			return String.fromCharCode(this.buffer[this.index + offset]);
		else
			return ScanString.EOI;
	}

	lookahead( ...values : string[] ) : LookaheadStatus
	{
		if (this.index + 1 >= this.bufferSize)
			return LookaheadStatus.EOI;
		if (this.index + values.length >= this.bufferSize)
			return LookaheadStatus.NO_MATCH;

		for (let i = 0; i < values.length; ++i)
		{
			if (this.buffer[this.index + i] != values[i].charCodeAt(0))
				return LookaheadStatus.NO_MATCH;
		}
		return LookaheadStatus.MATCH;
	}

	push(value : number) : boolean
	{
		if (this.index > 0)
		{
			this.index--;
            this.buffer[this.index] = value;
            return true;
		}
		else
			return false;
	}

	next() : string
	{
		return this.nextAt(1);
	}

	nextAt( count : number ) : string
	{
		if (count <= 0) return this.peek();

		while(count > 0 && this.index + 1 < this.bufferSize)
		{
			++this.index;
			--count;
			this.update(this.buffer[this.index]);
        }

        if (count > 0)
        {
            this.index++;
            return ScanString.EOI;
        }
		return String.fromCharCode(this.buffer[this.index]);
    }

    hasNext() : boolean
    {
        return this.index + 1 < this.bufferSize;
    }

/*
    public void unescape( char[] data )
    {
		Integer i = new Integer(0);
		int j = 0;
		while (i < data.length)
		{
			if (data[i] == '\\' && i + 1 < data.length && data[i + 1] == 'u')
			{
				data[j++] = unescape(data, i);
				continue;
			}
			if (j != i)
			{
				data[j++] = data[i++];
			}
		}
    }

	private char unescape( char[] data, Integer offset )
	{
		try
		{
			while (offset < data.length && data[offset] == 'u')
				offset++;

			int end = offset + 3;
			if (end < data.length)
			{
				int d = hexDigit(data[offset]);
				int code = d;
				while (offset < end && d >= 0)
				{
					offset++;
					d = hexDigit(data[offset]);
					code = (code << 4) + d;
				}
				if (code >= 0)
					return (char) code;
			}
		} catch (NumberFormatException ex)
		{
		}
		return ' ';
	}

    private int hexDigit(char value)
    {
        if (value >= '0' && value <= '9')
        	return value - '0';
    	if (value >= 'a' && value <= 'f')
    		return value - 'a' + 10;
    	if (value >= 'A' && value <= 'F')
        	return value - 'A' + 10;
    	throw new NumberFormatException("'" + value + "' is not a valid hexadecimal digit");
    }
*/

	public update(value : number)
	{
		if (value == 0x0A)
		{
			++this.location.line;
			this.location.column = 1;
		} else
		{
			++this.location.column;
		}
	}
}

enum LineBreak
{
    NONE = 0,
    BEFORE = 2,
    AFTER = 1,
    BOTH = 3
}

export class TokenType
{
    public readonly name : string;
	public readonly isKeyword : boolean;
	public readonly token : string;
	private static entries: { [name: string] : TokenType } = {};

	static readonly TOK_ABSTRACT = new TokenType("abstract", true, 'TOK_ABSTRACT');
	static readonly TOK_AND = new TokenType("and", true, 'TOK_AND');
	static readonly TOK_AS = new TokenType("as", true, 'TOK_AS');
	static readonly TOK_ASSIGN = new TokenType("=", false, 'TOK_ASSIGN');
	static readonly TOK_AT = new TokenType("@", false, 'TOK_AT');
	static readonly TOK_BACK_SLASH = new TokenType("\\", false, 'TOK_BACK_SLASH');
	static readonly TOK_BAND = new TokenType("&", false, 'TOK_BAND');
	static readonly TOK_BAND_ASSIGN = new TokenType("&=", false, 'TOK_BAND_ASSIGN');
	static readonly TOK_BANG = new TokenType("!", false, 'TOK_BANG');
	static readonly TOK_BIN_LITERAL = new TokenType("", false, 'TOK_BIN_LITERAL');
	static readonly TOK_BOOL_LITERAL = new TokenType("", false, 'TOK_BOOL_LITERAL');
	static readonly TOK_BOOLEAN = new TokenType("bool", true, 'TOK_BOOLEAN');
	static readonly TOK_BOR = new TokenType("|", false, 'TOK_BOR');
	static readonly TOK_BOR_ASSIGN = new TokenType("|=", false, 'TOK_BOR_ASSIGN');
	static readonly TOK_BREAK = new TokenType("break", true, 'TOK_BREAK');
	static readonly TOK_CASE = new TokenType("case", true, 'TOK_CASE');
	static readonly TOK_CATCH = new TokenType("catch", true, 'TOK_CATCH');
	static readonly TOK_CHAR = new TokenType("char", true, 'TOK_CHAR');
	static readonly TOK_CLASS = new TokenType("class", true, 'TOK_CLASS');
	static readonly TOK_COLON = new TokenType(":", false, 'TOK_COLON');
	static readonly TOK_COMA = new TokenType(",", false, 'TOK_COMA');
	static readonly TOK_COMMENT = new TokenType("", false, 'TOK_COMMENT');
	static readonly TOK_CONST = new TokenType("const", true, 'TOK_CONST');
	static readonly TOK_CONTINUE = new TokenType("continue", true, 'TOK_CONTINUE');
	static readonly TOK_DEC = new TokenType("--", false, 'TOK_DEC');
	static readonly TOK_DEC_LITERAL = new TokenType("", false, 'TOK_DEC_LITERAL');
	static readonly TOK_DEDENT = new TokenType("", false, 'TOK_DEDENT');
	static readonly TOK_FUNCTION = new TokenType("function", true, 'TOK_FUNCTION');
	static readonly TOK_DEFAULT = new TokenType("default", true, 'TOK_DEFAULT');
	static readonly TOK_DIV = new TokenType("/", false, 'TOK_DIV');
	static readonly TOK_DIV_ASSIGN = new TokenType("/=", false, 'TOK_DIV_ASSIGN');
	static readonly TOK_DOCSTRING = new TokenType("", false, 'TOK_DOCSTRING');
	static readonly TOK_DOT = new TokenType(".", false, 'TOK_DOT');
	static readonly TOK_ELIF = new TokenType("elif", true, 'TOK_ELIF');
	//static readonly TOK_DOUBLE = new TokenType("double", true, 'TOK_DOUBLE');
	static readonly TOK_ELSE = new TokenType("else", true, 'TOK_ELSE');
	static readonly TOK_EOF = new TokenType("end of file", false, 'TOK_EOF');
	static readonly TOK_EOL = new TokenType("end of line", false, 'TOK_EOL');
	static readonly TOK_EQ = new TokenType("==", false, 'TOK_EQ');
	static readonly TOK_EXPORT = new TokenType("export", true, 'TOK_EXPORT');
	static readonly TOK_EXTENDS = new TokenType("extends", true, 'TOK_EXTENDS');
	static readonly TOK_FALSE = new TokenType("false", true, 'TOK_FALSE');
	static readonly TOK_FINALLY = new TokenType("finally", true, 'TOK_FINALLY');
	//static readonly TOK_FLOAT = new TokenType("float", true, 'TOK_FLOAT');
	static readonly TOK_FOR = new TokenType("for", true, 'TOK_FOR');
	static readonly TOK_FP_LITERAL = new TokenType("", false, 'TOK_FP_LITERAL');
	static readonly TOK_GE = new TokenType(">=", false, 'TOK_GE');
	static readonly TOK_GT = new TokenType(">", false, 'TOK_GT');
	static readonly TOK_HEX_LITERAL = new TokenType("", false, 'TOK_HEX_LITERAL');
	static readonly TOK_IF = new TokenType("if", true, 'TOK_IF');
	static readonly TOK_INSTANCEOF = new TokenType("instanceof", true, 'TOK_INSTANCEOF');
	static readonly TOK_IMPLEMENTS = new TokenType("implements", true, 'TOK_IMPLEMENTS');
	static readonly TOK_IMPORT = new TokenType("import", true, 'TOK_IMPORT');
	static readonly TOK_IN = new TokenType("in", true, 'TOK_IN');
	static readonly TOK_INC = new TokenType("++", false, 'TOK_INC');
	static readonly TOK_INDENT = new TokenType("", false, 'TOK_INDENT');
	static readonly TOK_INTERFACE = new TokenType("interface", true, 'TOK_INTERFACE');
	static readonly TOK_IS = new TokenType("is", true, 'TOK_IS');
	static readonly TOK_LE = new TokenType("<=", false, 'TOK_LE');
	static readonly TOK_LEFT_BRACE = new TokenType("{", false, 'TOK_LEFT_BRACE');
	static readonly TOK_LEFT_BRACKET = new TokenType("[", false, 'TOK_LEFT_BRACKET');
	static readonly TOK_LEFT_PAR = new TokenType("(", false, 'TOK_LEFT_PAR');
	static readonly TOK_LET = new TokenType("let", true, 'TOK_LET');
	static readonly TOK_LONG = new TokenType("long", true, 'TOK_LONG');
	static readonly TOK_LT = new TokenType("<", false, 'TOK_LT');
	static readonly TOK_MINUS = new TokenType("-", false, 'TOK_MINUS');
	static readonly TOK_MINUS_ASSIGN = new TokenType("-=", false, 'TOK_MINUS_ASSIGN');
	static readonly TOK_MOD = new TokenType("%", false, 'TOK_MOD');
	static readonly TOK_MOD_ASSIGN = new TokenType("%=", false, 'TOK_MOD_ASSIGN');
	static readonly TOK_MUL = new TokenType("*", false, 'TOK_MUL');
	static readonly TOK_MUL_ASSIGN = new TokenType("*=", false, 'TOK_MUL_ASSIGN');
	static readonly TOK_NAME = new TokenType("identifier", false, 'TOK_NAME');
	static readonly TOK_NAMESPACE = new TokenType("namespace", true, 'TOK_NAMESPACE');
	static readonly TOK_NATIVE = new TokenType("native", true, 'TOK_NATIVE');
	static readonly TOK_NE = new TokenType("!=", false, 'TOK_NE');
	static readonly TOK_NEG_ASSIGN = new TokenType("~=", false, 'TOK_NEG_ASSIGN');
	static readonly TOK_NEW = new TokenType("new", true, 'TOK_NEW');
	static readonly TOK_NIN = new TokenType("not in", false, 'TOK_NIN');
	static readonly TOK_NIS = new TokenType("not is", false, 'TOK_NIS');
	static readonly TOK_NOT = new TokenType("not", true, 'TOK_NOT');
	static readonly TOK_NOT_ASSIGN = new TokenType("!=", false, 'TOK_NOT_ASSIGN');
	static readonly TOK_NULL = new TokenType("null", true, 'TOK_NULL');
	static readonly TOK_OCT_LITERAL = new TokenType("", false, 'TOK_OCT_LITERAL');
	static readonly TOK_OF = new TokenType("of", true, 'TOK_OF');
	static readonly TOK_OR = new TokenType("or", true, 'TOK_OR');
	static readonly TOK_INTERNAL = new TokenType("internal", true, 'TOK_INTERNAL');
	static readonly TOK_PACKAGE = new TokenType("package", true, 'TOK_PACKAGE');
	static readonly TOK_PLUS = new TokenType("+", false, 'TOK_PLUS');
	static readonly TOK_PLUS_ASSIGN = new TokenType("+=", false, 'TOK_PLUS_ASSIGN');
	static readonly TOK_QUEST = new TokenType("?", false, 'TOK_QUEST');
	static readonly TOK_READLOCK = new TokenType("readlock", true, 'TOK_READLOCK');
	static readonly TOK_PRIVATE = new TokenType("private", true, 'TOK_PRIVATE');
	static readonly TOK_PROTECTED = new TokenType("protected", true, 'TOK_PROTECTED');
	static readonly TOK_PUBLIC = new TokenType("public", true, 'TOK_PUBLIC');
	static readonly TOK_RETURN = new TokenType("return", true, 'TOK_RETURN');
	static readonly TOK_RIGHT_BRACE = new TokenType("}", false, 'TOK_RIGHT_BRACE');
	static readonly TOK_RIGHT_BRACKET = new TokenType("]", false, 'TOK_RIGHT_BRACKET');
	static readonly TOK_RIGHT_PAR = new TokenType(")", false, 'TOK_RIGHT_PAR');
	static readonly TOK_SEMICOLON = new TokenType(";", false, 'TOK_SEMICOLON');
	static readonly TOK_SHL = new TokenType("<<", false, 'TOK_SHL');
	static readonly TOK_SHL_ASSIGN = new TokenType("<<=", false, 'TOK_SHL_ASSIGN');
	static readonly TOK_SHR = new TokenType(">>", false, 'TOK_SHR');
	static readonly TOK_SHR_ASSIGN = new TokenType(">>=", false, 'TOK_SHR_ASSIGN');
	static readonly TOK_STATIC = new TokenType("static", true, 'TOK_STATIC');
	static readonly TOK_STRING_LITERAL = new TokenType("string literal", false, 'TOK_STRING_LITERAL');
	static readonly TOK_MSTRING_LITERAL = new TokenType("multiline string literal", false, 'TOK_MSTRING_LITERAL');
	static readonly TOK_SUPER = new TokenType("super", true, 'TOK_SUPER');
	static readonly TOK_SUSPEND = new TokenType("suspend", true, 'TOK_SUSPEND');
	static readonly TOK_SWITCH = new TokenType("switch", true, 'TOK_SWITCH');
	static readonly TOK_THEN = new TokenType("then", true, 'TOK_THEN');
	//static readonly TOK_THIS = new TokenType("this", true, 'TOK_THIS');
	static readonly TOK_THROW = new TokenType("throw", true, 'TOK_THROW');
	static readonly TOK_TILDE = new TokenType("~", false, 'TOK_TILDE');
	static readonly TOK_TRUE = new TokenType("true", true, 'TOK_TRUE');
	static readonly TOK_TRY = new TokenType("try", true, 'TOK_TRY');
	static readonly TOK_VAR = new TokenType("var", true, 'TOK_VAR');
	static readonly TOK_VARARG = new TokenType("vararg", true, 'TOK_VARARG');
	static readonly TOK_WHILE = new TokenType("while", true, 'TOK_WHILE');
	static readonly TOK_WRITELOCK = new TokenType("writelock", true, 'TOK_WRITELOCK');
	static readonly TOK_XOR = new TokenType("^", false, 'TOK_XOR');
	static readonly TOK_XOR_ASSIGN = new TokenType("^=", false, 'TOK_XOR_ASSIGN');
	static readonly TOK_UNKNOWN = new TokenType('', false, 'TOK_UNKNWON');

    private constructor(name : string = "", isKeyword : boolean = false, token : string = "")
    {
        this.name = name;
		this.isKeyword = isKeyword;
		this.token = token;
		if (isKeyword) TokenType.entries[name] = this;
	}

	public static parse( name : string ) : TokenType
	{
		let item = TokenType.entries[name];
		if (item != null && item.isKeyword) return item;
		return TokenType.TOK_NAME;
	}
}

export class Token
{
    public type : TokenType;
	public value : string;
	public location? : SourceLocation;
	public lineBreak : number;
	public comments : beagle.compiler.tree.Comment[];
	public static readonly defaultToken : Token = new Token(undefined, 0, [], TokenType.TOK_EOF, undefined);

	constructor(location? : SourceLocation, lineBreak? : number, comments? : beagle.compiler.tree.Comment[],
		type? : TokenType, value? : string)
	{
		// clone location object
		if (location == null)
			this.location = undefined;
		else
			this.location = location.clone();

		this.value = '';
		this.lineBreak = (lineBreak) ? lineBreak : 0;
		this.comments = (comments) ? comments : [];
		if (!value) value = '';
		if (!type || type == TokenType.TOK_UNKNOWN)
			this.type = TokenType.parse(value);
		else
			this.type = type;
		if (!this.type.isKeyword) this.value = value;
    }
}

export class Scanner
{
	source : ScanString;
	context : CompilationContext;
	lineBreak : boolean = false;
	comments : beagle.compiler.tree.Comment[];

	constructor( context : CompilationContext, source : ScanString )
	{
		this.source = source;
		this.context = context;
		this.comments = [];
	}

	getLineBreak() : number
	{
		let state = 0;

		if (this.lineBreak)
			state = LineBreak.BEFORE;
		if (this.source.peekAt(1) == '\n')
			state |= LineBreak.AFTER;

		return state;
	}

	createToken( type : TokenType, name? : string, length? : number ) : Token
	{
		let state = this.getLineBreak();
		this.lineBreak = false;

		if (name)
			length = name.length;
		else
			length = 0;

		let location = this.source.location.clone();
		location.column -= length;

		let output = new Token(location, state,
			(this.comments.length > 0) ? this.comments : [], type, name);

		if (this.comments.length > 0) this.comments = [];
		return output;
	}

	/**
	 * Advance the cursor and process the current character.
	 */
	readToken() : Token | undefined
	{
		while (true)
		{
			if (this.source.next() == '\n')
			{
				this.lineBreak = true;
				while (this.source.next() == '\n');
			}

            let current = this.source.peek();
			switch (current)
			{
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
					return this.processIdentifier();
				case '/':
					// capture block comments
					if (this.source.peekAt(1) == '*')
					{
						let comm = this.processBlockComment();
						if (comm != null) this.comments.push(comm);
						break;
					}
					// capture inline comments
					if (this.source.peekAt(1) == '/')
					{
						let comm = this.processInlineComment();
						if (comm != null) this.comments.push(comm);
						break;
					}

					if (this.source.peekAt(1) == '=')
						return this.createToken(TokenType.TOK_DIV_ASSIGN, undefined, 2);

					return this.createToken(TokenType.TOK_DIV, undefined, 1);
				case '"':
				case '\'':
					return this.processString();
				case '=':
					if (this.source.peekAt(1) == '=')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_EQ, undefined, 2);
					}
					return this.createToken(TokenType.TOK_ASSIGN, undefined, 1);
				case '+':
					if (this.source.peekAt(1) == '+')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_INC, undefined, 2);
					}
					if (this.source.peekAt(1) == '=')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_PLUS_ASSIGN, undefined, 2);
					}
					if (this.isDigit(this.source.peekAt(1)))
					{
						return this.processNumber();
					}
					return this.createToken(TokenType.TOK_PLUS, undefined, 1);
				case '-':
					if (this.source.peekAt(1) == '-')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_DEC, undefined, 2);
					}
					if (this.source.peekAt(1) == '=')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_MINUS_ASSIGN, undefined, 2);
					}
					if (this.isDigit(this.source.peekAt(1)))
					{
						return this.processNumber();
					}
					return this.createToken(TokenType.TOK_MINUS, undefined, 1);
				case '*':
					if (this.source.peekAt(1) == '=')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_MUL_ASSIGN, undefined, 2);
					}
					return this.createToken(TokenType.TOK_MUL, undefined, 1);
				case '%':
					if (this.source.peekAt(1) == '=')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_MOD_ASSIGN, undefined, 2);
					}
					return this.createToken(TokenType.TOK_MOD, undefined, 1);
				case '&':
					if (this.source.peekAt(1) == '=')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_BAND_ASSIGN, undefined, 2);
					}
					if (this.source.peekAt(1) == '&')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_AND, undefined, 2);
					}
					return this.createToken(TokenType.TOK_BAND, undefined, 1);
				case '|':
					if (this.source.peekAt(1) == '=')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_BOR_ASSIGN, undefined, 2);
					}
					if (this.source.peekAt(1) == '|')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_OR, undefined, 2);
					}
					return this.createToken(TokenType.TOK_BOR, undefined, 1);
				case '.':
					return this.createToken(TokenType.TOK_DOT, undefined, 1);
				case '\\':
					return this.createToken(TokenType.TOK_BACK_SLASH, undefined, 1);
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
					return this.processNumber();
				case '(':
					return this.createToken(TokenType.TOK_LEFT_PAR, undefined, 1);
				case ')':
					return this.createToken(TokenType.TOK_RIGHT_PAR, undefined, 1);
				case '[':
					return this.createToken(TokenType.TOK_LEFT_BRACKET, undefined, 1);
				case ']':
					return this.createToken(TokenType.TOK_RIGHT_BRACKET, undefined, 1);
				case '{':
					return this.createToken(TokenType.TOK_LEFT_BRACE, undefined, 1);
				case '}':
					return this.createToken(TokenType.TOK_RIGHT_BRACE, undefined, 1);
				case '@':
					return this.createToken(TokenType.TOK_AT, undefined, 1);
				case '>':
					if (this.source.peekAt(1) == '=')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_GT, undefined, 2);
					}
					if (this.source.peekAt(1) == '>')
					{
						this.source.next();
						if (this.source.peekAt(1) == '=')
						{
							this.source.next();
							return this.createToken(TokenType.TOK_SHR_ASSIGN, undefined, 2);
						}
						else
							return this.createToken(TokenType.TOK_SHR, undefined, 2);
					}
					return this.createToken(TokenType.TOK_GT, undefined, 1);
				case '<':
					if (this.source.peekAt(1) == '=')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_LT, undefined, 2);
					}
					if (this.source.peekAt(1) == '<')
					{
						this.source.next();
						if (this.source.peekAt(1) == '=')
						{
							this.source.next();
							return this.createToken(TokenType.TOK_SHL_ASSIGN, undefined, 2);
						}
						else
							return this.createToken(TokenType.TOK_SHL, undefined, 2);
					}
					return this.createToken(TokenType.TOK_LT, undefined, 1);

				case ',':
					return this.createToken(TokenType.TOK_COMA, undefined, 1);

				case ';':
					return this.createToken(TokenType.TOK_SEMICOLON, undefined, 1);

				case ':':
					return this.createToken(TokenType.TOK_COLON, undefined, 1);

				case '?':
					return this.createToken(TokenType.TOK_QUEST, undefined, 1);

				case '!':
					if (this.source.peekAt(1) == '=')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_NE, undefined, 2);
					}
					return this.createToken(TokenType.TOK_BANG, undefined, 1);

				case '~':
					if (this.source.peekAt(1) == '=')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_NEG_ASSIGN, undefined, 2);
					}
					return this.createToken(TokenType.TOK_TILDE, undefined, 1);

				case '^':
					if (this.source.peekAt(1) == '=')
					{
						this.source.next();
						return this.createToken(TokenType.TOK_XOR_ASSIGN, undefined, 2);
					}
					return this.createToken(TokenType.TOK_XOR, undefined, 1);

				case ScanString.BOL:
					break;

				case ScanString.EOI:
					return this.createToken(TokenType.TOK_EOF, undefined, 1);

				default:
					if (this.isWhitespace(this.source.peek()) || this.source.peek() == ScanString.BOI)
						break;
					this.context.listener.onError(this.source.location, "Invalid character '" + this.source.peek() + "'");
					break;
			}
		}
	}

	processString() : Token | undefined
	{
		let type = this.source.peek();
		if (this.source.lookahead(type, type, type) == LookaheadStatus.MATCH)
			return this.processMultilineString();
            this.source.next();

		let capture = "";
		let last = '\0'
		while (this.source.peek() != ScanString.EOI)
		{
			if (last != '\\' && this.source.peek() == type) break;
			// FIXME: validate and expands escape sequences
			capture += this.source.peek();
			last = this.source.peek();
			this.source.next();
		}
		if (this.source.peek() != type)
		{
			return this.returnError("Unterminated string");
		}
		else
			return this.createToken(TokenType.TOK_STRING_LITERAL, capture.toString());
	}

	processMultilineString() : Token | undefined
	{
		let type = this.source.peek();
		this.source.nextAt(3);
		let capture = "";
		while (this.source.lookahead(type, type, type) != LookaheadStatus.MATCH && this.source.peek() != ScanString.EOI)
		{
			// FIXME: validate and expands escape sequences
			let c = this.source.peek();
			if (c == '\n')
				capture += "\\n";
			else
				capture += c;
            this.source.next();
		}
		if (this.source.peek() != type)
		{
			return this.returnError("Unterminated string");
		}
		else
		{
			this.source.nextAt(2);
			return this.createToken(TokenType.TOK_MSTRING_LITERAL, capture.toString());
		}
	}

	processBlockComment() : beagle.compiler.tree.Comment | undefined
	{
		let type = TokenType.TOK_COMMENT;
		this.source.nextAt(2);

		if (this.source.peek() == '*')
		{
			this.source.next();
			type = TokenType.TOK_DOCSTRING;
		}

		let capture = "";
		while (this.source.peek() != ScanString.EOI && this.source.lookahead('*', '/') != LookaheadStatus.MATCH)
		{
			// FIXME: validate and expands escape sequences
			capture += this.source.peek();
			this.source.next();
		}

		if (this.source.lookahead('*', '/') != LookaheadStatus.MATCH)
		{
			//this.context.listener.onError(this.source.location, "Unterminated block comment");
			return undefined;
		}
		else
		{
			this.source.nextAt(1); // skip the '*' (but not the '/')
			this.discardWhiteSpaces();

			return new beagle.compiler.tree.Comment(capture.toString(), type == TokenType.TOK_DOCSTRING);
		}
	}

	discardWhiteSpaces()
	{
		while (true)
		{
			switch (this.source.peekAt(1))
			{
				case '\n':
				case ' ':
				case '\t':
                    this.source.next();
					continue;
				default:
					return;
			}
		}
	}

	processInlineComment() : beagle.compiler.tree.Comment
	{
		this.source.nextAt(2);

		let capture = "";
		while (this.source.peek() != '\n' && this.source.peek() != ScanString.EOI)
		{
			capture += this.source.peek();
			this.source.next();
		}
		return new beagle.compiler.tree.Comment(capture.toString(), false);
	}

	/*private Token emitIfLookahead( TokenType type, char... values)
	{
		//if (values.length == 0)
		//	throw new IllegalArgumentException("Missing lookahead symbols");

		if (this.source.lookahead(values) == LookaheadStatus.MATCH)
		{
			source.next(values.length - 1);
			return new Token(type);
		}
		return null;
	}*/

	isDigit(value : string) : boolean
	{
		return (value[0] >= '0' && value[0] <= '9');
	}

	/**
	 * Read a number (decimal, hexadecimal, binary or octal) and
	 * leave the cursor at the last digit.
	 *
	 * @return
	 */
	processNumber() : Token | undefined
	{
		let type = TokenType.TOK_DEC_LITERAL;

		let value = this.source.peek();
		if (value == '0')
		{
			value = this.source.peekAt(1);
			if (value == 'b' || value == 'B')
				return this.processBinary();
			if (value == 'x' || value == 'X')
				return this.processHexadecimal();
			//return processOctal();
			type = TokenType.TOK_OCT_LITERAL;
		}

		let capture = "";
		// first digit
		value = this.source.peek();
		if (this.isDigit(value)) capture += value;
		// remaining digits
		while (true)
		{
			value = this.source.peekAt(1);
			if (this.isDigit(value))
			{
				capture += value;
				this.source.next();
			}
			else
				break;
		}

		if (this.source.peekAt(1) == '.')
		{
			if (this.isDigit(this.source.peekAt(2)))
			{
				// we have a floating-point number
				capture += '.';
				this.source.next();

				while (true)
				{
					value = this.source.peekAt(1);
					if (this.isDigit(value))
					{
						capture += value;
						this.source.next();
					}
					else
						break;
				}

				return this.createToken(TokenType.TOK_FP_LITERAL, capture);
			}
		}

		return this.createToken(type, capture);
	}

	returnError( message : string ) : Token | undefined
	{
		this.context.listener.onError(this.source.location, message);
		return undefined;
	}

	processHexadecimal() : Token | undefined
	{
		let capture = "0x";
		this.source.nextAt(1);

		while (true)
		{
			let value = this.source.peekAt(1);
			if ((value >= '0' && value <= '9') ||
				(value >= 'a' && value <= 'f') ||
				(value >= 'A' && value <= 'F'))
			{
				this.source.next();
				capture += value;
			}
			else
				break;
		}

		if (capture.length > 2)
			return this.createToken(TokenType.TOK_HEX_LITERAL, capture);
		else
		{
			return this.returnError("Invalid hexadecimal literal");
		}
	}

	processBinary() : Token | undefined
	{
		let capture = "0b";
		this.source.next();

		while (true)
		{
			let value = this.source.peekAt(1);
			if (value == '0' || value == '1')
			{
				this.source.next();
				capture += value;
			}
			else
				break;
		}

		if (capture.length > 2)
			return this.createToken(TokenType.TOK_BIN_LITERAL, capture);
		else
		{
			return this.returnError("Invalid binary literal");
		}
	}

	/**
	 * Capture an identifier.
	 *
	 * The current character is guaranted to be valid. This function leaves the
	 * cursor in the last character of the identifier.
	 *
	 * @return
	 */
	processIdentifier() : Token | undefined
	{
		let capture = "";

		capture += this.source.peek();
		while (true)
		{
			let current = this.source.peekAt(1);
			if ((current >= 'A' && current <= 'Z') ||
				(current >= 'a' && current <= 'z') ||
				(current >= '0' && current <= '9') ||
				current == '_')
			{
				capture += this.source.next();
			}
			else
				break;
		}

		return this.createToken(TokenType.TOK_UNKNOWN, capture);
    }

    isWhitespace(symbol : string) : boolean
    {
        switch (symbol)
        {
            case '\n':
            case '\r':
            case ' ':
            case '\t':
                return true;
            default: return false;
        }
    }
}

}
