package nz.co.acc.common.upgrade.after.impl

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.upgrade.DatamodelUpgrade
uses nz.co.acc.common.upgrade.function.struct.ScriptStatement

uses java.nio.file.Paths
uses java.util.function.Function

/**
 * @author Ron Webb
 * @since 2019-06-24
 */
class GosuStatementParser implements Function<ScriptStatement, String> {

  private static final var LOG = StructuredLogger.CONFIG.withClass(GosuStatementParser)

  override function apply(stmt : ScriptStatement) : String {
    var logic : Map<String, block() : String> = {
        "script" -> \-> stmt.Statement,
        "file" -> \-> {
          var file=stmt.Statement
          var script = Paths.get(stmt.Directory, {file}).toFile()
          if (script.exists()) {
            var stmtFromFile = script.read()
            return stmtFromFile
          } else {
            var message = "${script.toString()} not found."
            throw new RuntimeException(message)
          }
        }
    }

    var statement = logic.getOrDefault(stmt.Mode.toLowerCase(), \->"")()
    LOG.debug("Statement: ${statement}")
    return statement
  }
}