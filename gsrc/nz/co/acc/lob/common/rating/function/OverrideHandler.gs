package nz.co.acc.lob.common.rating.function


uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.util.function.Consumer
uses java.util.function.Function

/**
 * @author Ron Webb
 * @since 2019-07-01
 */
class OverrideHandler implements Consumer<block()> {

  private static var LOG = StructuredLogger.CONFIG.withClass(OverrideHandler)

  protected var _receiver : Dynamic
  protected var _handlers : List<Function<Dynamic, Boolean>> = {}

  construct(receiverObj : Dynamic) {
    _receiver = receiverObj
  }

  public function addHandler(handler : Function<Dynamic, Boolean>) : OverrideHandler {
    Optional.ofNullable<Function<Dynamic, Boolean>>(handler).ifPresent(\___handler : Function<Dynamic, Boolean> -> {
      _handlers.add(___handler)
    })

    return this
  }

  override function accept(logic : block()) {
    LOG.debug("Handlers Count: ${_handlers.Count}")
    if (_handlers.hasMatch(\___handler : Function<Dynamic, Boolean> -> !___handler.apply(_receiver))) {
      LOG.debug("Skipping override")
    } else {
      LOG.debug("Executing logic")
      logic()
    }
  }
}