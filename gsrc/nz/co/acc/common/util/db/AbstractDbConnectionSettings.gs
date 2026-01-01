package nz.co.acc.common.util.db

uses gw.util.GosuStringUtil

/**
 * Base implementation of database settings. Contains generic setting common to all the external database out there.
 * Any specifics can be overridden by the sub types.
 * <p>
 * Created by Kaushalya Samarasekera
 */
abstract class AbstractDbConnectionSettings {

  // Access set as protected to allow sub types to read or override the settings direct.
  protected var _host: String
  protected var _port: String
  protected var _dbname: String
  protected var _username: String
  protected var _password: String
  protected var _customParams: String = GosuStringUtil.EMPTY

  /**
   * Returns the JDBC url generated based on the database settings provided.
   *
   * @param maskSensitiveData whether sensitive data should to be masked. Set to {@code true} to generate the url only for presentation (UI) purposes.
   *                          URLs with masked data cannot be used to establish real connections.
   * @return jdbc url string
   */
  abstract function getUrl(maskSensitiveData: boolean): String

  /**
   * SQL query to test connectivity.
   *
   * @return sql query string
   */
  abstract function getTestQuery(): String

  /**
   * Sets hostname of the database.<br/>
   * A fluent-style function to chain the other operations of this instance.
   *
   * @param host name of the host to connect to
   * @return this settings instance
   */
  function setHost(host: String): AbstractDbConnectionSettings {
    this._host = host
    return this
  }

  /**
   * Sets port of the database.<br/>
   * A fluent-style function to chain the other operations of this instance.
   *
   * @param port port the database is listening for connections
   * @return this settings instance
   */
  function setPort(port: String): AbstractDbConnectionSettings {
    this._port = port
    return this
  }

  /**
   * Sets database name.<br/>
   * A fluent-style function to chain the other operations of this instance.
   *
   * @param dbName name of the database instance in the database server
   * @return this settings instance
   */
  function setDatabaseName(dbName: String): AbstractDbConnectionSettings {
    this._dbname = dbName
    return this
  }

  /**
   * Sets username of the login to connect to the database.<br/>
   * A fluent-style function to chain the other operations of this instance.
   *
   * @param username username of the login
   * @return this settings instance
   */
  function setUsername(username: String): AbstractDbConnectionSettings {
    this._username = username
    return this
  }

  /**
   * Sets password of the login to connect to the database.<br/>
   * A fluent-style function to chain the other operations of this instance.
   *
   * @param password password of the login
   * @return this settings instance
   */
  function setPassword(password: String): AbstractDbConnectionSettings {
    this._password = password
    return this
  }

  /**
   * Sets any custom parameters required for the jdbc connection url.<br/>
   * A fluent-style function to chain the other operations of this instance.
   *
   * @param params parameters in the exact format of how they should be appended to the jdbc url
   * @return this settings instance
   */
  function setCustomParams(params: String): AbstractDbConnectionSettings {
    this._customParams = params
    return this
  }

}