package edge.capabilities.gpa.activity

uses edge.capabilities.gpa.activity.dto.ActivityDTO
uses edge.capabilities.gpa.activity.dto.AssignableQueueDTO

interface IActivityPlugin {

  public function toDTO(anActivity : Activity) : ActivityDTO
  public function toDTOArray(activities : Activity[]) : ActivityDTO[]
  public function updateActivity(anActivity : Activity, dto : ActivityDTO)
  public function assignableQueueToDTO(anAssignableQueue : AssignableQueue) : AssignableQueueDTO
  public function markActivityAsCompleted(anActivity : Activity)
  public function createActivityForAccount(anAccount : Account, dto : ActivityDTO) : Activity
  public function createActivityForPolicy(aPolicy : Policy, dto : ActivityDTO) : Activity
  public function createActivityForJob(aJob : Job, dto : ActivityDTO) : Activity
  public function getAssignableUserForActivity(entity : Object, anActPattern : ActivityPattern) : ActivityDTO
}
