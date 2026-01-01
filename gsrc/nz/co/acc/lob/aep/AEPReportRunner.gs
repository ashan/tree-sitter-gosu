package nz.co.acc.lob.aep

uses nz.co.acc.common.util.HikariJDBCConnectionPool

/**
 * Create AEP Reports.
 */
class AEPReportRunner {
  private var _connectionPool = HikariJDBCConnectionPool.getInstance()
  private var _connection = _connectionPool.getConnection()

  construct() {
    _connection.setReadOnly(true)
  }

  public function aepContactReport() : List<AEPContactReportRowData> {
    var sql = AEPContactReportSelectQuery.renderToString()
    var statement = _connection.prepareStatement(sql)
    try {
      var resultSet = statement.executeQuery()
      var aepContacts: LinkedList<AEPContactReportRowData> = {}
      while (resultSet.next()) {
        aepContacts.add(new AEPContactReportRowData(resultSet))
      }
      return aepContacts
    } catch (e: Exception) {
      throw e
    } finally {
      statement.close()
    }
  }

  public function aepContractReport() : List<AEPContractReportRowData> {
    var sql = AEPContractReportSelectQuery.renderToString()
    var statement = _connection.prepareStatement(sql)
    try {
      var resultSet = statement.executeQuery()
      var aepContracts: LinkedList<AEPContractReportRowData> = {}
      while (resultSet.next()) {
        aepContracts.add(new AEPContractReportRowData(resultSet))
      }
      return aepContracts
    } catch (e: Exception) {
      throw e
    } finally {
      statement.close()
    }
  }
}