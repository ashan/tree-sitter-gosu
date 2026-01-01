package nz.co.acc.util.finder

uses gw.api.database.Query

/**
 * Created by Mike Ourednik on 28/02/2021.
 */
class BICFinder_ACC {
  /**
   * If can not find only one BusinessIndustryCode_ACC or can find multi BusinessIndustryCode_ACC return null.
   * Otherwise return valid BusinessIndustryCode_ACC
   *
   * @param bicCode
   * @param levyYear
   * @return BusinessIndustryCode_ACC
   */
  public function findBusinessIndustryCode(
      bicCode : String,
      levyYear : Integer) : Optional<BusinessIndustryCode_ACC> {

    var list = Query.make(BusinessIndustryCode_ACC)
        .compare(BusinessIndustryCode_ACC#BusinessIndustryCode, Equals, bicCode)
        .select()

    if (list == null || list.Count == 0) {
      return Optional.empty()
    }

    var validCodes = list.where(\c -> c.EndDate.YearOfDate == levyYear)

    if (validCodes == null || validCodes.Count != 1) {
      return Optional.empty()

    } else {
      return Optional.of(validCodes.first())
    }
  }
}