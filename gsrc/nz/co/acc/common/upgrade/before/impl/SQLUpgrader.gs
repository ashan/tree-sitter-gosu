package nz.co.acc.common.upgrade.before.impl

uses gw.lang.reflect.Expando
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.common.function.impl.CurrentExtension
uses nz.co.acc.common.upgrade.DatamodelUpgrade
uses nz.co.acc.common.upgrade.before.AbstractBeforeUpgrade
uses nz.co.acc.common.upgrade.function.struct.ScriptDescriptor

/**
 * @author Ron Webb
 * @since 2019-06-14
 */
class SQLUpgrader extends AbstractBeforeUpgrade {

  private static final var LOG = StructuredLogger.CONFIG.withClass(SQLUpgrader)

  protected var _descriptor : ScriptDescriptor

  construct(descriptor : ScriptDescriptor) {
    this(Funxion.buildGenerator(new CurrentExtension()).generate(), descriptor)
  }

  construct(minorVersionWhenTriggerIsApplicable : int, descriptor : ScriptDescriptor) {
    super(minorVersionWhenTriggerIsApplicable)
    _descriptor = descriptor
  }

  override function execute() {
    Optional.ofNullable(_descriptor).ifPresent(\___descriptor -> {

      var handler : Dynamic = new Expando()
      handler.Descriptor = ___descriptor
      handler.ExecuteLogic = \-> {

        var background = "${___descriptor.Background ? " (Background)" : ""}"
        LOG.info("[${___descriptor.Code}@${___descriptor.Filename}] ${Description}${background}")

        for (statement in ___descriptor.Statements) {
          var sql = Funxion.buildProcessor(new SQLStatementParser()).process(statement)
          LOG.info("Executing: ${statement.Statement}")
          executeRawUpdateSQL(sql)
          LOG.info("Finished executing: ${statement.Statement}")
        }
      }

      Funxion.buildExecutor(new SQLScriptExecutor(this)).execute(handler)

    })
  }

  override property get Description() : String {
    return _descriptor?.Description
  }
}