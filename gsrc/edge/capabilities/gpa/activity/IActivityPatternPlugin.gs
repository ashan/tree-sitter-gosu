package edge.capabilities.gpa.activity

uses edge.capabilities.gpa.activity.dto.ActivityPatternDTO

interface IActivityPatternPlugin {

  public function toDTO(anActivityPattern : ActivityPattern) : ActivityPatternDTO
  public function toDTOArray(activityPatterns : ActivityPattern[]) : ActivityPatternDTO[]
  public function getActivityPatternsForEntity(entityName : String) : ActivityPattern[]
  public function getActivityPatternByCode(code : String) : ActivityPattern
}
