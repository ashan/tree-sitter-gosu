package nz.co.acc.common.upgrade.after.impl

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.lang.reflect.Expando
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.transaction.Transaction

uses nz.co.acc.common.function.Funxion
uses nz.co.acc.common.function.impl.CurrentExtension
uses nz.co.acc.common.upgrade.function.ExecuteDataChange
uses nz.co.acc.common.upgrade.DatamodelUpgrade
uses nz.co.acc.common.upgrade.after.AbstractAfterUpgrade
uses nz.co.acc.common.upgrade.function.struct.ScriptDescriptor

/**
 * @author Ron Webb
 * @since 2019-06-17
 */
class GosuUpgrader extends AbstractAfterUpgrade {

  private static final var LOG = StructuredLogger.CONFIG.withClass(GosuUpgrader)

  protected var _descriptor : ScriptDescriptor

  construct(descriptor : ScriptDescriptor) {
    this(Funxion.buildGenerator(new CurrentExtension()).generate(), descriptor)
  }

  construct(minorVersionWhenTriggerIsApplicable : int, pDescriptor : ScriptDescriptor) {
    super(minorVersionWhenTriggerIsApplicable)
    _descriptor = pDescriptor
  }

  private static property get TransactionUser() : User {
    return User.util.getUnrestrictedUser()
  }

  protected function loadToDataChange(ref : String, gosu : String, desc : String, alwaysExecute : Boolean) : DataChange {
    var row : DataChange
    Transaction.runWithNewBundle(\bundle -> {
      row = Query.make(entity.DataChange).compare("ExternalReference", Relop.Equals, ref).select().AtMostOneRow
      if (row == null) {
        row = new DataChange(bundle)
        row.Status = TC_OPEN
        row.ExternalReference = ref
      } else {
        row = bundle.add(row)
      }

      if (row.Status == TC_OPEN) {
        row.Gosu = gosu
        row.Description = desc
        row.Result = null

      } else if (alwaysExecute && row.Status == TC_COMPLETED) {
        row.Gosu = gosu
        row.Description = desc
        row.Result = null
        row.Status = TC_OPEN

      } else {
        throw new IllegalArgumentException(DisplayKey.get("Java.DataChange.WrongState", ref, row.Status, DataChangeStatus.TC_OPEN))
      }
    }, TransactionUser)
    return row
  }

  public function generateRef(code : String, filename : String) : String {
    var ref = new StringJoiner("@")
        .add(code)
        .add(filename).toString()
    return ref
  }

  public function addExecuteNextDataChange(statement : String, refID : String) : String {
    var actualCode = new StringJoiner("")
        .add("nz.co.acc.common.function.Funxion.buildExecutor")
        .add("(new nz.co.acc.common.upgrade.function.ExecuteDataChangeByRefID()).execute")
        .add("(\"${refID}\")")
        .toString()

    var additionalCode = new StringJoiner("\n")
        .add(statement)
        .add("//----- Execute next data change -----//")
        .add(actualCode)
        .toString()

    return additionalCode
  }

  override function execute() {
    Optional.ofNullable(_descriptor).ifPresent(\___descriptor -> {

      var handler : Dynamic = new Expando()
      handler.Descriptor = ___descriptor
      handler.ExecuteLogic = \-> {
        var filename = ___descriptor.Filename
        var background = "${___descriptor.Background ? " (Background)" : ""}"
        LOG.info("[${___descriptor.Code}@${filename}] ${Description}${background}")

        var stmtsCount = ___descriptor.Statements?.Count

        var firstDataChange : DataChange

        ___descriptor.Statements.eachWithIndex(\___statement, ___idx -> {
          var idx = ___idx + 1
          var statement = Funxion.buildProcessor(new GosuStatementParser()).process(___statement)

          if (statement?.NotBlank) {

            var textWithIndex = \___text : String, ____idx : int -> "${___text}-${____idx}"

            var ref = generateRef(textWithIndex(___descriptor.Code, idx), filename)

            var description = new StringJoiner("/")
                .add(textWithIndex(___descriptor.Description, idx))
                .add(String.valueOf(stmtsCount)).toString()

            LOG.info("Will execute ${ref}: ${___statement.Statement}")

            if (idx < stmtsCount) {
              var targetRefID = generateRef(textWithIndex(___descriptor.Code, idx + 1), filename)
              statement = addExecuteNextDataChange(statement, targetRefID)
            }

            var dataChange = loadToDataChange(ref, statement, description, ___descriptor.AlwaysExecute)

            if (idx == 1) {
              firstDataChange = dataChange
            }
          }
        })

        if (!___descriptor.NoExecute) {
          Funxion.buildExecutor(new ExecuteDataChange()).execute(firstDataChange)
        }
      }

      Funxion.buildExecutor(new GosuScriptExecutor(this)).execute(handler)

    })
  }

  override property get Description() : String {
    return _descriptor?.Description
  }
}