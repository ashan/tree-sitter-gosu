package nz.co.acc.common.util

uses com.zaxxer.hikari.HikariConfig
uses com.zaxxer.hikari.pool.HikariPool
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.common.function.impl.GetDatabaseConfig
uses nz.co.acc.common.function.impl.GetEnvironment
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

uses javax.naming.InitialContext
uses javax.sql.DataSource

/**
 * Singleton instance of Hikari database connection pool to SQL Server
 * <p>
 * Created by OurednM on 15/05/2018.
 */
class HikariJDBCConnectionPool {
  private static var _log = StructuredLogger.CONFIG.withClass(HikariJDBCConnectionPool)

  construct() {
    // Initialize singleton instance
    getInstance()
  }

  /**
   * Implementation of "initialization-on-demand holder idiom"
   * https://stackoverflow.com/a/16106598
   */
  private static class Holder {
    private static final var INSTANCE = createConnectionPool()
  }

  public static function getInstance(): HikariPool {
    return Holder.INSTANCE
  }

  private static function createConnectionPool(): HikariPool {
    var environment = Funxion.buildGenerator(new GetEnvironment()).generate()
    var resource = Funxion.buildGenerator(new GetDatabaseConfig(environment)).generate()

    if (resource.startsWith("jdbc:")) {
      return createConnectionWithURL(resource)
    } else {
      return createConnectionWithDataSource(resource)
    }
  }

  private static function createConnectionWithDataSource(dataSourceName: String): HikariPool {
    final var fn = "createConnectionWithDataSource"

    var dataSource = new InitialContext().lookup("java:/comp/env/" + dataSourceName) as DataSource
    var maxPoolSize = ConfigurationProperty.HIKARI_CONNECTION_POOL_SIZE.PropertyValue.toInt()

    var config = new HikariConfig()
    config.setDataSource(dataSource)
    config.setMaximumPoolSize(maxPoolSize)

    logInfo(fn, "Creating Hikari connection pool with poolsize=${maxPoolSize}")
    return new HikariPool(config)
  }

  private static function createConnectionWithURL(jdbcUrl: String): HikariPool {
    final var fn = "createConnectionWithURL"
    var maxPoolSize = ConfigurationProperty.HIKARI_CONNECTION_POOL_SIZE.PropertyValue.toInt()

    var config = new HikariConfig()
    config.setJdbcUrl(jdbcUrl)
    config.setMaximumPoolSize(maxPoolSize)

    logInfo(fn, "Creating Hikari connection pool with poolsize=${maxPoolSize}")
    return new HikariPool(config)
  }

  private static function logInfo(fn: String, msg: String) {
    _log.info(msg)
  }
}