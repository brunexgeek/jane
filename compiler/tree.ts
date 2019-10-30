
namespace beagle.compiler.tree {

export class CompilationUnit
{
    fileName : string;
	statements : IStatement[];

	constructor(fileName : string, stmts? : IStatement[])
	{
		this.fileName = fileName;
		this.statements = (stmts) ? stmts : [];
	}
}

export class Comment implements IStatement
{
	text : string;
	isDoc : boolean;

	constructor( text : string, isDoc : boolean = false )
	{
		this.text = text;
		this.isDoc = isDoc;
	}
}

export class Name
{
	parents : string[] = [];
	name : string;
	location : SourceLocation;

	constructor(value : string, location? : SourceLocation)
	{
		if (value == null) value = "<null>";
		this.name = value;
		if (location)
			this.location = location;
		else
			this.location = new SourceLocation('<unknwon>');
	}

	appendParent(value : string )
	{
		this.parents.push(value);
	}

	isQualified() : boolean
	{
		return this.parents.length > 0;
	}

	get qualifiedName() : string
	{
		if (this.parents.length == 0) return this.name;
		let result = '';
		for (let i = 0, t = this.parents.length; i < t; ++i)
			result += this.parents[i] + '.';
		return result + this.name;
	}
}

/*class Package
{
    name : Name;
    types : TypeDeclaration[];
}*/

export class TypeImport implements IStatement
{
    //package : Package;
	name : Name;
	isWildcard : boolean;
	alias? : Name;

	constructor( name : Name, isWildcard : boolean = false, alias? : Name )
	{
		this.alias = alias;
		this.name = name;
		this.isWildcard = isWildcard;
	}
}



export class TypeReference
{
    //package? : Package;
	type? : TypeDeclaration;
	isPrimitive : boolean = false;
	name : Name;

	constructor( name : Name )
	{
		this.name = name;
		this.isPrimitive = false;

		if (name.parents.length == 0)
		{
			switch (name.name)
			{
				case "char":
				case "byte":
				case "int":
				case "uint":
				case "long":
				case "ulong":
				case "float":
				case "double":
				case "quad":
					this.isPrimitive = true;
			}
		}
	}
}

export class StorageDeclaration implements IStatement
{
	type? : TypeReference;
	name : Name;
	initializer? : IExpression;
	isConst : boolean;
	annots : Annotation[];

	constructor( annots : Annotation[] | undefined, name : Name, type : TypeReference | undefined, isConst : boolean, expr? : IExpression )
	{
		this.annots = (!annots) ? [] : annots;
		this.name = name;
		this.type = type;
		this.initializer = expr;
		this.isConst = isConst;
	}
}

export class Function implements IStatement
{
	annotations : Annotation[];
	access : AccessMode;
	name : Name;
	parameters : FormalParameter[];
	type : TypeReference | undefined;
	body : IStatement;
	parent? : CompilationUnit | TypeDeclaration;

	constructor( annots : Annotation[] | undefined, name : Name, type : TypeReference | undefined,
		params : FormalParameter[] | undefined, body : IStatement )
	{
		this.annotations = (!annots) ? [] : annots;
		this.access = AccessMode.PROTECTED;
		this.name = name;
		this.parameters = (!params) ? [] : params;
		this.type = type;
		this.body = body;
		this.parent = undefined;
	}
}



export interface IStatement
{
}

export class FormalParameter
{
	public name : Name;
	public type : TypeReference;

	constructor( name : Name, type : TypeReference )
	{
		this.name = name;
		this.type = type;
	}
}



export class Annotation
{
	name : Name;

	constructor( name : Name )
	{
		this.name = name;
	}
}

export class Namespace implements IStatement
{
	name : Name;
	statements : IStatement[];

	constructor( annots : tree.Annotation[], name : Name)
	{
		this.name = name;
		this.statements = [];
	}
}

export interface IExpression
{
}

export class BinaryExpression implements IExpression
{
	public left : IStatement;
	public right : IStatement;
	public operation : TokenType;

	public constructor(left : IStatement, type : TokenType, right : IStatement )
	{
		this.left = left;
		this.right = right;
		this.operation = type;
	}
}

export class NameLiteral
{
	value : Name;

