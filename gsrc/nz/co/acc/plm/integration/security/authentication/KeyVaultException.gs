package nz.co.acc.plm.integration.security.authentication

/**
 * Serves as standard exception for KeyVault authentication operations.
 * <p>
 * <strong>Usage</strong>:
 * <p>
 * To use this exception for KeyVault authentication:
 * <ol>
 * <li>Create KeyVaultAuthenticationSource.</li>
 * <li>Authenticate user with KeyVault credentials.</li>
 * </ol>
 * </p>
 * Created by nitesh.gautam on 27/10/2017.
 */
class KeyVaultException extends Exception {
  construct(message: String) {
    super(message)
  }

  construct(message: String, cause: Throwable) {
    super(message, cause)
  }

}