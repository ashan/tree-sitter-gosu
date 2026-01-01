package nz.co.acc.plm.integration.preupdate

uses gw.api.util.DateUtil
uses nz.co.acc.common.edge.security.BCSSUserProvider_ACC

/**
 * Created by Mike Ourednik on 4/02/2019.
 */
class AccountContactPreupdate_ACC {

  public static function accountContactRoleCreated(accountContactRole: AccountContactRole) {
    var history = new History(accountContactRole.Bundle)
    history.setAccount(accountContactRole.AccountContact.Account)
    history.setContact(accountContactRole.AccountContact.Contact)
    history.setUser(User.util.CurrentUser)
    history.setEventTimestamp(DateUtil.currentDate())
    history.setCustomType(CustomHistoryType.TC_RELATIONSHIP_ADDED_ACC)
    getBCSSUserName().each(\bcssUsername -> history.setBCSSUser_ACC(bcssUsername))
    history.setDescription("Added role '${accountContactRole}' for contact '${accountContactRole.AccountContact.Contact}'")
  }

  public static function accountContactRoleRemoved(accountContactRole: AccountContactRole) {
    var history = new History(accountContactRole.Bundle)
    history.setAccount(accountContactRole.AccountContact.Account)
    history.setContact(accountContactRole.AccountContact.Contact)
    history.setUser(User.util.CurrentUser)
    history.setEventTimestamp(DateUtil.currentDate())
    history.setCustomType(CustomHistoryType.TC_RELATIONSHIP_REMOVED_ACC)
    getBCSSUserName().each(\bcssUsername -> history.setBCSSUser_ACC(bcssUsername))
    history.setDescription("Removed role '${accountContactRole}' for contact '${accountContactRole.AccountContact.Contact}'")
  }

  private static function getBCSSUserName(): Optional<String> {
    var bcssUser = BCSSUserProvider_ACC.getBCSSSUser()
    return Optional.ofNullable(bcssUser?.FullName)
  }
}