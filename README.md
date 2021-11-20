![Jane](extra/logo-128x128.png)

# Jane [![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fbrunexgeek%2Fjane%2Fbadge%3Fref%3Dmaster&label=build&logo=none)](https://actions-badge.atrox.dev/brunexgeek/jane/goto?ref=master)

Experimental programming language based on [TypeScript](https://www.typescriptlang.org/) that transpiles to ANSI C89. Jane is a dialect of TypeScript and is not intended to be fully compatible with it.

The project is being implemented incrementally and in the first iteration the goal is to have a [self-hosting](https://en.wikipedia.org/wiki/Self-hosting_%28compilers%29) compiler. For that, the least possible number of TypeScript features are being used in order to make the implementation simple to compile. For example, the current implementation does not use generics (and the compiler does not support it).

For now, the compiler generates ANSI C89 code from Jane sources. You can generate native binaries using any C or C++ compiler available in your environment (e.g. GCC, MSVC++). In the future [LLVM](https://llvm.org/) will be integrated into the compiler to perform optimization e code generation.