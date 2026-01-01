package edge.capabilities.helpers

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses java.lang.IllegalArgumentException
uses java.lang.Iterable
uses edge.exception.EntityPermissionException
uses edge.exception.EntityNotFoundException
uses edge.di.annotations.ForAllGwNodes
uses java.lang.Integer
uses gw.api.filters.StandardQueryFilter

class JobUtil {

  final private static var LOGGER = new Logger(Reflection.getRelativeName(JobUtil))
  final private static var defaultCreatedInLastXDays : Integer = 30

  @ForAllGwNodes
  construct() {}

  function findJobByJobNumber(jobNumber : String) : Job {
    if (jobNumber == null || jobNumber.Empty){
      throw new IllegalArgumentException("Job number is null or empty")
    }

    var aJob = Job.finder.findJobByJobNumber(jobNumber)

    if (aJob == null){
      throw new EntityNotFoundException(){
          : Message = "No Job found",
          : Data = aJob
      }
    }else if(!perm.Job.view(aJob)){
      throw new EntityPermissionException(){
          : Message = "User does not have permission to view the requested job.",
          : Data = aJob
      }
    }

    return aJob
  }

  public function findJobsByPolicy(aPolicy : Policy) : Job[] {
    if(aPolicy == null){
      throw new IllegalArgumentException("Policy must not be null.")
    }
    var jobs = aPolicy.Jobs

    return filterJobsByViewPermission(jobs.toList())
  }

  public function findJobsByJobTypeAndCreateUser(jobType : typekey.Job, createUser : User) : Job[] {
    if(createUser == null){
      throw new IllegalArgumentException("Create user is null")
    }

    var jobs = Job.finder.findJobsOfTypeByUser(jobType, createUser)

    return filterJobsByViewPermission(jobs)
  }

  function findJobsByJobTypeAndCreateUserOpenedWithinNumberOfDays(jobType : typekey.Job, createUser : User, numberOfDays : int) : Job[] {
    if(createUser == null){
      throw new IllegalArgumentException("Create user is null")
    }

    var dateQuery = getCreateTimeQueryFilter(numberOfDays)
    var jobs = Job.finder.findJobsOfTypeByUser(jobType, createUser)
    jobs.addFilter(dateQuery)

    return filterJobsByViewPermission(jobs)
  }

  function findJobsByAccount(anAccount : Account, completed : Boolean, jobType : typekey.Job, createUser : User) : Job[] {
    if(createUser == null){
      throw new IllegalArgumentException("Create user is null")
    }

    var jobs = anAccount.getAllJobs(completed, jobType, null, createUser)

    return filterJobsByViewPermission(jobs)
  }

  function findJobsByAccountCreatedInLastXDays(anAccount : Account, completed : Boolean, jobType : typekey.Job, createUser : User, createdInLastXDays : Integer) : Job[] {
    if(createUser == null){
      throw new IllegalArgumentException("Create user is null")
    }

    var dateQuery = getCreateTimeQueryFilter(createdInLastXDays)
    var jobs = anAccount.getAllJobs(completed, jobType, null, createUser)
    jobs.addFilter(dateQuery)

    return filterJobsByViewPermission(jobs)
  }

  function findJobsByAccountProducerCodeCreatedInLastXDays(anAccount : Account, aProducerCode : ProducerCode, completed : Boolean, jobType : typekey.Job, createUser : User, createdInLastXDays : Integer) : Job[] {
    if(createUser == null){
      throw new IllegalArgumentException("Create user is null")
    }

    var dateQuery = getCreateTimeQueryFilter(createdInLastXDays)
    var jobs = anAccount.getAllJobs(completed, jobType, null, createUser)
    jobs.addFilter(dateQuery)

    var filteredJobs = aProducerCode == null ? jobs : jobs.where( \ aJob -> {
      return aJob.LatestPeriod.EffectiveDatedFields.ProducerCode == aProducerCode
          || aJob.Policy.Account.ProducerCodes.firstWhere( \ accProducerCode -> accProducerCode.ProducerCode == aProducerCode) != null
    })

    return filterJobsByViewPermission(filteredJobs)
  }

  function findJobsByCreateUserAndAccountCreatedInLastXDays(anAccount : Account, completed : Boolean, jobType : typekey.Job, createUser : User, createdInLastXDays : Integer) : Job[] {
    if(createUser == null){
      throw new IllegalArgumentException("Create user is null")
    }

    var dateQuery = getCreateTimeQueryFilter(createdInLastXDays)
    var jobs = anAccount.getAllJobs(completed, jobType, null, createUser)
    jobs.addFilter(dateQuery)

    var filteredJobs = jobs.where( \ aJob -> aJob.CreateUser == createUser)

    return filterJobsByViewPermission(filteredJobs)
  }

  private function getCreateTimeQueryFilter(createdInLastXDays : Integer) : StandardQueryFilter{
    var currentDate = gw.api.util.DateUtil.currentDate()
    createdInLastXDays = createdInLastXDays ?: defaultCreatedInLastXDays

    return new StandardQueryFilter("Created in last X days", \ query -> {query.between("CreateTime", currentDate.addDays(-createdInLastXDays).trimToMidnight(), currentDate)})
  }

  /**
   * Filter a list of Jobs and return an array of Jobs the current user has permission to view
   */
  private function filterJobsByViewPermission(jobs : Iterable<Job>) : Job[]{
    var filteredJobs : List<Job>
    if(jobs != null && jobs.HasElements){
      filteredJobs = jobs.where( \ aJob -> perm.Job.view(aJob))
      if(filteredJobs.Count < jobs.Count){
        LOGGER.logWarn("User does not have permission to view some or all jobs found and they have been removed from the returned list.")
        if(filteredJobs.Empty){
          throw new EntityPermissionException(){
          : Message = "User does not have permission to view the requested jobs.",
          : Data = jobs
        }
        }
      }
    }else{
      throw new EntityNotFoundException(){
      : Message = "No Jobs found",
      : Data = filteredJobs
    }
    }

    return filteredJobs.toTypedArray()
  }

}
