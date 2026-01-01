package nz.co.acc.common.integration.apimgmt.json

uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

/**
 * Only used for transporting message data in a single capsule from event rules to the transport message plugin.
 * Not built for the purpose of communicating with external systems.
 */
@JsonIgnoreProperties(false, false, false, {"intrinsicType"})
class JSONInternalEnvelope {

  enum Operation {
    PATCH, DELETE
  }

  public var Endpoint: String
  public var Payload: String
  public var Operation: Operation = Operation.PATCH

}