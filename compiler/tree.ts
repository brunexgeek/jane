
namespace beagle.compiler.tree {

export class MemberContainer
{
	classes : Structure[];
	functions : Function[];
	storages : StorageDeclaration[];
	namespaces : Namespace[];

	constructor()
	{
		this.functions = [];
		this.storages = [];
		this.classes = [];
		this.namespaces = [];
	}
}

export class CompilationUnit extends MemberContainer
{
    fileName : string;
	imports : TypeImport[];

	constructor(fileName : string)
	{
		super();
		this.fileName = fileName;
		this.imports = [];
	}
}

export class Comment
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
    names : string[] = [];
	qualifiedName : string;
	location : SourceLocation;

	constructor(value : string)
	{
		if (value == null) value = "<null>";
		this.names.push(value);
		this.qualifiedName = value;
	}

	appendName(value : string )
	{
		this.names.push(value);
		this.qualifiedName = this.qualifiedName + "." + value;
	}

	isQualified() : boolean
	{
		return this.names.length > 1;
	}
}



class Package
{
    name : Name;
    types : TypeDeclaration[];
}

export class TypeImport
{
    package : Package;
	name : Name;
	isWildcard : boolean;
	alias : Name;

	constructor( name : Name, isWildcard : boolean = false, alias : Name = null )
	{
		this.alias = alias;
		this.name = name;
		this.isWildcard = isWildcard;
	}
}

class TypeDeclaration
{
    package : Package;
	isComplete : boolean;
	parent : CompilationUnit;
	name : Name;
	inherit : TypeReference[];
	body : TypeBody;
}

export class TypeReference
{
    package : Package;
	type : TypeDeclaration;
	isPrimitive : boolean = false;
	name : Name;

	constructor( name : Name )
	{
		this.name = name;
		this.type = null;
		this.package = null;
		this.isPrimitive = false;

		if (name != null && name.names.length == 1)
		{
			switch (name.names[0])
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

class TypeBody
{
    storages : StorageDeclaration[];
	functions : Function[];
	parent : TypeDeclaration;
}

export class StorageDeclaration implements IStatement
{
	type : TypeReference;
	name : Name;
	initializer : IExpression;
	isConst : boolean;
	annots : Annotation[];

	constructor( annots : Annotation[], name : Name, type : TypeReference, isConst : boolean, expr : IExpression = null )
	{
		this.annots = (annots == null) ? [] : annots;
		this.name = name;
		this.type = type;
		this.initializer = expr;
		this.isConst = isConst;
	}
}

export class Function
{
	annotations : Annotation[];
	access : AccessMode;
	name : Name;
	parameters : FormalParameter[];
	type : TypeReference;
	body : IStatement;
	parent : CompilationUnit | TypeDeclaration;

	constructor( annots : Annotation[], name : Name, type : TypeReference,
		params : FormalParameter[], body : IStatement )
	{
		this.annotations = (annots == null) ? [] : annots;
		this.access = AccessMode.PROTECTED;
		this.name = name;
		this.parameters = params;
		this.type = type;
		this.body = body;
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

export class Namespace extends MemberContainer
{
	name : Name;
	annotations : Annotation[];

	constructor( annots : tree.Annotation[], name : Name)
	{
		super();
		this.name = name;
		this.annotations = (annots == null) ? [] : annots;
	}
}

export interface IExpression
{
}

export class BinaryExpression implements IExpression
{
	public left : IExpression;
	public right : IExpression;
	public operation : TokenType;

	public constructor(left : IExpression, type : TokenType, right : IExpression )
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
	extra : IExpression;

	constructor(expression : IExpression, operation : TokenType, direction : UnaryDirection)
	{
		this.operation = operation;
		this.expression = expression;
		this.direction = direction;
		this.extra = null;
	}
}

export class ArgumentList
{
	args : Argument[];

	constructor( item : Argument = null )
	{
		this.args = [];
		if (item != null) this.args.push(item);
	}

}

export class Argument
{
	name : Name;
	value : IExpression;

	constructor( name : Name, value : IExpression )
	{
		this.name = name;
		this.value = value;
	}
}

export class ExpressionList
{
	expressions : IExpression[];

	constructor( item : IExpression = null )
	{
		this.expressions = [];
		if (item != null) this.expressions.push(item);
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

	constructor( value : string, base : number = 10 )
	{
		this.value = value;
		this.base = base;
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

	constructor( value : string )
	{
		this.value = value;
	}
}


export class FloatLiteral
{
	value : string;

	constructor( value : string )
	{
		this.value = value;
	}
}

export enum AccessMode
{
	PUBLIC,
	PROTECTED,
	PRIVATE
}

export class Structure
{
	annotations : Annotation[];
	access : AccessMode;
	name : Name;
	parent : TypeReference;
	properties : Property[];

	constructor( annots : Annotation[] )
	{
		this.annotations = (annots == null) ? [] : annots;
		this.access = AccessMode.PRIVATE;
		this.name = null;
		this.parent = null;
		this.properties = [];
	}
}

export class Property
{
	name : Name;
	access : AccessMode;
	annotations : Annotation[];
	type : TypeReference;
	initializer : IExpression;

	constructor( annots : Annotation[], access : AccessMode, name : Name,
		type : TypeReference, initializer : IExpression = null )
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
	elseSide : IStatement;

	constructor( condition : IExpression, thenSide : IStatement, elseSide : IStatement = null)
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

	constructor( stmts : IStatement[] = [] )
	{
		this.statements = stmts;
	}
}

}
