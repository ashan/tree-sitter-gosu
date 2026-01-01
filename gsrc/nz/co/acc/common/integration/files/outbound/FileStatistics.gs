package nz.co.acc.common.integration.files.outbound

uses gw.api.util.CurrencyUtil
uses gw.pl.currency.MonetaryAmount

uses java.math.BigDecimal

/**
 * This holds statistics of a batch file used by outbound batch framework.
 * Created by Nick on 27/04/2017.
 */
class FileStatistics {
  var _numOfRecordsErrored: int as NumOfRecordsErrored = 0
  var _numOfRecordsProcessed: int as NumOfRecordsProcessed = 0
  var _numOfUniqueAccounts: int as NumOfUniqueAccounts = 0
  var _totalAmount: MonetaryAmount as TotalAmount = new MonetaryAmount(BigDecimal.ZERO, CurrencyUtil.getDefaultCurrency())
  var _hashTotal: long as HashTotal = 0


  public function incrementNumOfRecordsErrored() {
    _numOfRecordsErrored++
  }

  public function incrementNumOfRecordsProcessed() {
    _numOfRecordsProcessed++
  }

  public function addToHashTotal(hashTotal: long) {
    _hashTotal = _hashTotal + hashTotal
  }

  public function addToTotalAmount(amount: MonetaryAmount) {
    if (amount != null) {
      _totalAmount = _totalAmount.add(amount)
    }
  }

}