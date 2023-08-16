import { SourceLocation } from './compiler';

export class ParseError extends Error
{
    public location : SourceLocation;

    constructor( message : string, location : SourceLocation )
    {
        if (location)
            super(`${message} at ${location.toString()}`);
        else
            super(`${message}`);
        this.location = location;
    }
}

export class SemanticError extends Error
{
    public location : SourceLocation;

    constructor( message : string, location : SourceLocation = null )
    {
        //if (location) message += ' at ' + location.toString();
        super(message);
        this.location = location;
    }
}