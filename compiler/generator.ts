/// <reference path="types.ts" />
/// <reference path="context.ts" />

namespace beagle.compiler.generator {

export class CppGenerator
{

	context : CompilationContext;

	constructor( context : CompilationContext )
	{
		this.context = context;
	}

	comment( value : string, multiline : boolean = false )
	{
		let multline = multiline || value.indexOf('\n') >= 0;

		this.context.generated += '/*';
		if (multline)
			this.context.generated += '\n * ';
		else
			this.context.generated += ' ';
		for (let c of value)
		{
			if (c == '\n')
				this.context.generated += '\n * ';
			else
				this.context.generated += c;
		}
		if (multline) this.context.generated += '\n';
		this.context.generated += ' */';
	}

	commentln( value : string, multiline : boolean = false )
	{
		this.comment(value, multiline);
		this.print('\n');
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
		this.comment("Beagle Compiler\nAUTO-GENERATED CODE - Do not edit!");
		this.println("\n#include <beagle/base.h>");
		this.generateStringTable();
		for (let stmt of unit.statements)
			this.generateStatement(stmt);
		return this.context.generated;
	}

	generateStringTable()
	{
		this.comment("STRING TABLE");
		this.print("\nstatic const struct dynamic_string_ STRING_TABLE[] =\n{\n");
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
		else
		if (target instanceof tree.StorageDeclaration)
		{
			this.generateStorage(target);
		}
		else
		if (target instanceof tree.Namespace)
		{
			this.generateNamespace(target);
		}
		else
		if (target instanceof tree.IfThenElseStmt)
		{
			this.generateIfThenElse(target);
		}
		else
		if (target instanceof tree.TypeDeclaration)
			this.generateType(target);
	}

	generateNamespace( target : tree.Namespace )
	{
		this.commentln("BEGIN NAMESPACE " + target.name.qualifiedName, true);
		this.println('');
		for (let stmt of target.statements)
			this.generateStatement(stmt);
		this.commentln("END NAMESPACE " + target.name.qualifiedName, true);
	}

	generateType( target : tree.TypeDeclaration )
	{
		this.commentln('BEGIN ' + target.name.qualifiedName + ' CLASS', true);

		let name = this.getNativeName(target.name.qualifiedName);

		// static content
		this.print('\nstruct static_' + name + '_');
		this.print('\n{\n\tvoid *base__;\n\tstruct typeinfo_ typeInfo__;\n};\n');

		// dynamic content
		this.print('\nstruct dynamic_' + name + '_');
		this.print('\n{\n\tstruct static_' + name + '_ *type__;\n');
		this.print('\tuint32_t flags__;\n'); // e.g. stack or heap, from string table
		for (let item of target.statements)
		{
			if (item instanceof tree.Property)
			{
				let name = this.getNativeName(item.name.qualifiedName);
				let type = this.getNativeType(item.type);
				this.print('\t');
				this.print(type);
				this.print(' ');
				this.print(name);
				this.print(';\n');
			}
		}
		this.print('};\n');

		// type information
		this.print('\nstatic struct static_' + name + '_ type_' + name + '_ =\n{\n');
		this.print('\t.typeInfo__.staticSize = sizeof(struct static_' + name + '_),\n');
		this.print('\t.typeInfo__.dynamicSize = sizeof(struct dynamic_' + name + '_),\n');
		this.print('\t.typeInfo__.nameU8 = "' + target.name.qualifiedName + '",\n');
		this.print('\t.typeInfo__.nameU16 = NULL,\n');
		if (target.parents && target.parents.length > 0)
		{
			let parentName = this.getNativeName(target.parents[0].name.qualifiedName);
			this.print('\t.typeInfo__.base = type_' + parentName + ',');
			this.print('\t.base__ = static_' + parentName + ',\n');
		}
		else
		{
			this.print('\t.typeInfo__.base = NULL,\n\t.base__ = NULL,\n');
		}
		this.print('};\n')


		this.commentln('END ' + target.name.qualifiedName + ' CLASS', true);
	}

	generateStorage( target : tree.StorageDeclaration )
	{
		if (target.isConst)
			this.print('const ');
		this.generateTypeReference(target.type);
		this.print(' ');
		this.print(target.name.qualifiedName);
		if (target.initializer)
		{
			this.print(' = ');
			this.generateExpression(target.initializer);
		}
		else
		{
			if (target.type && !target.type.isPrimitive)
			this.print(' = NULL');
		}
		this.println(';');
	}

	generateIfThenElse( target : tree.IfThenElseStmt )
	{
		this.print('if (');
		this.generateExpression(target.condition);
		this.print(') {\n');
		this.generateStatement(target.thenSide);
		if (target.elseSide)
		{
			this.print('} else {\n');
			this.generateStatement(target.elseSide);
		}
		this.print('}\n');
	}

	getNativeName( name : string )
	{
		if (!name) return '/* unknown type */ void';

		let result = '';
		for (let i = 0; i < name.length; ++i)
		{
			if (name[i] == '.')
				result += '_';
			else
				result += name[i]
		}
		return result;
	}

	getNativeType( target : tree.TypeReference )
	{
		if (target && target.name)
		{
			let typeName = target.name.qualifiedName;
			if (typeName == 'boolean')
				return 'uint8_t';
			else
			if (typeName == 'string')
				return 'struct dynamic_string_ *';
			else
			if (typeName == 'number')
				return 'double';
			else
			if (typeName == 'void')
				return 'void';
			else
				return 'const struct dynamic_' + this.getNativeName(target.name.qualifiedName) + '_ *';
		}
		else
			return '/* unknown type */ double';
	}

	generateTypeReference( target : tree.TypeReference )
	{
		this.print( this.getNativeType(target) );
	}

	generateFunction( target : tree.Function )
	{
		this.print("static ")
		this.generateTypeReference(target.type);
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
		else
		if (target instanceof tree.FloatLiteral)
			this.print(target.value);
		else
		if (target instanceof tree.NameLiteral)
			this.print(target.value.qualifiedName);
		else
		if (target instanceof tree.StringLiteral)
			this.print('(STRING_TABLE+' + target.index.toString() + ')');
		else
			this.print('UNKNOWN');
	}

	generateParameters( target : tree.FormalParameter[] )
	{
		this.print("(");
		for (let i = 0; i < target.length; ++i)
		{
			this.generateTypeReference(target[i].type);
			this.print(" ");
			this.print(target[i].name.qualifiedName);
			if (i + 1 < target.length) this.print(", ");
		}
		this.print(")");
	}

}

}