package edge.capabilities.gpa.account

/**
 * Plugin interface used for working with viewed accounts.
 */
interface IAccountViewHistoryPlugin {
    public function getRecentlyViewedAccounts (anUser : User) : Account[]
    public function addRecentlyViewedAccount(anUser : User, anAccount : Account)
}
