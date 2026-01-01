package nz.co.acc.plm.integration.http


uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.apache.http.client.config.RequestConfig
uses org.apache.http.impl.client.CloseableHttpClient
uses org.apache.http.impl.client.HttpClients
uses org.apache.http.impl.conn.PoolingHttpClientConnectionManager

/**
 * Created by Mike Ourednik on 24/03/20.
 */
class HTTPConnectionPool {

  private static var _log = StructuredLogger.INTEGRATION.withClass(HTTPConnectionPool)

  private static class Holder {
    private static final var INSTANCE: HTTPConnectionPool = new HTTPConnectionPool()
  }

  public static function getInstance() : HTTPConnectionPool {
    return Holder.INSTANCE
  }

  var _client : CloseableHttpClient as readonly Client

  private construct() {
    var poolSize = ConfigurationProperty.HTTP_CONNECTIONPOOL_POOLSIZE.PropertyValue.toInt()
    var timeout = ConfigurationProperty.HTTP_CONNECTIONPOOL_TIMEOUT.PropertyValue.toInt()
    _log.info("Initializing connection pool with size=${poolSize}, timeout=${timeout}s")

    var cm = new PoolingHttpClientConnectionManager()
    cm.setMaxTotal(poolSize)

    var config = RequestConfig.custom()
        .setConnectTimeout(timeout * 1000)
        .setConnectionRequestTimeout(timeout * 1000)
        .setSocketTimeout(timeout * 1000)
        .build();

    _client = HttpClients.custom().setConnectionManager(cm).setDefaultRequestConfig(config).build()
  }

}
