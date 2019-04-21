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

    if (name != null)
    {
        print("<span class='name'>");
        print(name);
        print("</span> &rarr; ");
    }

    print("<span class='title'>");
    print(clazz);
    print("</span>(<span class='value'>");
    print(value);
    print("</span>)</div></div>");
}

/*
 * name -> (value)
 */
function attributeNV( name : string, value : string )
{
    print("<div class='container'><div class='attribute'><span class='name'>");
    print(name);
    print("</span> &rarr; (<span class='value'>");
    print(value);
    print("</span>)</div></div>");
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
    if (clazz != null)
    {
        print("<div class='title'>");
        print(clazz);
        print("</div>");
    }
    return true;
}

function print( value : string )
{
    console.log(value);
}

/*
 * name -> ClassName
 */
function openNC( name : string, clazz : string ) : boolean
{
    let temp = getCurrentName();
    if (temp != undefined) name = temp;

    print("<div class='container'>");
    if (name != null && clazz != null)
    {
        print("<div class='dedent'>");

        if (name != null)
        {
            print("<span class='description'>");
            print(name);
            print("</span> &rarr; ");
        }

        print("<span class='title'>");
        print(clazz);
        print("</span>");

        print("</div>");
    }
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
    attributeNC("fileName", target.fileName);
	printStatements(undefined, target.statements);
	//printStorages(target.storages);
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
		printStorageDeclaration(target);
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
	{
		openNC("unknown", "Unknown");
		close();
	}

	if (name) close();
}

export function printStorageDeclaration( target : tree.StorageDeclaration )
{
	openC(target.constructor['name']);
	attributeNCV("name", target.name.constructor['name'], target.name.qualifiedName);
	if (target.type) attributeNCV("type", target.type.name.constructor['name'], target.type.name.qualifiedName);
	close();
}

export function printNamespace( target : tree.Namespace )
{
	openC(target.constructor['name']);
	if (target.name != null)
		attributeNCV("name", target.name.constructor['name'], target.name.qualifiedName);
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
	attributeNCV("name", target.name.constructor['name'], target.name.qualifiedName);
	attributeNCV("access", target.access.constructor['name'], target.access.toString());

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
    if (target == null) return;
    if (name == null) name = "name";
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