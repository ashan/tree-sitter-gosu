# tree-sitter-gosu

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [Gosu](https://gosu-lang.github.io/), a general-purpose programming language for the Java Virtual Machine.

## Status

**Accuracy**: 99.98% (Tested on 5281 production source files)

This parser handles the full Gosu language specification, including:
- Class/Interface/Enum/Structure declarations
- Generics and Type Arguments
- Closures / Blocks (with and without arguments)
- String Interpolation (`"Hello ${name}"`, nested quotes supported)
- Gosu-specific features (`uses`, `package`, `enhancements`, `properties`)
- Complex expressions (ternary `? :`, elvis `?:`, null-safe `?.`, `?[]`)

### Validated on Production Code
The parser has been validated against a massive corpus of over 5000 Gosu files. 
- **Success**: 5280 files
- **Failures**: 1 file (known edge case, see below)

### Known Limitations
There is one known parsing ambiguity related to the interaction between **Generic Types** and **Binary Expressions** in specific contexts where `foreach` is involved.

**Example Failure Pattern:**
```gosu
var x = someObject as Type<AssignableQueue>
foreach (i in list) { ... }
```
In extremely rare cases, the parser may interpret the closing `>` of the generic type and the following `foreach` keyword as part of a binary comparison (e.g., `Type < AssignableQueue > foreach`). This is a limitation of the GLR parser's ability to disambiguate this specific lookahead without semantic analysis.
*Impact*: Negligible (1 file out of 5281).

## Usage

### CLI
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the parser:
   ```bash
   npm run build
   ```
3. Parse a file:
   ```bash
   ./node_modules/.bin/tree-sitter parse path/to/file.gs
   ```

### Node.js
```javascript
const Parser = require('tree-sitter');
const Gosu = require('tree-sitter-gosu');

const parser = new Parser();
parser.setLanguage(Gosu);

const sourceCode = 'print("Hello World")';
const tree = parser.parse(sourceCode);
console.log(tree.rootNode.toString());
```

## Development

### Structure
- `grammar.ts` - The grammar definition
- `src/scanner.c` - External scanner for complex tokens (Number Literals handling hex, float, suffixes like `bd`)
- `test/corpus/` - Corpus tests covering language features

### Running Tests
```bash
npm test
```

### Analysis Tool
A failure analysis script is included to batch-parse directories and report errors.
```bash
npx ts-node scripts/analyze_failures.ts ./your-gsrc-dir
```
