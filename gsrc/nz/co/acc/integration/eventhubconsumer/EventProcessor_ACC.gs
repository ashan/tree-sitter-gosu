package nz.co.acc.integration.eventhubconsumer

uses com.microsoft.azure.eventhubs.EventData
uses com.microsoft.azure.eventprocessorhost.CloseReason
uses com.microsoft.azure.eventprocessorhost.IEventProcessor
uses com.microsoft.azure.eventprocessorhost.PartitionContext
uses gw.surepath.suite.integration.logging.StructuredLogger


/**
 * Generic Event Processor
 */
public class EventProcessor_ACC implements IEventProcessor {

  private static var _log = StructuredLogger.INTEGRATION.withClass(EventProcessor_ACC)

  private var _checkpointBatchingCount = 0
  private var _checkpointInterval = 10
  private var _eventHandler : IEventHandler_ACC

  construct(checkpointInterval : Integer, eventHandler : IEventHandler_ACC) {
    _checkpointInterval = checkpointInterval
    _eventHandler = eventHandler
  }

  // OnOpen is called when a new event processor instance is created by the host. 
  override function onOpen(context : PartitionContext) {
    _log.info("onOpen: Partition ${context.PartitionId} is opening")
  }

  // OnClose is called when an event processor instance is being shut down.
  override function onClose(context : PartitionContext, reason : CloseReason) {
    _log.info("onClose: Partition ${context.PartitionId} is closing for reason ${reason}")
  }

  // onError is called when an error occurs in EventProcessorHost code that is tied to this partition, such as a receiver failure.
  override function onError(context : PartitionContext, error : Throwable) {
    _log.error_ACC("onError: Partition ${context.PartitionId} error: ${error.Message}")
  }

  // onEvents is called when events are received on this partition of the Event Hub.
  override function onEvents(context : PartitionContext, events : Iterable<EventData>) {
    _log.info("onEvents: Partition ${context.PartitionId} received ${events.Count} events")

    for (data in events) {
      try {

        var payload = new String(data.Bytes, "UTF8")

        if (_log.DebugEnabled) {
          _log.debug("onEvents (${context.PartitionId}, ${data.SystemProperties.Offset}, ${data.SystemProperties.SequenceNumber}): ${payload}")
        }

        _eventHandler.handleEvent(payload)

        // Checkpointing persists the current position in the event stream for this partition and means that the next
        // time any host opens an event processor on this event hub+consumer group+partition combination, it will start
        // receiving at the event after this one.

        this._checkpointBatchingCount++
        if ((_checkpointBatchingCount % _checkpointInterval) == 0) {
          _log.info("onEvents: Partition ${context.PartitionId} checkpointing at (${data.SystemProperties.Offset}, ${data.SystemProperties.SequenceNumber})")
          // Checkpoints are created asynchronously. It is important to wait for the result of checkpointing
          // before exiting onEvents or before creating the next checkpoint, to detect errors and to ensure proper ordering.
          context.checkpoint(data).get()
        }

        Thread.sleep(ScriptParameters.NZBNEventHubThrottleIntervalMs)

      } catch (e : Exception) {
        _log.error_ACC("Processing failed for an event", e)
      }
    }

  }
}