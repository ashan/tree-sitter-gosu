package nz.co.acc.common.upgrade.function

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.upgrade.DatamodelUpgrade
uses nz.co.acc.common.upgrade.DatamodelUpgradeStatus
uses nz.co.acc.common.upgrade.function.struct.ScriptDescriptor
uses nz.co.acc.common.upgrade.function.struct.ScriptExecutorHandler

uses java.util.function.Consumer

/**
 * @author Ron Webb
 * @since 2019-06-18
 */
abstract class AbstractScriptExecutor<TYPE_OBJECT> implements Consumer<ScriptExecutorHandler> {

  private static final var LOG = StructuredLogger.CONFIG.withClass(AbstractScriptExecutor)

  protected var _receiver : TYPE_OBJECT

  public construct(receiver : TYPE_OBJECT) {
    _receiver = receiver
  }

  public abstract function beforeExecute(descriptor : ScriptDescriptor) : boolean
  public abstract function success(descriptor : ScriptDescriptor)
  public abstract function error(descriptor : ScriptDescriptor, exception : Exception)
  public abstract function afterExecute(descriptor : ScriptDescriptor)
  public abstract function setStatus(pStatus : DatamodelUpgradeStatus)

  override function accept(scriptExecutorHandler : ScriptExecutorHandler) {
    var descriptor = scriptExecutorHandler.Descriptor
    try {
      if (beforeExecute(descriptor)) {
        setStatus(DatamodelUpgradeStatus.START)
        scriptExecutorHandler.ExecuteLogic()
        success(descriptor)
      }
      else {
        LOG.info("Skipping: ${descriptor.Filename}")
      }
    }
    catch(exp : Exception) {
      error(descriptor, exp)
    }
    finally {
      afterExecute(descriptor)
    }
  }
}