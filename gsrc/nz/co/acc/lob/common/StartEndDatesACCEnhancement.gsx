package nz.co.acc.lob.common

/**
 * Created by ManubaF on 21/04/2017.
 */
enhancement StartEndDatesACCEnhancement: StartEndDates_ACC {
  function createAndAddEffectiveExpirationDate() : EffectiveExpirationDate_ACC {
    var effectiveExpirationDate = new EffectiveExpirationDate_ACC(this.Branch)
    this.addToEffectiveExpirationDate(effectiveExpirationDate)
    return effectiveExpirationDate
  }
}
