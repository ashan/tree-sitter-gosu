package nz.co.acc.migration.util

enhancement ScriptParametersEnhancement_ACC: ScriptParameters {

  public static property get EnableIntegrationBillingSystem_ACC(): Boolean {
    return ScriptParameters.getParameterValue("EnableIntegrationBillingSystem_ACC") as Boolean;
  }

  public static property get EnableMessageQueueAsyncDocumentStorage_ACC(): Boolean {
    return ScriptParameters.getParameterValue("EnableMessageQueueAsyncDocumentStorage_ACC") as Boolean;
  }

  public static property get EnableMessageQueueBillingSystem_ACC(): Boolean {
    return ScriptParameters.getParameterValue("EnableMessageQueueBillingSystem_ACC") as Boolean;
  }

  public static property get EnableMessageQueueBillingSystemForCancellationOnly_ACC(): Boolean {
    return ScriptParameters.getParameterValue("EnableMessageQueueBillingSystemForCancellationOnly_ACC") as Boolean;
  }

  public static property get EnableMessageQueueConsole_ACC(): Boolean {
    return ScriptParameters.getParameterValue("EnableMessageQueueConsole_ACC") as Boolean;
  }

  public static property get EnableMessageQueueEmail_ACC(): Boolean {
    return ScriptParameters.getParameterValue("EnableMessageQueueEmail_ACC") as Boolean;
  }

  public static property get EnableMessageQueueIndexingSystem_ACC(): Boolean {
    return ScriptParameters.getParameterValue("EnableMessageQueueIndexingSystem_ACC") as Boolean;
  }

  public static property get EnableMessageQueueResyncAccount_ACC(): Boolean {
    return ScriptParameters.getParameterValue("EnableMessageQueueResyncAccount_ACC") as Boolean;
  }

  public static property get EnableMessageQueueContactManager_ACC(): Boolean {
    return ScriptParameters.getParameterValue("EnableMessageQueueContactManager_ACC") as Boolean;
  }

}
