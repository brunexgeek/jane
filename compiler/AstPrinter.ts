/// <reference path="tree.ts" />

namespace beagle.compiler {

let currentNameValue : string = null;

function setCurrentName(value : string)
{
    currentNameValue = value;
}

function getCurrentName() : string
{
    let result = currentNameValue;
    currentNameValue = null;
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
    if (temp != null) name = temp;

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
	printTypeImportList(target.importList);
	printNamespaces([target.members]);
    print("</body></html>");
}

export function printNamespace( target : tree.Namespace )
{
	openC(target.constructor['name']);

	printNamespaces(target.namespaces);

	if (target.name != null)
		attributeNCV("name", target.name.constructor['name'], target.name.qualifiedName);

	printAnnotations(target.annotations);
	printFunctions(target.functions);
	printStructures(target.structures);

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

function printFunctions( target : tree.Function[] )
{
	openNC("functions", target.constructor['name']);
	for (let item of target)
		printFunction(item);
	close();
}

function printStructures( target : tree.Structure[] )
{
	openNC("structures", target.constructor['name']);
	for (let item of target)
		printStructure(item);
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

function printStructure( target : tree.Structure )
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
	attributeNCV('name', target.name.constructor['name'], target.name.qualifiedName);
	close();
}

/*
	private void printStructures(StructureList target)
	{
		open("structures", target.getClass());
		for (Structure item: target)
		{
			open(item.getClass());
			attribute("name", item.name.getClass(), item.name.qualifiedName());
			printTypeReference("parent", item.parent);
			printTypeBody(item.body);
			close();
		}
		close();
	}

	public void printFunctions( FunctionList target )
	{
		open("functions", target.getClass());
		for (Function func : target)
			printFunction(func);
		close();
	}


	public void printConstantOrVariable(boolean heading, StorageDeclaration target)
	{
		if (heading) open(target.getClass());
		printAnnotationList(target.annotations());
		printModifiers(target.modifiers());
		printName(target.name());
		printTypeReference(target.type());
		printExpression("initializer",target.initializer());
		if (heading) close();
	}

	public void printArgument(Argument target)
	{
		if (target == null) return;

		open(target.getClass());
		printName(target.name());
		printExpression("value", target.value());
		close();
	}

	public void printFormalParameterList(FormalParameterList target)
	{
		if (target == null) return;

		open("parameters", target.getClass());
		for (FormalParameter item : target)
		{
			open(item.getClass());
			printName(item.name());
			printTypeReference(item.type());
			close();
		}
		close();
	}

	public void printFunction(Function target)
	{
		open(target.getClass());
		printAnnotationList(target.annotations());
		printModifiers(target.modifiers());
		printName(target.name());
		printFormalParameterList(target.parameters());
		printTypeReference(target.returnType());
		printStatement("body",target.body());
		close();
	}

	public void printModifiers(Modifiers target)
	{
		if (target == null) return;
		attribute("modifiers", target.getClass(), target.toString());
	}

    public void printName(Name target)
	{
		printName(null, target);
	}
*/
function printName(name : string, target : tree.Name)
{
    if (target == null) return;
    if (name == null) name = "name";
    attributeNCV(name, target.constructor['name'], target.qualifiedName);
}
/*
	public void printTypeBody(TypeBody target)
	{
		if (target.storages.size() == 0 && target.functions.size() == 0) return;

		open("body", target.getClass());

		for (StorageDeclaration item : target.storages)
			printConstantOrVariable(true, item);

		for (Function item : target.functions)
			printFunction(item);

		close();
	}


	public void printTypes(TypeDeclarationList target)
	{
		if (target.size() == 0) return;

		open("types", target.getClass());
		for (TypeDeclaration item : target)
		{
			open(item.getClass());
			printAnnotationList(item.annotations());
			printModifiers(item.modifiers());
			printName(item.name());
			printTypeReferenceList(item.extended());
			printTypeBody(item.body());
			close();
		}
		close();
	}

	public void printPackage(Package target)
	{
		if (target == null) return;
		attribute("package", target.getClass(), target.qualifiedName());
	}
*/

function printTypeImportList(target : tree.TypeImport[])
{
    if (target.length == 0) return;

    openNC("imports", target.constructor['name']);
    for (let item of target)
    {
        openC(item.constructor['name']);
        //printPackage(item.namespace());
        printName("name", item.name);
        printName("alias", item.alias);
        close();
    }
    close();
}

/*
	public void printTypeReference(TypeReference target)
	{
		printTypeReference("type", target);
	}

	public void printTypeReference(String name, TypeReference target)
	{
		if (target == null) return;

		if (target.parent() instanceof TypeReferenceList)
		{
			open(target.getClass());
			attribute(name, target.getClass(), target.qualifiedName());
			close();
		}
		else
		{
			attribute(name, target.getClass(), target.qualifiedName());
		}
	}


	public void printTypeReferenceList(TypeReferenceList target)
	{
		open("inherit", target.getClass());
		for (TypeReference item : target)
			printTypeReference(item);
		close();
	}

	protected void printStatement(String name, IStatement stmt)
	{
		if (stmt == null) return;

		if (name == null)
			open(stmt.getClass());
		else
			open(name, stmt.getClass());

		if (stmt instanceof ReturnStmt)
		{
			printExpression("value", ((ReturnStmt)stmt).expression());
		}
		else
		if (stmt instanceof IfThenElseStmt)
		{
			printExpression("condition", ((IfThenElseStmt)stmt).condition());
			printStatement("then", ((IfThenElseStmt)stmt).thenSide());
			printStatement("else", ((IfThenElseStmt)stmt).elseSide());
		}
		else
		if (stmt instanceof Block)
		{
			for (IStatement item : (Block)stmt)
				printStatement(null, item);
		}
		else
		if (stmt instanceof StorageDeclaration)
		{
			printConstantOrVariable(false, (StorageDeclaration)stmt);
		}
		else
			missing();

		close();
	}

	protected void printExpression(String name, IExpression expr)
	{
		if (expr == null) return;

		if (expr instanceof NameLiteral)
		{
			attribute(name, NameLiteral.class, ((NameLiteral)expr).value().qualifiedName());
			return;
		}

		if (expr instanceof StringLiteral)
		{
			attribute(name, StringLiteral.class, ((StringLiteral)expr).value());
			return;
		}

		if (expr instanceof IntegerLiteral)
		{
			attribute(name, IntegerLiteral.class, Long.toString( ((IntegerLiteral)expr).value() ));
			return;
		}

		if (expr instanceof BooleanLiteral)
		{
			attribute(name, BooleanLiteral.class, Boolean.toString( ((BooleanLiteral)expr).value()) );
			return;
		}

		if (expr instanceof NullLiteral)
		{
			attribute("expression", NullLiteral.class);
			return;
		}

		open(name, expr.getClass());

		if (expr instanceof AtomicExpression)
		{
			printExpression("expression", ((AtomicExpression)expr).value());
		}
		else
		if (expr instanceof UnaryExpression)
		{
			attribute("operation", ((UnaryExpression)expr).operation().toString());
			printExpression("expression", ((UnaryExpression)expr).expression());
			printExpression("right", ((UnaryExpression)expr).extra());
		}
		else
		if (expr instanceof BinaryExpression)
		{
			attribute("operation", ((BinaryExpression)expr).operation().toString());
			printExpression("left", ((BinaryExpression)expr).left());
			printExpression("right", ((BinaryExpression)expr).right());
		}
		else
		if (expr instanceof ExpressionList)
		{
			for (IExpression item : ((ExpressionList)expr))
				printExpression(null, item);
		}
		else
		if (expr instanceof ArgumentList)
		{
			for (Argument item : ((ArgumentList)expr))
				printArgument(item);
		}
		else
			missing();

		close();
	}
*/

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