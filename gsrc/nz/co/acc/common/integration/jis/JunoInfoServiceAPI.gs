package nz.co.acc.common.integration.jis

uses com.azure.messaging.eventhubs.EventData
uses com.azure.messaging.eventhubs.EventHubClientBuilder
uses com.azure.messaging.eventhubs.EventHubProducerClient
uses com.azure.messaging.eventhubs.models.SendOptions
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.util.AtomicCounter
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

/**
 * Lower level API for sending updates to Juno Information Service.
 * <p>
 * Used in PC and BC
 * <p>
 * <p>
 * Created by Mike Ourednik on 19/05/20.
 */
class JunoInfoServiceAPI {

  var _producer : EventHubProducerClient
  private static var _log = StructuredLogger.INTEGRATION.withClass(JunoInfoServiceAPI)
  var _counter = new AtomicCounter()

  public static final var INSTANCE : JunoInfoServiceAPI = new JunoInfoServiceAPI()

  public construct() {
    initialize()
  }

  private function initialize() {
    if (ConfigurationProperty.JIS_ENABLED.PropertyValue.toBoolean()) {
      try {
        var connectionString : String
        connectionString = ConfigurationProperty.JIS_EVENTHUB_CONNECTIONSTRING.PropertyValue
        createConnection(connectionString)
      } catch (e : Exception) {
        _log.error_ACC("Failed to initialize", e)
        throw e
      }
    } else {
      _log.info("Juno Information Service is disabled in configuration.properties")
    }
  }

  private function createConnection(connectionString : String) {
    _producer = new EventHubClientBuilder()
        .connectionString(connectionString)
        .buildProducerClient()
    _log.info("Initialized EventHubProducerClient for EventHub '${_producer.getEventHubName()}'")
  }

  property get EventHubDetails() : String {
    return _producer.EventHubName
  }

  function upsert(
      payload : String,
      id : String,
      partitionKey : String,
      container : String,
      notificationsEnabled : Boolean) {
    _log.info("upsert: ${container}:${partitionKey}:${id}:${payload.length}:${notificationsEnabled ? 1 : 0}")
    var props = createProps(container, id, CosmosDBConstants.Actions.upsert, notificationsEnabled)
    send(payload, partitionKey, props)
  }

  function delete(id : String, partitionKey : String, container : String) {
    _log.info("delete: ${container}:${partitionKey}:${id}")
    var props = createProps(container, id, CosmosDBConstants.Actions.delete, true)
    send("{}", partitionKey, props)
  }

  private function createProps(
      container : String,
      documentId : String,
      action : CosmosDBConstants.Actions,
      notificationsEnabled : Boolean) : Map<String, String> {
    var props = new HashMap<String, String>(4)
    props.put("container", container)
    props.put("documentId", documentId)
    props.put("action", action.toString())
    props.put("notificationsEnabled", notificationsEnabled.toString())
    props.put("source", "pc")
    return props
  }

  private function send(
      payload : String,
      partitionKey : String,
      props : Map<String, String>) {

    if (payload == null) {
      throw new IllegalArgumentException("null payload")
    }
    if (partitionKey == null) {
      throw new IllegalArgumentException("null partitionKey")
    }
    if (!ConfigurationProperty.JIS_ENABLED.PropertyValue.toBoolean()) {
      throw new IllegalArgumentException("Juno Information Service is disabled in configuration.properties")
    }

    var eventData = new EventData(payload)
    eventData.Properties.putAll(props)

    var sendOptions = new SendOptions().setPartitionKey(partitionKey)

    _producer.send({eventData}, sendOptions)

    _counter.increment()
    var count = _counter.getValue()
    if (count % 1000 == 0) {
      _log.info("Sent count: ${count}")
    }
  }

}