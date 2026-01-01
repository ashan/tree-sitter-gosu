package edge.capabilities.enrolment.dto

uses java.util.HashMap
uses edge.jsonmapper.JsonProperty

class EnrolmentRequestDTO {
  @JsonProperty
  private var _details:HashMap<String, String> as Details
}
