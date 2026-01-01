package edge.capabilities.gpa.job

uses edge.capabilities.helpers.JobUtil
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.gpa.job.dto.JobDTO
uses edge.capabilities.gpa.job.dto.JobTypeDTO
uses edge.PlatformSupport.Bundle

abstract class JobHandler {

  var _jobPlugin : IJobPlugin
  var _jobHelper : JobUtil

  construct(aJobPlugin : IJobPlugin, aJobHelper : JobUtil) {
    _jobPlugin = aJobPlugin
    _jobHelper = aJobHelper
  }


  /**
   * Withdraw a job by its job number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To retrieve job by job number</dd>
   * <dd> <code>JobProcess#withdrawJob()</code> - To withdraw all active policy periods in the job</dd>
   * </dl>
   * @param   jobNumber   Job Number string
   * @returns Boolean, true if job was found and withdrawn, false otherwise
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function withdrawJobByJobNumber(jobNumber : String) : boolean{
    var bundle = Bundle.getCurrent()
    var aJob = bundle.add(_jobHelper.findJobByJobNumber(jobNumber))

    if(aJob != null){
      aJob.LatestPeriod.JobProcess.withdrawJob()
      return true
    }

    return false
  }

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  abstract function findJobByJobNumber(jobNumber : String) : JobDTO


  /**
   * Get open jobs given the job type for the current user
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IJobPlugin#getOpenJobsByJobTypeForCurrentUser()</code> - To retrieve jobs for a type for current user</dd>
   * </dl>
   * @param   jobType   JobTypeDto
   * @returns a list of JobDTOs
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getOpenJobsByJobTypeForCurrentUser(jobType : JobTypeDTO) : JobDTO[]{
    return _jobPlugin.getOpenJobsByJobTypeForCurrentUser(jobType.Type)
  }

}
