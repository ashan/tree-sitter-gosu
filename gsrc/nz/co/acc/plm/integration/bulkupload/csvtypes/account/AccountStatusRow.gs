package nz.co.acc.plm.integration.bulkupload.csvtypes.account

/**
 * Created by HamblyAl on 18/03/2019.
 */
class AccountStatusRow {
  public var accNumber: String as ACCNumber = null
  public var suffix: String as Suffix = null
  public var accountStatus: String as AccountStatus = null

  @Override
  function toString() : String  {
      return "AccountStatus{" +
          "accNumber='" + accNumber + '\'' +
          ", suffix='" + suffix + '\'' +
          ", accountStatus='" + accountStatus + '\'' +
          '}';
      }}