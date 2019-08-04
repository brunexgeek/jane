/// <reference path="tree.ts" />

namespace beagle.compiler.generator {

export class CppGenerator
{

	context : CompilationContext;

	constructor( context : CompilationContext )
	{
		this.context = context;
	}

	comment( value : string )
	{
		this.context.generated += "/* " + value + " */";
	}

	println( value : string )
	{
		this.context.generated += value + "\n";
	}

	print( value : string )
	{
		this.context.generated += value;
	}

	public generate( unit : tree.CompilationUnit ) : string
	{
		this.comment(" Beagle Compiler\n   AUTO-GENERATED CODE - Do not edit!");
		this.println("\n#include <beagle/base.h>");
		this.generateStringTable();
		for (let stmt of unit.statements)
			this.generateStatement(stmt);
		return this.context.generated;
	}

	generateStringTable()
	{
		this.comment("STRING TABLE");
		this.print("static const dynamic_string_ STRING_TABLE[] =\n{\n");
		for (let item of this.context.stringTable)
		{
			this.print("   { .type__ = &type_string_, .length = ");
			this.print(item.length.toString());
			this.print(", .content = \"");
			this.print(item);
			this.print("\"},\n");
		}
		this.println("};");
	}

	generateStatement( target : tree.IStatement )
	{
		if (target instanceof tree.Function)
			this.generateFunction(target);
		else
		if (target instanceof tree.ReturnStmt)
			this.generateReturnStmt(target);
		else
		if (target instanceof tree.BlockStmt)
		{
			for (let item of target.statements)
			this.generateStatement(item);
		}
	}

	generateFunction( target : tree.Function )
	{
		this.print("static ")
		this.print(target.type.name.qualifiedName);
		this.print(" ")
		this.print(target.name.qualifiedName);
		this.generateParameters(target.parameters);
		this.println("\n{");
		this.generateStatement(target.body);
		this.println("}");
	}

	generateReturnStmt( target : tree.ReturnStmt )
	{
		this.print("return ")
		this.generateExpression(target.expr);
		this.print(";")
	}

	generateExpression( target : tree.IExpression )
	{
		if (target instanceof tree.BinaryExpression)
		{
			this.generateExpression(target.left);
			this.print(target.operation.name);
			this.generateExpression(target.right);
		}
		else
		if (target instanceof tree.UnaryExpression)
		{
			if (target.direction == tree.UnaryDirection.POSTFIX)
			{
				this.generateExpression(target.expression);
				this.print(target.operation.name);
			}
			else
			{
				this.print(target.operation.name);
				this.generateExpression(target.expression);
			}
		}
		else
		if (target instanceof tree.IntegerLiteral)
			this.print(target.value);
	}

	generateParameters( target : tree.FormalParameter[] )
	{
		this.print("(");
		for (let i = 0; i < target.length; ++i)
		{
			this.print(target[i].type.name.qualifiedName);
			this.print(" ");
			this.print(target[i].name.qualifiedName);
			if (i + 1 < target.length) this.print(", ");
		}
		this.print(")");
	}

}

}