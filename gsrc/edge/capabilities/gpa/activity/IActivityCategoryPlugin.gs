package edge.capabilities.gpa.activity

uses edge.capabilities.gpa.activity.dto.ActivityCategoryDTO

interface IActivityCategoryPlugin {

  public function toDTO(anActivityCategory : typekey.ActivityCategory) : ActivityCategoryDTO
}
