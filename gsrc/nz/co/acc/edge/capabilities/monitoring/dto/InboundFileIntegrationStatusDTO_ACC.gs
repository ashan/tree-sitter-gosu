package nz.co.acc.edge.capabilities.monitoring.dto

uses edge.jsonmapper.JsonProperty

class InboundFileIntegrationStatusDTO_ACC {
  
  @JsonProperty
  public var errorFileCount: int
  
  @JsonProperty
  public var incomingFileCount: int
  
  @JsonProperty
  public var processingFileCount: int
  
  @JsonProperty
  public var doneFileCount: int
}