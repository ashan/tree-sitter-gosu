package edge.capabilities.gpa.account

uses java.lang.IllegalArgumentException
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.capabilities.helpers.AccountUtil
uses edge.di.annotations.ForAllGwNodes
uses edge.PlatformSupport.Bundle

/**
 * Default implementation for an account view history plugin.
 */
class DefaultAccountViewHistoryPlugin implements IAccountViewHistoryPlugin {
  final private static  var LOGGER = new Logger(Reflection.getRelativeName(AccountUtil))
  final private static var MAXRECENTLYVIEWEDACCOUNTS = 25

  @ForAllGwNodes
  construct() {}

  /**
   * Returns the recently viewed accounts in a Guidewire Portal for the given user
   */
  public function getRecentlyViewedAccounts(anUser: User): Account[] {
    if (anUser == null){
      throw new IllegalArgumentException("User must not be null")
    }
    LOGGER.logDebug("Finding recently viewed accounts for user: " + anUser.DisplayName)
    var portalRecentlyViewed = gw.api.database.Query.make(PortalRecentlyViewed_Ext).compare("PortalUser", Equals, anUser).select().AtMostOneRow

    if (portalRecentlyViewed != null){
      return portalRecentlyViewed.PortalAccounts.where( \ elt -> !elt.Account.Frozen)?.sortByDescending(\aPortalAccount -> aPortalAccount.ViewedDate)*.Account
    }

    return null
  }

  /**
   * Returns the recently viewed accounts in a Guidewire Portal for the given user
   */
  public function addRecentlyViewedAccount(anUser: User, anAccount: Account) {
    if (anUser == null){
      throw new IllegalArgumentException("User must not be null")
    }
    Bundle.transaction(\bundle -> {
      LOGGER.logDebug("Adding recently viewed account: " + anAccount.AccountNumber + " for user: " + anUser.DisplayName)
      var portalRecentlyViewed = bundle.add(gw.api.database.Query.make(PortalRecentlyViewed_Ext).compare("PortalUser", Equals, anUser).select().AtMostOneRow)

      if (portalRecentlyViewed == null){
        portalRecentlyViewed = new PortalRecentlyViewed_Ext()
        portalRecentlyViewed.PortalUser = anUser
      }

      // If the account has already been recently viewed, update its view date
      if (portalRecentlyViewed.PortalAccounts != null && portalRecentlyViewed.PortalAccounts.hasMatch(\aPortalAccount -> aPortalAccount.Account == anAccount)) {
        var portalAccount = portalRecentlyViewed.PortalAccounts.firstWhere(\aPortalAccount -> aPortalAccount.Account == anAccount)
        portalAccount.ViewedDate = gw.api.util.DateUtil.currentDate()
      } else {
        // If there are the max recently viewed accounts, remove the account that was view least recently
        if (portalRecentlyViewed.PortalAccounts.Count == MAXRECENTLYVIEWEDACCOUNTS){
          var portalAccounts = portalRecentlyViewed.PortalAccounts.sortBy(\aPortalAccount -> aPortalAccount.ViewedDate)
          portalAccounts[0].PortalRecentlyViewed = null
        }

        var portalAccount = gw.api.database.Query.make(PortalAccount_Ext).compare("Account", Equals, anAccount)
            .compare("PortalRecentlyViewed", Equals, portalRecentlyViewed).select().AtMostOneRow

        if (portalAccount == null){
          portalAccount = new PortalAccount_Ext()
          portalAccount.PortalRecentlyViewed = portalRecentlyViewed
          portalAccount.Account = anAccount
          portalAccount.ViewedDate = gw.api.util.DateUtil.currentDate()
        }
      }
    })
  }
}
