package nz.co.acc.common.upgrade.before.impl

uses gw.api.database.Relop
uses gw.api.database.upgrade.before.IBeforeUpgradeSelectBuilder
uses gw.api.database.upgrade.before.IBeforeUpgradeTable

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.upgrade.DatamodelUpgrade
uses nz.co.acc.common.upgrade.DatamodelUpgradeStatus
uses nz.co.acc.common.upgrade.before.AbstractBeforeUpgrade
uses nz.co.acc.common.upgrade.function.AbstractScriptExecutor
uses nz.co.acc.common.upgrade.function.struct.ScriptDescriptor

/**
 * @author Ron Webb
 * @since 2019-06-18
 */
class SQLScriptExecutor extends AbstractScriptExecutor<AbstractBeforeUpgrade> {

  private static final var LOG = StructuredLogger.CONFIG.withClass(SQLScriptExecutor)

  public construct(receiver : AbstractBeforeUpgrade) {
    super(receiver)
  }

  protected var _table : IBeforeUpgradeTable
  protected var _recordID : Long

  protected function addCompositeKey(descriptor : ScriptDescriptor, qry : IBeforeUpgradeSelectBuilder) {
    qry.compare("Filename", Relop.Equals, descriptor.Filename)
    qry.compare("Code", Relop.Equals, descriptor.Code)
  }

  protected function getRecordID(descriptor : ScriptDescriptor) : Long {
    _table = _receiver.ScriptExecutorTable
    var qry = _table.query()
    addCompositeKey(descriptor, qry)
    return qry?.read({"ID"}).first()?[0] as Long
  }

  override function beforeExecute(descriptor : ScriptDescriptor) : boolean {
      _table = _receiver.ScriptExecutorTable
      var qry = _table.query()
      addCompositeKey(descriptor, qry)
      var response = qry?.read({"ID", "Status"}).first()

      if (response == null) {
        try {
          var insert = _table.insert()
          insert.mapColumn("Code", descriptor.Code)
              .mapColumn("Description", descriptor.Description)
              .mapColumn("Filename", descriptor.Filename)
              .mapColumn("Directory", descriptor.Directory)
              .mapColumn("Type", descriptor.Type.toString())
              .mapColumn("Event", descriptor.Event.toString())
              .mapColumn("Status", DatamodelUpgradeStatus.IDLE.toString())
              .mapColumn("Extension", _receiver.ApplicableMinorVersion)
              .mapColumn("ServerID", descriptor.ServerID)
              .mapColumn("AlwaysExecute", descriptor.AlwaysExecute)
          insert.execute()

        } catch (exp : Exception) {
          LOG.error_ACC(exp.StackTraceAsString)
        }
      }

      _recordID = getRecordID(descriptor)

      var status = DatamodelUpgradeStatus.valueOf((response[1] as String)?:"IDLE")
      return descriptor.AlwaysExecute or status == DatamodelUpgradeStatus.IDLE
  }

  override function setStatus(pStatus : DatamodelUpgradeStatus) {
    var update = _table.update()
    update.set("Status", pStatus.toString())
        .compare("ID", Relop.Equals, _recordID)
    update.execute()
  }

  protected property get Status() : DatamodelUpgradeStatus {
    var qry = _table.query()
    qry.compare("ID", Relop.Equals, _recordID)
    var response = qry?.read({"Status"}).first()?[0] as String
    return DatamodelUpgradeStatus.valueOf(response?:"IDLE")
  }

  override function success(descriptor : ScriptDescriptor) {
      LOG.debug("${descriptor.Filename} Success")
      setStatus(DatamodelUpgradeStatus.FINISHED)
  }

  override function error(descriptor : ScriptDescriptor, exception : Exception) {
      var message = exception.StackTraceAsString

      var update = _table.update()
      update.set("Status", DatamodelUpgradeStatus.ERROR.toString())
          .set("Error", message)
          .compare("ID", Relop.Equals, getRecordID(descriptor))
      update.execute()

      LOG.error_ACC(message)

  }

  override function afterExecute(descriptor : ScriptDescriptor) {
      LOG.debug("${descriptor.Filename} Done")
  }
}