package edge.capabilities.gpa.activity

uses edge.capabilities.gpa.activity.dto.ActivityPatternDTO
uses edge.di.annotations.ForAllGwNodes
uses java.util.Date

class DefaultActivityPatternPlugin implements IActivityPatternPlugin {

  private var _activityCategoryPlugin : IActivityCategoryPlugin

  @ForAllGwNodes
  construct(anActivityCategoryPlugin : IActivityCategoryPlugin){
    this._activityCategoryPlugin = anActivityCategoryPlugin
  }

  override function toDTO(anActivityPattern: ActivityPattern): ActivityPatternDTO {
    final var dto = new ActivityPatternDTO()
    fillBaseProperties(dto, anActivityPattern)
    dto.DueDate = getDueDate(anActivityPattern)
    dto.EscalationDate = getEscalationDate(anActivityPattern)
    if(anActivityPattern.Category != null){
      dto.Category = _activityCategoryPlugin.toDTO(anActivityPattern.Category)
    }

    return dto
  }

  override function toDTOArray(activityPatterns: ActivityPattern[]): ActivityPatternDTO[] {
    if(activityPatterns != null && activityPatterns.HasElements){
      return activityPatterns.map( \ actPattern -> toDTO(actPattern))
    }

    return new ActivityPatternDTO[]{}
  }

  override function getActivityPatternsForEntity(entityName: String): ActivityPattern[] {
    if (perm.System.actcreate){
      switch (entityName) {
        case "account": {
          return Activity.finder.findAccountActivityPatterns().toTypedArray()
        }
        case "policy": {
          return Activity.finder.findPolicyActivityPatterns().toTypedArray()
        }
        case "job": {
          return Activity.finder.findJobActivityPatterns().toTypedArray()
        }
        default: {
          break
        }
      }
    }

    return new ActivityPattern[]{}
  }

  override function getActivityPatternByCode(code: String): ActivityPattern {
    return ActivityPattern.finder.getActivityPatternByCode(code)
  }

  public static function fillBaseProperties(dto : ActivityPatternDTO, anActivityPattern : ActivityPattern){
    dto.PublicID = anActivityPattern.PublicID
    dto.Code = anActivityPattern.Code
    dto.Priority = anActivityPattern.Priority
    dto.Subject = anActivityPattern.Subject
    dto.Description = anActivityPattern.Description
    dto.Recurring = anActivityPattern.Recurring
    dto.Mandatory = anActivityPattern.Mandatory
  }

  public static function getDueDate(anActivityPattern : ActivityPattern) : Date{
    var currentDate = gw.api.util.DateUtil.currentDate()
    var dueDate : Date

    if(anActivityPattern.TargetIncludeDays == typekey.IncludeDaysType.TC_BUSINESSDAYS){
      dueDate = currentDate.addBusinessDays(anActivityPattern.TargetDays).addHours(anActivityPattern.TargetHours)
    }else{
      dueDate = currentDate.addDays(anActivityPattern.TargetDays).addHours(anActivityPattern.TargetHours)
    }

    return dueDate
  }

  public static function getEscalationDate(anActivityPattern: ActivityPattern): Date {
    var currentDate = gw.api.util.DateUtil.currentDate()
    var escalationDate: Date

    if (anActivityPattern.EscalationInclDays == typekey.IncludeDaysType.TC_BUSINESSDAYS) {
      escalationDate = currentDate.addBusinessDays(anActivityPattern.EscalationDays).addHours(anActivityPattern.EscalationHours)
    } else {
      escalationDate = currentDate.addDays(anActivityPattern.TargetDays).addHours(anActivityPattern.TargetHours)
    }

    return escalationDate
  }

}
