package edge.capabilities.gpa.search.dto

uses edge.jsonmapper.JsonProperty

class SearchRequestDTO {

  @JsonProperty
  var _searchParam : String as SearchParam
}
