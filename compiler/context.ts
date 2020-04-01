/*
 *   Copyright 2020 Bruno Ribeiro
 *   <https://github.com/brunexgeek/beagle-lang>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

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
			message += "'" + /*type.name*/"bla" + "'";
			first = false;

		}
		message += " but found '" + /* ((found.type.name == "") ? found.value : found.type.name)*/"bla" + "'";
		this.listener.onError(found.location, message);
		throw new ParserError(message, found.location);
	}
}
