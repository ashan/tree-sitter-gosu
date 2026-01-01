package edge.capabilities.policycommon.availability

uses java.lang.Boolean
uses edge.capabilities.policycommon.availability.AvailabilityCode
uses java.util.Date
uses java.lang.IllegalArgumentException

/**
 * Availability result description.
 */
final class AvailabilityResult {
  /** Code for this availability result. Denotes what data is available on this
   * result.
   */
  var _code : AvailabilityCode as Code
  
  /** Not null  only when code equals to WOULD_BE_AVAILABLE_SINCE_DATE. */
  var _availableSince : Date as readonly AvailableSince
  
  
  private construct(cd : AvailabilityCode, asd : Date) {
    this._code = cd
    this._availableSince = asd
  }
  
  
  /**
   * Checks if this result denotes a state where quote can be started
   * immediately (i.e. quote can be started and there are no known 
   * date restrictions).
   */
  function isImmediatelyAvailable() : Boolean {
    return _code == AvailabilityCode.AVAILABLE
  }


  static function available() : AvailabilityResult {
    return new AvailabilityResult(AvailabilityCode.AVAILABLE, null)
  }
  
  
  static function unavailable() : AvailabilityResult {
    return new AvailabilityResult(AvailabilityCode.UNAVAILABLE, null)
  }
  
  
  static function availableSince(date : Date) : AvailabilityResult {
    if (date == null) {
      throw new IllegalArgumentException("Availability date must be specified")
    }
    return new AvailabilityResult(AvailabilityCode.WOULD_BE_AVAILABLE_SINCE_DATE, date)
  }
}
