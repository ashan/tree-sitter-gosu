package edge.capabilities.gpa.note.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.aspects.validation.annotations.Size
uses edge.aspects.validation.annotations.Required

class NoteDTO {

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty @Size(0, 255) @Required
  var _subject: String as Subject

  @JsonProperty @Size(0, 65000) @Required
  var _body: String as Body

  @JsonProperty
  var _createdDate: Date as CreatedDate

  @JsonProperty
  var _authorName: String as AuthorName

  @JsonProperty @Required
  var _topic : typekey.NoteTopicType as Topic
}
