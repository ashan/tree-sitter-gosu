package nz.co.acc.common.upgrade.function.struct

/**
 * @author Ron Webb
 * @since 2019-06-18
 */
structure ScriptExecutorHandler {
  property get Descriptor() : ScriptDescriptor
  property get ExecuteLogic() : block()
}