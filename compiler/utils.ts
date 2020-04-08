declare let require: any;
let fs = require("fs");

export function readfile( fileName : string ) : string
{
    return fs.readFileSync(fileName, 'utf8');
}

export function realpath( fileName : string ) : string
{
    return fs.realpathSync(fileName);
}

export function dirname( fileName : string ) : string
{
    let path = realpath(fileName);
    return path.substr(0, path.lastIndexOf('/') + 1 );
}

export class Logger
{
    static content : string[] = [];

    static write( text : string )
    {
        if (this.content.length == 0) return Logger.writeln(text);
        this.content[ this.content.length - 1 ] += text;
    }

    static writeln( text : string )
    {
        this.content.push(text);
    }

    static toString() : string
    {
        return this.content.join('\n');
    }
}