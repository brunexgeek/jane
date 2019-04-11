/// <reference path="tree.ts" />

namespace beagle.compiler.generator {

function comment( context : CompilationContext, value : string )
{
    context.generated += "/* " + value + " */";
}

function println( context : CompilationContext, value : string )
{
    context.generated += value + "\n";
}

function print( context : CompilationContext, value : string )
{
    context.generated += value;
}

export function generate( context : CompilationContext, unit : tree.CompilationUnit )
{
    comment(context, " Beagle Compiler\n   AUTO-GENERATED CODE - Do not edit!");

    println(context, "\n#include <beagle/base.h>");

    generateStringTable(context);
}

function generateStringTable( context : CompilationContext )
{
	comment(context, "STRING TABLE");
	print(context, "static const dynamic_string_ STRING_TABLE[] =\n{\n");

	for (let item of context.stringTable)
	{
		print(context, "   { .type__ = &type_string_, .length = ");
		print(context, item.length.toString());
		print(context, ", .content = \"");
		print(context, item);
		print(context, "\"},\n");
	}

	println(context, "};");
}

}