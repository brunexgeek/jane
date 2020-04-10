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

export class StringBuffer
{
    private content : string[] = [''];
    private indentation : number = 0;

    write( text : string, lbreak : boolean = false )
    {
        let index = this.content.length - 1;

        if (this.indentation > 0)
        {
            let temp = '    '.repeat(this.indentation);
            if (this.content[index].length == 0)
                this.content[index] += temp;
            for (let c of text)
            {
                if (c == '\n')
                {
                    this.content[index] += '\n';
                    this.content[index] += temp;
                }
                else
                this.content[index] += c;
            }
        }
        else
            this.content[index] += text;
        if (lbreak) this.content.push('');
    }

    writeln( text : string )
    {
        this.write(text, true);
    }

    toString() : string
    {
        return this.content.join('\n');
    }

    indent() : void
    {
        this.indentation++;
    }

    dedent() : void
    {
        this.indentation--;
        if (this.indentation < 0) this.indentation = 0;
    }
}