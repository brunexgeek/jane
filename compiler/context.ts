namespace beagle.compiler {

export interface CompilationListener
{

	onStart() : void;

	onError( location : SourceLocation, message : string ) : boolean;

	onWarning( location : SourceLocation, message : string ) : boolean;

	onFinish() : void;

}

export class CompilationContext
{
	listener : CompilationListener;
	stringTable : string[];
	generated : string;

	constructor()
	{
		this.listener = null;
		this.stringTable = [];
		this.generated = "";
	}

	public throwExpected( found : Token, types : TokenType[] )
	{
		let first = true;
		let message = "Syntax error, expected ";
		for (let type of types)
		{
			if (!first) message += " or ";
			message += "'" + type.name + "'";
			first = false;

		}
		message += " but found '" + ((found.type.name == "") ? found.value : found.type.name) + "'";
		this.listener.onError(found.location, message);
	}
}

}