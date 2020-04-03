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

export class Map<K, V>
{
    private keys : K[] = [];
    public values : V[] = [];

    find( key : K ) : V
    {
        let idx = this.keys.indexOf(key);
        if (idx == -1) return null;
        return this.values[idx];
    }

    insert( key : K, value : V )
    {
        this.keys.push(key);
        this.values.push(value);
    }

    contains( key : K ) : boolean
    {
        return this.keys.indexOf(key) >= 0;
    }
}