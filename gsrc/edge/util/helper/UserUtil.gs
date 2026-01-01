package edge.util.helper

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Bundle
uses wsi.local.gw.wsi.pl.workflowapi.faults.BadIdentifierException

/**
 * Helper functions for operations with users
 */
class UserUtil {
  /**
   * Gets user by user name
   */
  public static function getUserByName(username: String): User {
    var cred = Query.make(Credential).compare("UserName", Equals, username).select().first()
    var user = cred != null ? Query.make(User).compare("Credential", Equals, cred).select().first() : null

    return user
  }

  /**
   *
   * Add roles, represented by an array of role name strings, to a user
   *
   * @param bundle the commit bundle
   * @param user the user to add roles to
   * @param roles an array of roles
   */
  public static function addRolesToUser(bundle: Bundle, user: User, roles: String[]) {
    if (user == null) {
      throw "User to add role to was not found"
    }
    bundle.add(user)
    for (role in roles) {
      if (role != null) {
        var userRole = new UserRole(user)
        userRole.User = user
        var roleQuery = Query.make(entity.Role).compare(Role#PublicID, Equals, role)
        userRole.Role = roleQuery.select().AtMostOneRow
        if (userRole.Role == null) {
          throw "For user " + user.DisplayName + " Could not find user role " + role + "."
        }
      }
    }
  }

  /**
   *
   * Add uwAuthorityProfiles, represented by an array of uwAuthorityProfile name strings, to a user
   *
   * @param bundle
   * @param user the user to add uwAuthorityProfiles to
   * @param uwAuthorityProfiles an array of uwAuthorityProfiles
   */
  public static function addUWAutorityProfilesToUser(bundle: Bundle, user: User, uwAuthorityProfiles: String[]) {
    if (user == null) {
      throw "User to add uw authority to was not found"
    }
    bundle.add(user)
    for (profile in uwAuthorityProfiles) {
      if (profile != null) {
        var userProfile = new UserAuthorityProfile(user)
        var uwProfileQuery = Query.make(entity.UWAuthorityProfile).compare(UWAuthorityProfile#Name, Equals, profile)

        userProfile.UWAuthorityProfile = uwProfileQuery.select().AtMostOneRow
        user.addToUserAuthorityProfiles( userProfile )

        if (userProfile.UWAuthorityProfile == null) {
          throw "For user " + user.DisplayName + " Could not find user role " + profile + "."
        }
      }
    }
  }

}
