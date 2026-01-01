package nz.co.acc.plm.integration.security.authentication

/**
 * Created by nitesh.gautam on 27/10/2017.
 */
interface IKeyVaultAPI {
  public function isUserInAuthList(user: String): Boolean

  public function confirmCredentials(userName: String, password: String): Boolean
}