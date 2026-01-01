package nz.co.acc.plm.integration.ir.util

uses java.math.BigDecimal

/**
 * Created by tappetv on 17/03/2017.
 * returns ScriptParameter value
 */
enhancement ScriptParametersEnhancement_ACC: ScriptParameters {

  /**
   * Function get the Script Parameter
   *
   * @return parameter value
   */
  public static property get IROverridePayloadControl_ACC() : String {
    return ScriptParameters.getParameterValue("IROverridePayloadControl_ACC") as String;
  }

  public static property get DEVOnly_IRAutoBatchSize_ACC() : int {
    return (ScriptParameters.getParameterValue("DEVOnly_IRAutoBatchSize_ACC") as BigDecimal).intValue();
  }

  public static property get DEVOnly_IRAutoBatchNumber_ACC() : int {
    return (ScriptParameters.getParameterValue("DEVOnly_IRAutoBatchNumber_ACC") as BigDecimal).intValue();
  }

  public static property get IR_Commit_Block_Size_ACC() : int {
    return (ScriptParameters.getParameterValue("IR_Commit_Block_Size_ACC") as BigDecimal).intValue();
  }

  public static property get IR_Max_Schedule_Entries_ACC() : int {
    return (ScriptParameters.getParameterValue("IR_Max_Schedule_Entries_ACC") as BigDecimal).intValue();
  }

  public static property get IRPeriodStartOffset_ACC(): int {
    return (ScriptParameters.getParameterValue("IRPeriodStartOffset_ACC") as BigDecimal).intValue();
  }

  public static property get IRCustomerUpdateMaxAge_ACC(): Integer {
    return ScriptParameters.getParameterValue("IRCustomerUpdateMaxAge_ACC") as Integer
  }

  public static property get IRAddressLookupEnabled_ACC(): boolean {
    return ScriptParameters.getParameterValue("IRAddressLookupEnabled_ACC") as boolean
  }

  public static property get IRNZBNValidationEnabled_ACC(): boolean {
    return ScriptParameters.getParameterValue("IRNZBNValidationEnabled_ACC") as boolean
  }

  public static property get LegacyClientIDStart_ACC(): int {
    return (ScriptParameters.getParameterValue("LegacyClientIDStart_ACC") as BigDecimal).intValue();
  }

  public static property get LegacyClientIDMax_ACC(): int {
    return (ScriptParameters.getParameterValue("LegacyClientIDMax_ACC") as BigDecimal).intValue();
  }

  public static property get BulkModifierUploadAuditEnabled_ACC(): Boolean {
    return ScriptParameters.getParameterValue("BulkModifierUploadAuditEnabled_ACC") as boolean;
  }

  public static property get BICCodeRuralDefault_ACC(): String {
    return ScriptParameters.getParameterValue("BICCodeRuralDefault_ACC") as String;
  }

  public static property get BICCodeNonRuralDefault_ACC(): String {
    return ScriptParameters.getParameterValue("BICCodeNonRuralDefault_ACC") as String;
  }

  public static property get InstructionRestrictedFunctionsEnabled_ACC(): Boolean {
    return ScriptParameters.getParameterValue("InstructionRestrictedFunctionsEnabled_ACC") as boolean;
  }

  public static property get StatsCalculateAll_ACC(): Boolean {
    return ScriptParameters.getParameterValue("StatsCalculateAll_ACC") as boolean;
  }

  public static property get CheckInstructionSchedule_ACC(): Boolean {
    return ScriptParameters.getParameterValue("CheckInstructionSchedule_ACC") as boolean;
  }

  public static property get MaxNumberOfFilesTobeProcessed_ACC(): Integer {
    return ScriptParameters.getParameterValue("MaxNumberOfFilesTobeProcessed_ACC") as Integer;
  }

  public static property get MaxNumberOfInstructionsTobeProcessed_ACC(): Integer {
    return ScriptParameters.getParameterValue("MaxNumberOfInstructionsTobeProcessed_ACC") as Integer;
  }

  public static property get CPXWorkingSaferStartLevyYear_ACC(): int {
    return ScriptParameters.getParameterValue("CPXWorkingSaferStartLevyYear_ACC") as int;
  }

  public static property get WorkingSaferStartLevyYear_ACC(): int {
    return ScriptParameters.getParameterValue("WorkingSaferStartLevyYear_ACC") as int;
  }

  public static property get IRWPCMaxYearsBack_ACC(): int {
    return ScriptParameters.getParameterValue("IRWPCMaxYearsBack_ACC") as int;
  }
  
  public static property get IR_Max_Schedule_Days_Offset_ACC(): int {
    return ScriptParameters.getParameterValue("IR_Max_Schedule_Days_Offset_ACC") as int;
  }
  
}
