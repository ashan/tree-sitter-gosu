package edge.capabilities.policychange

uses edge.jsonrpc.exception.JsonRpcInvalidRequestException

interface IPolicyChangeRetrievalPlugin {
  /**
   * Retrieves the policy period to be used as a base for policy changes.
   */
  @Param("policyNumber","The policy number for the policy to change")
  @Throws(JsonRpcInvalidRequestException,"When the policy number is invalid or a policy change can't be created for the policy")
  function retrieveByPolicyNumber(policyNumber:String) : PolicyPeriod

  /**
   * Retrieves a policy period associated with a job.
   */
  @Param("jobNumber","The job number for the job relating to the policy")
  @Throws(JsonRpcInvalidRequestException,"When the job number is invalid or a policy change can't be created for the policy")
  function retrieveByJobNumber(jobNumber:String) : PolicyPeriod

  /**
   * Retrieves a policy period associated with a job.
   */
  @Param("jobNumber","The job number for the job relating to the policy")
  @Throws(JsonRpcInvalidRequestException,"When the job number is invalid or a policy change can't be created for the policy")
  function retrieveByPolicyNumberAndLevyYear(policyNumber : String, levyYear : int, policyPeriodStatus : PolicyPeriodStatus[]) : PolicyPeriod
}
