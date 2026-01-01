package nz.co.acc.integration.securemessage

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths

class SecureMessageUIHelper {
  var _activityStatus : ActivityStatus as ActivityStatus = ActivityStatus.TC_OPEN
  var _threads : IQueryBeanResult<SecureMessageThread_ACC> as readonly Threads

  public construct() {
    findThreadsForCurrentUser()
  }

  function findThreadsForCurrentUser() {
    var query = Query.make(SecureMessageThread_ACC)
        .join(SecureMessageThread_ACC#Activity)
        .compare(Activity#AssignedUser, Relop.Equals, User.util.CurrentUser)

    if (_activityStatus != null) {
      query.compare(Activity#Status, Relop.Equals, _activityStatus)
    }

    _threads = query.withDistinct(true)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(SecureMessageThread_ACC#CreateTime)))
        as IQueryBeanResult<SecureMessageThread_ACC>
  }

  static function validateMessageLength(msg : String) : String {
    if (msg.length() > ScriptParameters.SecureMessagingMaxMessageSize_ACC) {
      return "Message contains ${msg.length()} characters which exceeds maximum size ${ScriptParameters.SecureMessagingMaxMessageSize_ACC} characters"
    } else {
      return null
    }
  }
}