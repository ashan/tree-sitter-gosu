package nz.co.acc.sampledata

uses gw.api.database.Query
uses gw.api.database.Relop


/**
 * It loads the Juno Sample Activity Patterns
 */
class ActivityPatternData_ACC extends AbstractSampleDataCollection_ACC {

  override property get CollectionName() : String {
    return "ACC Activity Pattern Data"
  }

  override property get AlreadyLoaded() : boolean {
    return activityPatternLoaded("outbound_failure")
  }

  private static function activityPatternLoaded(code : String) : boolean {
    var activityPatternCodeQuery = Query.make(ActivityPattern).compare(ActivityPattern#Code, Relop.Equals, code)
    return activityPatternCodeQuery.select().HasElements
  }

  private static function loadActivityPattern(code : String, publicId : String, subject : String, description : String, activityClass : ActivityClass, type : ActivityType, category : ActivityCategory, mandatory : boolean, priority : Priority, recurring : boolean, targetDays : Integer, targetHours : Integer, targetIncludeDays : IncludeDaysType, targetStartPoint : StartPointType, escalationDays : Integer, escalationHours : Integer, escalationInclDays : IncludeDaysType, escalationStartPt : StartPointType, automatedOnly : boolean, command : String, activityPatternLevel : ActivityPatternLevel) : ActivityPattern {
    var result : ActivityPattern

    runTransactionAsUser(null, "ActivityPattern " + code, \b -> {
      var builder = new ActivityPatternBuilder_ACC()
          .withDescription(description)
          .withActivityClass(activityClass)
          .withCategory(category)
          .withRecurring(recurring)
          .withTargetDays(targetDays)
          .withTargetHours(targetHours)
          .withTargetIncludeDays(targetIncludeDays)
          .withTargetStartPoint(targetStartPoint)
          .withEscalationDays(escalationDays)
          .withEscalationHours(escalationHours)
          .withEscalationInclDays(escalationInclDays)
          .withEscalationStartPt(escalationStartPt)
          .withAutomatedOnly(automatedOnly)
          .withCommand(command)
          .withPriority(priority)
          .withCode(code)
          .withPublicId(publicId)
          .withSubject(subject)
          .withType(type)
          .withMandatory(mandatory)
          .withActivityPatternLevel(activityPatternLevel)

      result = builder.create()
    })

    return result
  }

  private static function loadActivityPattern(
      code : String,
      publicId : String,
      subject : String,
      description : String,
      mandatory : boolean,
      priority : Priority,
      recurring : boolean,
      targetDays : Integer,
      targetIncludeDays : IncludeDaysType,
      escalationDays : Integer,
      escalationInclDays : IncludeDaysType,
      automatedOnly : boolean) : ActivityPattern {

    var result : ActivityPattern

    runTransactionAsUser(null, "ActivityPattern " + code, \b -> {
      var builder = new ActivityPatternBuilder_ACC()
          .withDescription(description)
          .withActivityClass(ActivityClass.TC_TASK)
          .withCategory(ActivityCategory.TC_REMINDER)
          .withRecurring(recurring)
          .withTargetDays(targetDays)
          .withTargetIncludeDays(targetIncludeDays)
          .withTargetStartPoint(StartPointType.TC_ACTIVITYCREATION)
          .withEscalationDays(escalationDays)
          .withEscalationInclDays(escalationInclDays)
          .withEscalationStartPt(StartPointType.TC_ACTIVITYCREATION)
          .withAutomatedOnly(automatedOnly)
          .withPriority(priority)
          .withCode(code)
          .withPublicId(publicId)
          .withSubject(subject)
          .withType(ActivityType.TC_GENERAL)
          .withMandatory(mandatory)
          .withActivityPatternLevel(ActivityPatternLevel.TC_ALL)

      result = builder.create(b)
    })

    return result
  }

  override function load() {
    // Activity pattern for failure batch case in the Outbound Framework
    loadActivityPattern("outbound_failure", "outbound:1001", "Outbound failures", "Outbound failure happened", true, Priority.TC_URGENT, false, 2, IncludeDaysType.TC_BUSINESSDAYS, 2, IncludeDaysType.TC_BUSINESSDAYS, false)
    loadActivityPattern("inbound_failure", "inbound:1001", "Inbound failures", "Inbound failure happened", true, Priority.TC_URGENT, false, 2, IncludeDaysType.TC_BUSINESSDAYS, 2, IncludeDaysType.TC_BUSINESSDAYS, false)
    //NTK-262 - NowchoO Fix broken test cases
    //fix nz.co.acc.plm.integration.ir.exec.handler.CustomerUpdatePolicyActionsTest.testBicCodeExistingPolicyMultiCU()
    loadActivityPattern("multi_cu_policy_period", "sample_pattern:73", "Multi CU Policy Period", "Multi CU Policy Period: contact the customer to determine how the CU update should be applied (only for WPC and WPS policy lines) and confirming CU-earning attribution %.", true, Priority.TC_URGENT, false, 2, IncludeDaysType.TC_BUSINESSDAYS, 2, IncludeDaysType.TC_BUSINESSDAYS, false)
    //nz.co.acc.plm.integration.ir.exec.handler.ShareholderEmployerEarningsUpdateTest.testShareholderCUDifferent
    loadActivityPattern("shareholder_CU_not_primary_CU", "sample_pattern:75", "CARA Shareholder update", "Not able to update the shareholder list if an existing shareholder has a non-primary CU and is also present in the update list. Manually process the CARA record and then skip the CARA update record.", true, Priority.TC_URGENT, false, 2, IncludeDaysType.TC_BUSINESSDAYS, 2, IncludeDaysType.TC_BUSINESSDAYS, false)

    // For Portal AccountContactPlugin_ACCTest
    loadActivityPattern(
        "MyACC_for_Business_Request", "pc:500002", "MyACC for Business Request",
        "Make changes to MyACC for Business account (ie, add account administrator).",
        true, Priority.TC_NORMAL, false, 10, IncludeDaysType.TC_BUSINESSDAYS, 15, IncludeDaysType.TC_BUSINESSDAYS, false)
  }
}