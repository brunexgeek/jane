#!/usr/bin/python

import sys

def createMap(name, type1, type2):
    sys.stdout.write('export class ' + name + '{\n')
    sys.stdout.write('\tprivate keys : ' + type1 + '[] = [];\n')
    sys.stdout.write('\tprivate items : ' + type2 + '[] = [];\n')
    sys.stdout.write('\tget( key : ' + type1 + ' ) : ' + type2 + ' {\n')
    sys.stdout.write('''\t\tlet i = this.keys.indexOf(key);
\t\tif (i < 0) return null;
\t\treturn this.items[i];
\t}\n''');
    sys.stdout.write('\tset( key : ' + type1 + ', value : ' + type2 + ' ) {\n')
    sys.stdout.write('''\t\tlet i = this.keys.indexOf(key);
\t\tif (i >= 0) this.items[i] = value;
\t\telse { this.keys.push(key); this.items.push(value); }
\t}\n''');
    sys.stdout.write('\thas( key : ' + type1 + ' ) : boolean { return this.get(key) != null; }\n');
    sys.stdout.write('\tget size() : number { return this.keys.length; }\n');
    sys.stdout.write('\tdelete( key : ' + type1 + ' ) {\n')
    sys.stdout.write('''\t\tlet i = this.keys.indexOf(key);
\t\tif (i < 0 || this.size == 0) return false;
\t\tlet last = this.keys.length - 1;
\t\tif (i != last) {
\t\t\tthis.keys[i] = this.keys[last];
\t\t\tthis.items[i] = this.items[last];
\t\t}
\t\tthis.keys.pop();
\t\tthis.items.pop();
\t}\n''');
    sys.stdout.write('\tvalues() : ' + type2 + '[] { return this.items; }\n}\n');

def main():
    name = sys.argv[1]
    type1 = sys.argv[2]
    type2 = sys.argv[3]
    createMap(name, type1, type2)

if __name__ == "__main__":
    main()