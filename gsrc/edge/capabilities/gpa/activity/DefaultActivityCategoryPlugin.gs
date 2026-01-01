package edge.capabilities.gpa.activity

uses edge.capabilities.gpa.activity.dto.ActivityCategoryDTO
uses edge.di.annotations.ForAllGwNodes

class DefaultActivityCategoryPlugin implements IActivityCategoryPlugin {

  @ForAllGwNodes
  construct(){}

  override function toDTO(anActivityCategory: ActivityCategory): ActivityCategoryDTO {
    final var dto = new ActivityCategoryDTO()
    dto.Code = anActivityCategory.Code
    dto.Name = anActivityCategory.DisplayName
    dto.Description = anActivityCategory.Description
    dto.Priority = anActivityCategory.Priority
    dto.Retired = anActivityCategory.Retired

    return dto
  }
}
