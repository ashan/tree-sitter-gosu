package edge.capabilities.quote.quoting.util

uses java.lang.UnsupportedOperationException
uses gw.api.productmodel.Offering

/**
 * Policy offering utils.
 */
final class OfferingUtil {

  private construct() {
    throw new UnsupportedOperationException()
  }

  /**
   * Applies an offering to the policy line. Behaviour and way to set the offering differs between
   * different platform, so this method is separate from the main quoting plugin body.
   */
  public static function setOffering(period : PolicyPeriod, offering : Offering) {
    /* Update policy and reset all extra offerings for the base period. 
     * Simply setting an offering would not update/remove inherited coverages on the
     * period.
     */
    period.forceSyncOffering(offering)
  }
}
