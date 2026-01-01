package nz.co.acc.plm.util.db

uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

uses java.sql.Connection


class ERDatabaseConnectionHelper {
  var _conn: ExternalDbConnection
  var _status: ExternalDbConnection.ConnectionStatus as readonly Status

  property get Connection(): Connection {
    this._conn = new ExternalDbConnection(ExternalDbConnection.DbType.MSSQL)
    this._conn.Settings
        .setHost(ConfigurationProperty.ER_DATABASE_HOST.PropertyValue)
        .setDatabaseName(ConfigurationProperty.ER_DATABASE_DBNAME.PropertyValue)
        .setUsername(ConfigurationProperty.ER_DATABASE_USERNAME.PropertyValue)
        .setPassword(ConfigurationProperty.ER_DATABASE_PASSWORD.PropertyValue)
    return _conn.connect(ScriptParameters.ERDatabaseLoginTimeoutInSeconds_ACC)
  }

  property get ConnectionUrl(): String {
    this._conn = new ExternalDbConnection(ExternalDbConnection.DbType.MSSQL)
    var settings = this._conn.Settings
        .setHost(ConfigurationProperty.ER_DATABASE_HOST.PropertyValue)
        .setDatabaseName(ConfigurationProperty.ER_DATABASE_DBNAME.PropertyValue)
        .setUsername(ConfigurationProperty.ER_DATABASE_USERNAME.PropertyValue)
        .setPassword(ConfigurationProperty.ER_DATABASE_PASSWORD.PropertyValue)
    return settings.getUrl(true)
  }

  public function newConnection(host : String, databaseName : String, userName : String, password : String) : Connection {
    this._conn = new ExternalDbConnection(ExternalDbConnection.DbType.MSSQL)
    this._conn.Settings.setHost(host).setDatabaseName(databaseName).setUsername(userName).setPassword(password)
    return _conn.connect(ScriptParameters.ERDatabaseLoginTimeoutInSeconds_ACC)
  }

  public function newConnectionUrl(host : String, databaseName : String, userName : String, password : String) : String {
    this._conn = new ExternalDbConnection(ExternalDbConnection.DbType.MSSQL)
    this._conn.Settings.setHost(host).setDatabaseName(databaseName).setUsername(userName).setPassword(password)
    return this._conn.Settings.getUrl(true)
  }

  function testConnectivity() {
    this._status = this._conn.testConnectivity(ScriptParameters.ERDatabaseLoginTimeoutInSeconds_ACC)
  }

  property get Output(): String {
    var output = ""

    if (this._status != null) {
      output = new StringBuilder()
          .append("Query: ${this._conn.Settings.getTestQuery()}")
          .append("${System.lineSeparator()}")
          .append("${System.lineSeparator()}")
          .append("${this._status.Result}").toString()
    }
    return output
  }
}