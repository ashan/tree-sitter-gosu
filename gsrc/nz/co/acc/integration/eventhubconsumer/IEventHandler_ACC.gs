package nz.co.acc.integration.eventhubconsumer

/**
 * Created by Mike Ourednik on 27/08/20.
 */
interface IEventHandler_ACC {

  function handleEvent(eventPayload : String)

}