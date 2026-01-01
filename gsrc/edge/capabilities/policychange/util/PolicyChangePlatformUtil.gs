package edge.capabilities.policychange.util

/**
 * Platform-specific implementations of policychange functionality
 */
internal final class PolicyChangePlatformUtil {
  static function getJobFrom(p: PolicyPeriod): Job {
    return p.Job
  }
}
