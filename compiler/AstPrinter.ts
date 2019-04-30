/// <reference path="tree.ts" />

namespace beagle.compiler {

let currentNameValue : string | undefined;

function setCurrentName(value : string)
{
    currentNameValue = value;
}

function getCurrentName() : string | undefined
{
    let result = currentNameValue;
    currentNameValue = undefined;
    return result;
}

/*
 * name -> ClassName
 */
function attributeNC( name : string, clazz : string )
{
    print("<div class='container'><div class='attribute'><span class='name'>");
    print(name);
    print("</span> &rarr; <span class='title'>");
    print(clazz);
    print("</span></div></div>");
}

/*
 * name -> ClassName (value)
 */
function attributeNCV( name : string, clazz : string, value : string )
{
    print("<div class='container'><div class='attribute'>");

    if (name)
    {
        print("<span class='name'>");
        print(name);
        print("</span> &rarr; ");
    }

    print("<span class='title'>");
    print(clazz);
    print("</span> ( <span class='value'>");
    print(value);
    print("</span> ) </div></div>");
}

/*
 * name -> (value)
 */
function attributeNV( name : string, value : string )
{
    print("<div class='container'><div class='attribute'><span class='name'>");
    print(name);
    print("</span> &rarr; ( <span class='value'>");
    print(value);
    print("</span> ) </div></div>");
}

function missing()
{
    print("<div class='container'><span class='missing'>missing</span></div>");
}

/*
	protected void title( String name, Class<?> clazz )
	{
		out.append("<div class='attribute'><span class='name'>");
		out.append(name);
		out.append("</span> &rarr; <span class='title'>");
		out.append(clazz.getSimpleName());
		out.append("</span></div>");
		out.flush();
	}*/

function close()
{
    print("</div>");
}

function openC(clazz : string) : boolean
{
    print("<div class='container'>");
    if (clazz)
    {
        print("<div class='title'>");
        print(clazz);
        print("</div>");
    }
    return true;
}

function print( value : string )
{
    process.stdout.write(value);
}

/*
 * name -> ClassName
 */
function openNC( name : string, clazz : string ) : boolean
{
    print("<div class='container'>");
	print("<div class='dedent'>");

	if (name)
	{
		print("<span class='description'>");
		print(name);
		print("</span> &rarr; ");
	}

	print("<span class='title'>");
	print(clazz);
	print("</span>");

	print("</div>");
    return true;
}
/*
function printExpressionList(name : string, target : tree.ExpressionList)
{
    if (name == null) name = "expressionList";
    openC(name, target.constructor['name']);
    for (let item of target)
        printExpression(null, item);
    close();
}

	public void printAnnotationList(AnnotationList target)
	{
		if (target == null || target.size() == 0) return;

		open("annotations", target.getClass());
		for (Annotation item : target)
		{
			open(item.getClass());
			printTypeReference(item.type());
			close();
		}
		close();
	}
*/
export function printCompilationUnit(target : tree.CompilationUnit)
{
    print("<html><head><title>Beagle AST</title>");
    writeCSS();
    print("</head><body>");

    openC(target.constructor['name']);
    attributeNV("fileName", target.fileName);
	printStatements(undefined, target.statements);
    print("</body></html>");
}

export function printStatements( name : string | undefined, target : tree.IStatement[] )
{
	if (target.length == 0) return;

	if (!name) name = "statements";
	openNC(name, target.constructor['name']);
	for (let item of target)
		printStatement(undefined, item);
	close();
}

function printStatement(name : string | undefined, target : tree.IStatement)
{
	if (!target) return;

	if (target instanceof tree.BlockStmt)
	{
		printBlock(name, target);
		return;
	}

	if (name) openNC(name, target.constructor['name']);

	if (target instanceof tree.Function)
		printFunction(target);
	else
	if (target instanceof tree.StorageDeclaration)
		printStorageDeclaration(undefined, target);
	else
	if (target instanceof tree.TypeImport)
		printTypeImport(target);
	else
	if (target instanceof tree.Namespace)
		printNamespace(target);
	else
	if (target instanceof tree.TypeDeclaration)
		printTypeDeclaration(target);
	else
	if (target instanceof tree.ExpressionStmt)
		printExpression(undefined, target.expr);
	else
	if (target instanceof tree.ReturnStmt)
		printReturn(target);
	else
	if (target instanceof tree.IfThenElseStmt)
		printIfThenElse(target);
	else
	if (target instanceof tree.ForEachStmt)
		printForEachStmt(target);
	else
	if (target instanceof tree.Property)
		printProperty(target);
	else
	{
		if (!name) attributeNC("unknown", target.constructor['name']);
	}

	if (name) close();
}

function printReturn( target : tree.ReturnStmt )
{
	openC(target.constructor['name']);
	printExpression(undefined, target.expr);
	close();
}

function printExpression( name : string | undefined, target : tree.IExpression )
{
	if (!target) return;

	let type = target.constructor['name'];
	if (!name) name = "value";

	if (target instanceof tree.NameLiteral)
		attributeNCV(name, type, target.value.qualifiedName);
	else
	if (target instanceof tree.IntegerLiteral)
		attributeNCV(name, type, target.value);
	else
	if (target instanceof tree.FloatLiteral)
		attributeNCV(name, type, target.value);
	else
	if (target instanceof tree.StringLiteral)
		attributeNCV(name, type, "'" + target.value + "'");
	else
	if (target instanceof tree.BooleanLiteral)
		attributeNCV(name, type, (target.value) ? "true" : "false");
	else
	{
		openNC(name, type);
		if (target instanceof tree.BinaryExpression)
		{
			attributeNV("operation", target.operation.token);
			printExpression("left", target.left);
			printExpression("right", target.right);
		}
		else
		if (target instanceof tree.UnaryExpression)
		{
			attributeNV("operation", target.operation.token);
			printExpression("expression", target.expression);
			if (target.extra) printExpression("extra", target.extra);
			attributeNV("direction", target.direction.toString());
		}
		else
		if (target instanceof tree.ArgumentList)
		{
			for (let item of target.args)
			{
				openC(item.constructor['name']);
				if (item.name) attributeNV("name", item.name.qualifiedName);
				printExpression("value", item.value);
				close();
			}
		}
		close();
	}
}

export function printStorageDeclaration( name : string | undefined, target : tree.StorageDeclaration )
{
	openNC(name, target.constructor['name']);
	attributeNCV("name", target.name.constructor['name'], target.name.qualifiedName);
	if (target.type) attributeNCV("type", target.type.name.constructor['name'], target.type.name.qualifiedName);
	if (target.initializer) printExpression("initializer", target.initializer);
	close();
}

export function printNamespace( target : tree.Namespace )
{
	openC(target.constructor['name']);
	if (target.name) attributeNCV("name", target.name.constructor['name'], target.name.qualifiedName);
	printStatements(undefined, target.statements);
	close();
}

function printNamespaces( target : tree.Namespace[] )
{
	if (target.length == 0) return;

	openNC("namespaces", target.constructor['name']);
	for (let item of target)
		printNamespace(item);
	close();
}

function printAnnotations( annots : tree.Annotation[] )
{
	if (annots.length == 0) return;
	openNC("annotations", annots.constructor['name']);
	for (let item of annots)
	{
		openC(item.constructor['name']);
		attributeNCV("name", item.constructor['name'], item.name.qualifiedName);
		close();
	}
	close();
}

function printTypeDeclaration( target : tree.TypeDeclaration )
{
	openC(target.constructor['name']);
	printAnnotations(target.annotations);
	printAccessMode(target.access);
	attributeNCV("name", target.name.constructor['name'], target.name.qualifiedName);
	printStatements("statements", target.statements);
	close();
}

function printProperty( target : tree.Property )
{
	openC(target.constructor['name']);
	printAnnotations(target.annotations);
	printAccessMode(target.access);
	attributeNCV("name", target.name.constructor['name'], target.name.qualifiedName);
	printTypeReference(target.type);
	if (target.initializer) printExpression("initializer", target.initializer);
	close();
}

function printFunction( target : tree.Function )
{
	openC(target.constructor['name']);
	printAnnotations(target.annotations);
	printAccessMode(target.access);
	attributeNCV('name', target.name.constructor['name'], target.name.qualifiedName);
	printFormalParameters(target.parameters);
	if (target.type) printTypeReference(target.type);
	printStatement("body", target.body);
	close();
}

function printBlock( name : string | undefined, target : tree.BlockStmt )
{
	if (target.statements.length == 0) return;

	if (!name) name = "block";
	openNC(name, target.constructor['name']);
	for (let item of target.statements)
		printStatement(undefined, item);
	close();
}

function printAccessMode( target : tree.AccessMode )
{
	let value = '';
	if (target == tree.AccessMode.PUBLIC)
		value = 'public';
	else
	if (target == tree.AccessMode.PROTECTED)
		value = 'protected';
	else
	if (target == tree.AccessMode.PRIVATE)
		value = 'private';

	attributeNCV('access', 'AccessMode', value);
}

function printTypeReference( target : tree.TypeReference )
{
	openNC("type", target.constructor['name']);
	attributeNCV('name', target.name.constructor['name'], target.name.qualifiedName);
	attributeNCV('isPrimitive', target.isPrimitive.constructor['name'], (target.isPrimitive) ? 'true' : 'false');
	close();
}

function printFormalParameters( target : tree.FormalParameter[])
{
	if (target.length == 0) return;

	openNC("parameters", target.constructor['name']);
	for (let item of target)
		printFormatParameter(item);
	close();
}

function printFormatParameter( target : tree.FormalParameter )
{
	openC(target.constructor['name']);
	printName("name", target.name);
	printTypeReference(target.type);
	close();
}

function printName(name : string, target : tree.Name)
{
    if (!target) return;
    if (!name) name = "name";
    attributeNCV(name, target.constructor['name'], target.qualifiedName);
}

function printTypeImport(target : tree.TypeImport)
{
	openC(target.constructor['name']);
	//printPackage(item.namespace());
	printName("name", target.name);
	printName("alias", target.alias);
	close();
}

function printIfThenElse( target : tree.IfThenElseStmt )
{
	openC(target.constructor['name']);
	printExpression("condition", target.condition);
	printStatement("then", target.thenSide);
	printStatement("else", target.elseSide);
	close();
}

function printForEachStmt( target : tree.ForEachStmt )
{
	openC(target.constructor['name']);
	printStorageDeclaration("iterator", target.iterator);
	printExpression("expression", target.expression);
	printStatement("block", target.statement);
	close();
}

function writeCSS()
{
    print("<style>"
        + "html * {font-family: monospace; font-size: 14px; line-height: 20px}"
        + ".container {/*border: 1px solid red; margin-right: -1px; margin-bottom: -1px;*/ border-left: 1px dashed #ddd; padding-left: 1.5em; background-color: #fff}"
        + ".container:hover {border-left: 1px dashed #888;}"
        + "body div:first-of-type { border-left: none; }"
        + "body div:first-of-type:hover { border-left: none; }"
        + ".title {font-weight: 600;}"
        + ".missing {color: red}"
        + ".attribute .name {color: blue}"
        + ".container .description {color: blue}"
        + ".attribute .value {font-style: italic; color: green}"
        + "</style>");
}

}