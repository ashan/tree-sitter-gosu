package edge.capabilities.policy.lob.personalauto.util

uses java.lang.UnsupportedOperationException
uses java.util.Date

/**
 * Platform compatibility module.
 */
final class PAPlatformUtil {

  private construct() {
    throw new UnsupportedOperationException()
  }

  public static function getDOB(driver : PolicyDriver) : Date {
    return driver.DateOfBirth
  }

  public static function businessAutoCov(cov : BusinessAutoCov) : Cost[] {
    return cov.Costs
  }

  public static function licenseState(driver : CommercialDriver) : Jurisdiction {
    return driver.LicenseState.Categories.firstWhere( \ elt -> typeof elt == Jurisdiction) as Jurisdiction
  }
}
