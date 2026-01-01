package nz.co.acc.sampledata

uses gw.api.builder.ActivityPatternBuilder
uses gw.api.databuilder.ActivityPatternBuilderBase

/**
 * Builder class to create a ActivityPattern instance.
 * Default builder doesn't allow the specification of all the properties used in ths class.
 */
class ActivityPatternBuilder_ACC extends ActivityPatternBuilder {

  function withDescription(description: String): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.DESCRIPTION_PROP.get(), description)
    return this
  }

  function withActivityClass(activityClass: ActivityClass): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.ACTIVITYCLASS_PROP.get(), activityClass)
    return this
  }

  function withCategory(activityCategory: ActivityCategory): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.CATEGORY_PROP.get(), activityCategory)
    return this
  }

  function withRecurring(recurring: Boolean): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.RECURRING_PROP.get(), recurring)
    return this
  }

  function withTargetDays(targetDays: Integer): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.TARGETDAYS_PROP.get(), targetDays)
    return this
  }

  function withTargetHours(targetHours: Integer): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.TARGETHOURS_PROP.get(), targetHours)
    return this
  }

  function withTargetIncludeDays(targetIncludeDays: IncludeDaysType): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.TARGETINCLUDEDAYS_PROP.get(), targetIncludeDays)
    return this
  }

  function withTargetStartPoint(targetStartPoint: StartPointType): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.TARGETSTARTPOINT_PROP.get(), targetStartPoint)
    return this
  }

  function withEscalationDays(escalationDays: Integer): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.ESCALATIONDAYS_PROP.get(), escalationDays)
    return this
  }

  function withEscalationHours(escalationHours: Integer): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.ESCALATIONHOURS_PROP.get(), escalationHours)
    return this
  }

  function withEscalationInclDays(escalationInclDays: IncludeDaysType): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.ESCALATIONINCLDAYS_PROP.get(), escalationInclDays)
    return this
  }

  function withEscalationStartPt(escalationStartPt: StartPointType): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.ESCALATIONSTARTPT_PROP.get(), escalationStartPt)
    return this
  }

  function withAutomatedOnly(automatedOnly: Boolean): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.AUTOMATEDONLY_PROP.get(), automatedOnly)
    return this
  }

  function withCommand(command: String): ActivityPatternBuilder_ACC {
    this.set(ActivityPattern.COMMAND_PROP.get(), command)
    return this
  }

  function withPriority(priority: Priority): ActivityPatternBuilder_ACC{
    this.set(ActivityPattern.PRIORITY_PROP.get(),priority)
    return this
  }

}