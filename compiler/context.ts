namespace beagle.compiler {

export interface CompilationListener
{

	onStart() : void;

	onError( location : SourceLocation | null, message : string ) : boolean;

	onWarning( location : SourceLocation | null, message : string ) : boolean;

	onFinish() : void;

}

export class ParserError extends Error
{

	constructor( message : string, public location : SourceLocation )
	{
		super(message);
	}

}

export class CompilationContext
{
	listener : CompilationListener;
	stringTable : string[];
	generated : string;

	constructor( listener : CompilationListener )
	{
		this.listener = listener;
		this.stringTable = [];
		this.generated = "";
	}

	public throwExpected( found : Token, types : TokenType[] )
	{
		if (this.listener == null) return;

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
		throw new ParserError(message, found.location);
	}
}

}