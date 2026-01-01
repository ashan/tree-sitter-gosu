package nz.co.acc.integration.util

/**
 * Indicates that policy transaction cannot be applied due to existing
 * open policy transactions on a policy period
 *
 * Created by Mike Ourednik on 25/02/2021.
 */
class OpenPolicyTransactionBlockProgressException extends RuntimeException {
  construct(msg: String) {
    super(msg)
  }
}