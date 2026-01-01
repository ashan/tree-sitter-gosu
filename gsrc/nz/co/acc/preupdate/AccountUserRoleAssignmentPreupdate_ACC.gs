package nz.co.acc.preupdate


uses gw.surepath.suite.integration.logging.StructuredLogger
uses typekey.UserRole

/**
 * Created by Mike Ourednik on 25/02/2021.
 */
class AccountUserRoleAssignmentPreupdate_ACC {
  static var _log = StructuredLogger.CONFIG.withClass(AccountUserRoleAssignmentPreupdate_ACC)

  public static function updated(roleAssignment : AccountUserRoleAssignment) {
    if (roleAssignment.Role == UserRole.TC_AEPCOMPLIANCEADVISOR) {
      roleAssignment.Account.AEPComplianceAdvisor_ACC = roleAssignment.AssignedUser
      _log.debug( "Updated AEPComplianceAdvisor_ACC=${roleAssignment.AssignedUser.Credential.UserName} for account ${roleAssignment.Account.ACCID_ACC}")

    } else if (roleAssignment.Role == UserRole.TC_RELATIONSHIPMANAGER) {
      roleAssignment.Account.RelationshipManager_ACC = roleAssignment.AssignedUser
      _log.debug( "Updated RelationshipManager_ACC=${roleAssignment.AssignedUser.Credential.UserName} for account ${roleAssignment.Account.ACCID_ACC}")
    }
  }

  public static function removed(roleAssignment : AccountUserRoleAssignment) {
    if (roleAssignment.Role == UserRole.TC_AEPCOMPLIANCEADVISOR) {
      roleAssignment.Account.AEPComplianceAdvisor_ACC = null
      _log.debug( "Removed AEPComplianceAdvisor_ACC for account ${roleAssignment.Account.ACCID_ACC}")

    } else if (roleAssignment.Role == UserRole.TC_RELATIONSHIPMANAGER) {
      roleAssignment.Account.RelationshipManager_ACC = null
      _log.debug( "Removed RelationshipManager_ACC for account ${roleAssignment.Account.ACCID_ACC}")
    }
  }

}