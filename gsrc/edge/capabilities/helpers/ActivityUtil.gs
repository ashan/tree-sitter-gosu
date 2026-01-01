package edge.capabilities.helpers

uses java.lang.IllegalArgumentException
uses gw.api.database.Query
uses edge.exception.EntityNotFoundException
uses edge.exception.EntityPermissionException
uses edge.di.annotations.ForAllGwNodes
uses java.lang.Iterable
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger

class ActivityUtil {

  final private static  var LOGGER = new Logger(Reflection.getRelativeName(ActivityUtil))

  @ForAllGwNodes
  construct() {}

  /**
   * Get an Activity entity from a public ID
   *
   * @param publicId The Public ID of the Activity to look up
   * @return The Activity entity
   * @throws IllegalArgumentException If public id is null or empty
   * @throws EntityNotFoundException If no Activity is found
   * @throws AuthorizationException If the portal user has no access to the activity
   */
  public function getActivityFromPublicID(publicID: String): Activity {
    if (publicID == null || publicID.Empty){
      throw new IllegalArgumentException("Public ID is null or empty")
    }
    var activity = Query.make(Activity).compare("PublicID", Equals, publicID).select().AtMostOneRow
    if (activity == null){
      throw new EntityNotFoundException(){
        : Message = "No Activity entity found",
        : Data = publicID
      }
    }else if(!perm.Activity.view(activity)){
      throw new EntityPermissionException(){
        : Message = "User does not have permission to view the requested activity.",
        : Data = activity
      }
    }

    return activity
  }

  /**
   * Gets all activities
   *
   * @return A list of Activity entities
   */
  public function getActivitiesForCurrentUser(): List<Activity> {
    var activitiesQuery = Query.make(Activity)
        .compare("AssignedUser", Equals, User.util.CurrentUser)
        .compare("Status", NotEquals, typekey.ActivityStatus.TC_COMPLETE)

    return filterActivitiesByViewPermission(activitiesQuery.select())
  }

  /**
   * Gets activities for policy
   *
   * @return A list of Activity entities
   */
  public function getActivitiesForPolicy(aPolicy : Policy): List<Activity> {
    if(aPolicy == null){
      throw new IllegalArgumentException("Policy must not be null.")
    }
    var activitiesQuery = Query.make(Activity).compare("Policy", Equals, aPolicy)

    return filterActivitiesByViewPermission(activitiesQuery.select())
  }

  /**
   * Gets activities for a job
   *
   * @return A list of Activity entities
   */
  function getActivitiesForJob(aJob: Job): List<Activity> {
    var activitiesQuery = Query.make(Activity).compare("Job", Equals, aJob)

    return filterActivitiesByViewPermission(activitiesQuery.select())
  }

  /**
   * Gets activities for account
   *
   * @return A list of Activity entities
   */
  function getActivitiesForAccount(anAccount : Account): List<Activity> {
    var activitiesQuery = Query.make(Activity).compare("Account", Equals, anAccount)

    return filterActivitiesByViewPermission(activitiesQuery.select())
  }

  /**
   * Gets all activities for the current user and their groups
   *
   * @return A list of Activity entities
   */
  public function getActivitiesForCurrentUserAndGroups(): List<Activity> {
    var groupUsers = User.util.CurrentUser.GroupUsers
    var groups =  groupUsers.Count > 0 ? groupUsers*.Group : new Group[]{}

    var activitiesQuery = Query.make(Activity).or(\ queryResult -> {
      queryResult.compare("AssignedByUser", Equals, User.util.CurrentUser)
      queryResult.compareIn("AssignedGroup", groups)
    })
    return filterActivitiesByViewPermission(activitiesQuery.select())
  }

  /**
   * Filter a list of Activities and return an array of Activities the current user has permission to view
   */
  private function filterActivitiesByViewPermission(activities : Iterable<Activity>) : List<Activity>{
    var filteredActivities : List<Activity>
    if(activities != null && activities.HasElements){
      filteredActivities = activities.where( \ anActivity -> perm.Activity.view(anActivity))
      if(filteredActivities.Count < activities.Count){
        LOGGER.logWarn("User does not have permission to view some or all activities found and they have been removed from the returned list.")
        if(filteredActivities.Empty){
          throw new EntityPermissionException(){
              : Message = "User does not have permission to view the requested activities.",
              : Data = activities
          }
        }
      }
    }

    return filteredActivities
  }
}
