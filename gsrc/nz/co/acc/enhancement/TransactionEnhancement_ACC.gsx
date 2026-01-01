package nz.co.acc.enhancement

uses gw.transaction.Transaction

/**
 * Created by Mike Ourednik on 8/09/2019.
 */
enhancement TransactionEnhancement_ACC : Transaction {

  public static function runWithNewBundleAsSystemUser_ACC(_block : gw.transaction.Transaction.BlockRunnable) {
    gw.transaction.Transaction.runWithNewBundle(_block, "sys")
  }
}
