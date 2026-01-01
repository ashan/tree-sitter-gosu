package edge.capabilities.gpa.user.dto

uses edge.jsonmapper.JsonProperty
uses gw.xml.ws.annotation.WsiExportable

@Export
@WsiExportable("http://guidewire.com/pc/ws/gw/webservice/pc/pc700/community/datamodel/ProducerCodeDTO")
final class ProducerCodeDTO {

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty
  var _code: String as Code

  @JsonProperty
  var _description: String as Description

  @JsonProperty
  var _displayValue : String as DisplayValue
  
}