	constructor( value : Name )
	{
		this.value = value;
	}
}

export enum UnaryDirection
{
	PREFIX,
	POSTFIX
}

export class UnaryExpression implements IExpression
{
	operation : TokenType;
	direction : UnaryDirection;
	expression : IExpression;
	extra? : IExpression;

	constructor(expression : IExpression, operation : TokenType, direction : UnaryDirection)
	{
		this.operation = operation;
		this.expression = expression;
		this.direction = direction;
		this.extra = undefined;
	}
}

export class ArgumentList
{
	args : Argument[];

	constructor( item? : Argument )
	{
		this.args = [];
		if (item != null) this.args.push(item);
	}

}

export class Argument
{
	name? : Name;
	value : IExpression;

	constructor( name : Name | undefined, value : IExpression )
	{
		this.name = name;
		this.value = value;
	}
}

export class ExpressionList
{
	expressions : IExpression[];

	constructor( item? : IExpression )
	{
		this.expressions = [];
		if (item) this.expressions.push(item);
	}
}

export class AtomicExpression
{
	value : IExpression;

	constructor( value : IExpression )
	{
		this.value = value;
	}
}

export class NullLiteral
{
}

export class IntegerLiteral
{
	value : string;
	base : number;
	numeric : number;

	constructor( value : string, base : number = 10 )
	{
		this.value = value;
		this.base = base;
		this.numeric = parseInt(value, base);
	}
}

export class BooleanLiteral
{
	value : boolean;

	constructor( value : boolean )
	{
		this.value = value;
	}
}

export class StringLiteral
{
	value : string;
	index : number = 0;

	constructor( value : string )
	{
		this.value = value;
	}
}


export class FloatLiteral
{
	value : string;
	numeric : number;

	constructor( value : string )
	{
		this.value = value;
		this.numeric = parseFloat(value);
	}
}

export enum AccessMode
{
	PUBLIC,
	PROTECTED,
	PRIVATE
}

export class TypeDeclaration implements IStatement
{
	annotations : Annotation[];
	access : AccessMode;
	name : Name;
	statements : IStatement[];
	// inheritance
	parents : TypeReference[];
	interfaces : TypeReference[];

	constructor( annots : Annotation[] | undefined, name : Name )
	{
		this.annotations = (annots) ? annots : [];
		this.access = AccessMode.PRIVATE;
		this.name = name;
		this.statements = [];
		this.parents = [];
		this.interfaces = [];
	}
}

export class Property
{
	name : Name;
	access : AccessMode;
	annotations : Annotation[];
	type : TypeReference | undefined;
	initializer? : IExpression;

	constructor( annots : Annotation[], access : AccessMode, name : Name,
		type? : TypeReference, initializer? : IExpression )
	{
		this.name = name;
		this.access = access;
		this.annotations = (annots == null) ? [] : annots;
		this.type = type;
		this.initializer = initializer;
	}
}

export class ReturnStmt
{
	expr : IExpression;

	constructor( expr : IExpression )
	{
		this.expr = expr;
	}
}

export class ExpressionStmt
{
	expr : IExpression;

	constructor( expr : IExpression )
	{
		this.expr = expr;
	}
}

export class IfThenElseStmt
{
	condition : IExpression;
	thenSide : IStatement;
	elseSide? : IStatement;

	constructor( condition : IExpression, thenSide : IStatement, elseSide? : IStatement )
	{
		this.condition = condition;
		this.thenSide = thenSide;
		this.elseSide = elseSide;
	}
}

export class ForEachStmt implements IStatement
{
	statement : IStatement;
	iterator : StorageDeclaration;
	expression : IExpression;

	constructor(iterator : StorageDeclaration, expr : IExpression, stmt : IStatement )
	{
		this.statement = stmt;
		this.iterator = iterator;
		this.expression = expr;
	}
}

export class BlockStmt implements IStatement
{
	statements : IStatement[];
	enclosed : boolean;

	constructor( enclosed : boolean = true, stmts? : IStatement[] )
	{
		this.statements = (stmts) ? stmts : [] ;
		this.enclosed = (stmts.length > 1) ? true : enclosed;
	}
}

}
