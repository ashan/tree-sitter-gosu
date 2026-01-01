package edge.capabilities.policycommon.availability

/**
 * Different codes for the availability.
 */
enum AvailabilityCode {
  /** Product is available for quoting. */
  AVAILABLE,
  /** Product is unconditionally unavailable. */
  UNAVAILABLE,
  /** Product is not available yet but would be available at the specified
   * date.
   */
  WOULD_BE_AVAILABLE_SINCE_DATE
}
