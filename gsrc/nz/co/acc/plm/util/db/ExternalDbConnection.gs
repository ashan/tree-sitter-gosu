package nz.co.acc.plm.util.db

uses gw.lang.reflect.ReflectUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.util.db.AbstractDbConnectionSettings
uses nz.co.acc.common.util.db.H2MemConnectionSettings
uses nz.co.acc.common.util.db.MsSqlConnectionSettings

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.sql.Connection
uses java.sql.DriverManager
uses java.sql.SQLException

/**
 * Use this class to establish a connection to an external database server.
 * Settings for the connection can be specified depending on the type of database selected.
 * <p>
 * Created by Kaushalya Samarasekera
 */
class ExternalDbConnection {

  /**
   * Settings of this database connection
   */
  var _settings: AbstractDbConnectionSettings as readonly Settings

  /**
   * Type of the database to connect to.
   *
   * @param type
   */
  construct(type: DbType) {
    _settings = type.InstanceForSettings
  }

  /**
   * Establishes a connection with the database, based on settings.
   *
   * @return the connection instance
   */
  function connect(): Connection {
    return connect(0)
  }

  /**
   * Establishes a connection with the database, based on settings.
   *
   * @param loginTimeoutInSeconds
   * @return the connection instance
   */
  function connect(loginTimeoutInSeconds : int): Connection {
    if (loginTimeoutInSeconds != 0) {
      DriverManager.setLoginTimeout(loginTimeoutInSeconds)
    }
    return DriverManager.getConnection(this._settings.getUrl(false))
  }

  /**
   * Performs a test by establishing and performing a query operation against the database specified in settings.
   *
   * @return status of the connectivity test
   */
  function testConnectivity(): ConnectionStatus {
    return testConnectivity(0)
  }

  /**
   * Performs a test by establishing and performing a query operation against the database specified in settings.
   *
   * @param loginTimeoutInSeconds
   * @return status of the connectivity test
   */
  function testConnectivity(loginTimeoutInSeconds : int): ConnectionStatus {
    var fn = "testConnectivity"

    var status = new ConnectionStatus()
    try {
      using (var conn = this.connect(loginTimeoutInSeconds), var stmt = conn.createStatement()) {
        var rs = stmt.executeQuery(this._settings.getTestQuery())
        rs.next()
        status.Result = rs.getString("db_date")
        status.IsSuccessful = true
      }
    } catch (e: SQLException) {
      status.Result = e.Message
      StructuredLogger.INTEGRATION.error_ACC( this + " " + fn + " " + "Connectivity test to database failed:", e)
    }
    return status
  }

  /**
   * Type of the database to establish the connection. Each type holds the type of settings that's relevant and
   * specific to the database and may also provide defaults for certain field such as port.
   */
  enum DbType {

    /**
     * MS SQL Server
     */
    MSSQL(MsSqlConnectionSettings.Type.Name),

    /**
     * H2 in-memory
     */
    H2MEM(H2MemConnectionSettings.Type.Name)

    //-----------------

    /**
     * Fully qualified name (FQN) of the settings type specific to the database type.
     */
    var _settingsFqn: String

    /**
     * @param settingsFqn
     */
    private construct(settingsFqn: String) {
      this._settingsFqn = settingsFqn
    }

    /**
     * New instance of the settings type specific to the database type.
     *
     * @return new settings instance
     */
    property get InstanceForSettings(): AbstractDbConnectionSettings {
      return ReflectUtil.construct(_settingsFqn, {})
    }
  }

  /**
   * Data transfer object to carry the status of a connection made to an external database by {@code ExternalDbConnection}
   */
  class ConnectionStatus {
    var _isSuccessful: Boolean as IsSuccessful
    var _resultOutput: String as Result
  }

}
