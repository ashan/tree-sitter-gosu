package gw.apd.model.generate

uses gw.lang.reflect.IType

/**
 * Used in API codegen templates to reorganize uses statements in the generated source code. Typical users would
 * {@link #add(String) add} multiple imports and then call {@link #toString()} in a gosu template to get the reorganized
 * list of uses statements.
 *
 * @see gw.apd.model.generate.templates.rest.CoverableGenResource CoverableGenResource
 * @see gw.apd.model.generate.templates.rest.CoverablesGenResource CoverablesGenResource
 */
@Export
class UsesStatementHandler {
  private final var _regularImports : Set<String> = {}
  private final var _javaImports : Set<String> = {}
  private final var _staticImports : Set<String> = {}

  function add(import : IType) {
    add(import.Name)
  }

  function add(import : String) {
    if (import.startsWith("java")) {
      _javaImports.add(import)
    } else if (import.contains("#")) {
      _staticImports.add(import)
    } else {
      _regularImports.add(import)
    }
  }

  override function toString() : String {
    var sb = new StringBuilder()
    appendImports(sb, _regularImports)
    appendImports(sb, _javaImports)
    appendImports(sb, _staticImports)
    return sb.toString()
  }

  private static function appendImports(sb : StringBuilder, imports : Set<String>) {
    if (!imports.Empty) {
      sb.append("\n")
      imports.toList().sort().each(\import -> sb.append("\nuses ${import}"))
    }
  }
}