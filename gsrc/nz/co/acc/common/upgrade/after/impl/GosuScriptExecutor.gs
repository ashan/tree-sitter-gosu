package nz.co.acc.common.upgrade.after.impl

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Bean
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.transaction.Transaction

uses nz.co.acc.common.upgrade.DatamodelUpgrade
uses nz.co.acc.common.upgrade.DatamodelUpgradeStatus
uses nz.co.acc.common.upgrade.after.AbstractAfterUpgrade
uses nz.co.acc.common.upgrade.function.AbstractScriptExecutor
uses nz.co.acc.common.upgrade.function.struct.ScriptDescriptor

/**
 * @author Ron Webb
 * @since 2019-06-19
 */
class GosuScriptExecutor extends AbstractScriptExecutor<AbstractAfterUpgrade> {

  private static final var LOG = StructuredLogger.CONFIG.withClass(GosuScriptExecutor)

  public construct(receiver : AbstractAfterUpgrade) {
    super(receiver)
  }

  protected var _recordID : String

  protected function addCompositeKey(descriptor : ScriptDescriptor, qry : Query<Bean>) {
    qry.compare("Filename", Relop.Equals, descriptor.Filename)
    qry.compare("Code", Relop.Equals, descriptor.Code)
  }

  protected function getRecordID(descriptor : ScriptDescriptor) : String {
    var qry = Query.make<UpgradeExecutorLog>(UpgradeExecutorLog)
    addCompositeKey(descriptor, qry)
    return qry?.select()?.getAtMostOneRow()?.PublicID
  }

  override function beforeExecute(descriptor : ScriptDescriptor) : boolean {
    var qry = Query.make<UpgradeExecutorLog>(UpgradeExecutorLog)
    addCompositeKey(descriptor, qry)
    var response = qry?.select()?.AtMostOneRow
    _recordID = response?.PublicID
    var recordStatus = response?.Status

    if (recordStatus == null) {
      try {

        Transaction.runWithNewBundle(\___bundle -> {

          var upgradeLog = new UpgradeExecutorLog(___bundle)
          upgradeLog.Code = descriptor.Code
          upgradeLog.Description = descriptor.Description
          upgradeLog.Filename = descriptor.Filename
          upgradeLog.Directory = descriptor.Directory
          upgradeLog.Type = descriptor.Type.toString()
          upgradeLog.Event = descriptor.Event.toString()
          upgradeLog.Status = DatamodelUpgradeStatus.IDLE.toString()
          upgradeLog.Extension = _receiver.ApplicableMinorVersion
          upgradeLog.ServerID = descriptor.ServerID
          upgradeLog.AlwaysExecute = descriptor.AlwaysExecute

          recordStatus = DatamodelUpgradeStatus.IDLE.toString()

        }, TransactionUser)

      } catch (exp : Exception) {
        LOG.error_ACC(exp.StackTraceAsString)
      }
    }

    _recordID = getRecordID(descriptor)

    return descriptor.AlwaysExecute or DatamodelUpgradeStatus.valueOf(recordStatus) == DatamodelUpgradeStatus.IDLE

  }

  override function setStatus(pStatus : DatamodelUpgradeStatus) {
    var qry = Query.make<UpgradeExecutorLog>(UpgradeExecutorLog)
    qry.compare(UpgradeExecutorLog#PublicID, Relop.Equals, _recordID)

    var upgradeLog = qry.select()?.AtMostOneRow
    Transaction.runWithNewBundle(\___bundle -> {
      upgradeLog = ___bundle.add(upgradeLog)
      upgradeLog.Status = pStatus.toString()
    }, TransactionUser)
  }

  private static property get TransactionUser() : String {
    return "sys"
  }

  protected property get Status() : DatamodelUpgradeStatus {
    var qry = Query.make<UpgradeExecutorLog>(UpgradeExecutorLog)
    qry.compare(UpgradeExecutorLog#ID, Relop.Equals, _recordID)
    var response = qry?.select()?.AtMostOneRow?.Status
    return DatamodelUpgradeStatus.valueOf(response ?: "IDLE")
  }

  override function success(descriptor : ScriptDescriptor) {

    LOG.debug("${descriptor.Filename} Success")
    setStatus(DatamodelUpgradeStatus.FINISHED)

  }

  override function error(descriptor : ScriptDescriptor, exception : Exception) {

    var message = exception.StackTraceAsString

    LOG.error_ACC(message)

    var qry = Query.make<UpgradeExecutorLog>(UpgradeExecutorLog)
    qry.compare(UpgradeExecutorLog#ID, Relop.Equals, _recordID)
    var upgradeLog = qry.select()?.AtMostOneRow

    Transaction.runWithNewBundle(\___bundle -> {
      upgradeLog = ___bundle.add(upgradeLog)
      upgradeLog.Status = DatamodelUpgradeStatus.ERROR.toString()
      upgradeLog.Error = message
    }, TransactionUser)

  }

  override function afterExecute(descriptor : ScriptDescriptor) {

    LOG.debug("${descriptor.Filename} Done")

  }
}