package edge.capabilities.gpa.activity.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Size
uses edge.capabilities.gpa.contact.dto.ContactBaseDTO
uses java.util.Date
uses edge.capabilities.user.dto.UserDTO
uses edge.aspects.validation.annotations.Required
uses java.lang.Integer
uses edge.capabilities.gpa.note.dto.NoteDTO

class ActivityDTO {

  @JsonProperty
  var _publicID : String as PublicID

  @JsonProperty  @Size(0, 1333)
  var _description : String as Description

  @JsonProperty
  var _status : typekey.ActivityStatus as Status

  @JsonProperty
  var _insured : ContactBaseDTO as Insured

  @JsonProperty  @Required
  var _priority : typekey.Priority as Priority

  @JsonProperty
  var _recurring : Boolean as Recurring

  @JsonProperty
  var _mandatory : Boolean as Mandatory

  @JsonProperty
  var _assignedBy: UserDTO as AssignedBy

  @JsonProperty
  var _dueDate : Date as DueDate

  @JsonProperty
  var _completedDate : Date as CompletedDate

  @JsonProperty
  var _escalationDate : Date as EscalationDate

  @JsonProperty  @Size(1, 255) @Required
  var _subject : String as Subject

  @JsonProperty
  var _activityPatter : ActivityPatternDTO as ActivityPattern

  @JsonProperty  @Size(0, 255)
  var _policyNumber : String as PolicyNumber

  @JsonProperty  @Size(0, 255)
  var _accountHolderName : String as AccountHolderName

  @JsonProperty  @Size(0, 255)
  var _accountNumber : String as AccountNumber

  @JsonProperty  @Size(0, 255)
  var _jobNumber : String as JobNumber

  @JsonProperty
  var _jobType : typekey.Job as JobType

  @JsonProperty
  var _priorityValue : Integer as PriorityValue

  @JsonProperty
  var _createdDate : Date as CreatedDate

  @JsonProperty
  var _closeDate : Date as CloseDate

  @JsonProperty  @Size(0, 255)
  var _productCode : String as ProductCode

  @JsonProperty  @Size(0, 255)
  var _productName : String as ProductName

  @JsonProperty
  var _assignedTo: Object as AssignedTo

  @JsonProperty
  var _isAssignedToCurrentUser: Boolean as IsAssignedToCurrentUser

  @JsonProperty
  var _assignableUsers : String[] as AssignableUsers

  @JsonProperty
  var _selectedAssignee : String as SelectedAssignee

  @JsonProperty
  var _canReassign : Boolean as CanReassign

  @JsonProperty
  var _canComplete : Boolean as CanComplete

  @JsonProperty
  var _canUserView : Boolean as CanUserView

  @JsonProperty
  var _canUserViewAccount : Boolean as CanUserViewAccount

  @JsonProperty
  var _canUserViewPolicy : Boolean as CanUserViewPolicy

  @JsonProperty
  var _isCreatedByCurrentUser : Boolean as IsCreatedByCurrentUser

  @JsonProperty
  var _numberOfOpenNotes : Integer as NumberOfOpenNotes

  @JsonProperty
  var _createdBy : String as CreatedBy

  @JsonProperty
  var _notes : NoteDTO[] as Notes

  @JsonProperty
  var _changeReason : ChangeReason_ACC as ChangeReason

  var _job : Job as Job

  @JsonProperty
  var _selectedAssigneeUser: String as SelectedAssigneeUser

  @JsonProperty
  var _selectedAssigneeGroup: String as SelectedAssigneeGroup

  @JsonProperty
  var _selectedAssigneeQueue: String as SelectedAssigneeQueue
}
