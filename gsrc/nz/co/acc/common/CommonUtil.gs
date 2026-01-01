package nz.co.acc.common

uses com.guidewire.pl.system.dependency.PLDependencies
uses gw.api.database.Query
uses gw.api.database.Relop

/**
 * It seems difficult to get consistent common util classes from PC and BC
 * This class contains helper methods that can work for both PC and BC
 *
 * Created by Nick on 27/03/2017.
 */
class CommonUtil {
  /**
   * Gets user by user name. [Copied from BC UserUtil]
   */
  public static function getUserByName(username: String): User {
    return PLDependencies.getUserFinder().findByCredentialName(username);
  }

  /**
   * [Copied from BCAdminDataLoaderUtil.findActivityPatternByCode].
   * @param code
   * @return
   */
  public static function findActivityPatternByCode(code: String): ActivityPattern {
    return Query.make(entity.ActivityPattern).compare("Code", Relop.Equals, code).select().getAtMostOneRow()
  }

  /**
   * Retrieve an account by account number
   * @param accountNumber
   * @return
   */
  public static function findAccountByAccID(accountNumber: String): Account {
    return Query.make(Account).compare(Account#ACCID_ACC, Relop.Equals, accountNumber).select().AtMostOneRow
  }

}