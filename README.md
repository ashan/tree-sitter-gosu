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

#### Optional Semicolon + Type Cast + Foreach

There is one known parsing limitation when using `foreach` immediately after a variable declaration with a **long qualified generic type cast** and **no semicolon**.

**Problematic Pattern:**
```gosu
var processor = call() as very.long.qualified.TypeName<GenericArg>
foreach (i in processor.iterator()) {
  // Parser may fail here
}
```

**Root Cause:**  
Gosu allows optional semicolons. When a line ends with a complex type cast like `as Type<Generic>`, the parser cannot definitively determine if the statement has ended or continues on the next line. In rare cases, it may interpret `foreach` as an identifier (continuing the expression) rather than a statement keyword.

**Solution:**  
Add a semicolon after the type cast:
```gosu
var processor = call() as very.long.qualified.TypeName<GenericArg>;  // ← Add semicolon
foreach (i in processor.iterator()) {
  // Now parses correctly
}
```

**Alternative:**  
Use the `var` keyword in the foreach:
```gosu
var processor = call() as very.long.qualified.TypeName<GenericArg>
foreach (var i in processor.iterator()) {  // ← Add 'var'
  // Also parses correctly
}
```

**Impact:** Affects only 1 file out of 5,281 tested (0.019%). All other foreach patterns parse correctly.


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

### Bulk Parsing & Analysis tool

The repository includes a script to batch-parse entire directories of Gosu source code. This is useful for validating the parser against large codebases (e.g., standard libraries or application code).

**Usage:**
```bash
npm run analyze -- /path/to/your/gosu/files
```

**Features:**
- Recursively finds all `.gs` and `.gsx` files in the target directory.
- Parses files in parallel batches.
- Reports failures with file paths and error details.
- Generates a detailed JSON report (`analysis_report.json`) containing:
  - Success/Failure counts and rates.
  - List of all failed files.
  - precise locations of parsing errors.
  - Performance metrics (files/sec).
