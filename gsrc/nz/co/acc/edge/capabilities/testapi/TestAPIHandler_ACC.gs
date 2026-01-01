package nz.co.acc.edge.capabilities.testapi

uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.IRpcHandler
uses edge.jsonrpc.annotation.JsonRpcMethod
uses gw.api.util.DateUtil
uses gw.plugin.Plugins
uses gw.plugin.system.ITestingClock
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.environment.EnvHelper

/**
 * Helper for testing / automation.
 * <p>
 * Created by Mike Ourednik on 3/12/2019.
 */
class TestAPIHandler_ACC implements IRpcHandler {

  private static var _logger = StructuredLogger.INTEGRATION.withClass(TestAPIHandler_ACC)

  @InjectableNode
  construct() {
  }

  @JsonRpcMethod
  function moveClockForward(days : Integer, hours : Integer, minutes : Integer) : Date {

    if (not EnvHelper.isNotProductionEnvironment()) {
      throw new RuntimeException("Not executable in production environment.")
    }

    if (days == null or hours == null or minutes == null) {
      throw new IllegalArgumentException("Input arguments must not be null")
    }
    if (days < 0 or hours < 0 or minutes < 0) {
      throw new IllegalArgumentException("Input arguments must be non-negative")
    }

    var newDate = DateUtil.currentDate().addDays(days).addHours(hours).addMinutes(minutes)
    Plugins.get(ITestingClock).setCurrentTime(newDate.getTime())
    _logger.info("Moved clock forward to ${newDate.toISOTimestamp()}")
    return DateUtil.currentDate()
  }

}