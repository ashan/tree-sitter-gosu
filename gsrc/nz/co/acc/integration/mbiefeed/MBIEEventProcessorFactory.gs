package nz.co.acc.integration.mbiefeed

uses com.microsoft.azure.eventprocessorhost.IEventProcessorFactory
uses com.microsoft.azure.eventprocessorhost.PartitionContext
uses nz.co.acc.integration.eventhubconsumer.EventProcessor_ACC
uses nz.co.acc.plm.integration.validation.nzbnvalidation.MBIEAPIClient

/**
 * Created by Mike Ourednik on 27/08/20.
 */
class MBIEEventProcessorFactory implements IEventProcessorFactory {

  private var _checkpointInterval = 10

  construct(checkpointInterval : int) {
    _checkpointInterval = checkpointInterval
  }

  function createEventProcessor(context : PartitionContext) : EventProcessor_ACC {
    return new EventProcessor_ACC(_checkpointInterval, new MBIEEventHandler(MBIEAPIClient.getInstance()))
  }
}