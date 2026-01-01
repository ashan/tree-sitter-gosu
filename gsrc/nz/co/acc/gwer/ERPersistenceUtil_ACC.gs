package nz.co.acc.gwer

uses gw.surepath.suite.integration.logging.StructuredLogger
uses java.sql.Connection
uses java.sql.ResultSet
uses java.sql.Statement

class ERPersistenceUtil_ACC {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(ERPersistenceUtil_ACC)

  static function closeConnection(conn : Connection, callingObject: Object) {
    if(conn!= null){
      try {
        conn.close()
      } catch (e : Exception) {
       _logger.error_ACC(callingObject + "persist", e)
      }
    }
  }

  static function closeStatement(stmt : Statement, callingObject: Object) {
    if (stmt != null) {
      try {
        stmt.close()
      } catch (e : Exception) {
       _logger.error_ACC(callingObject + "persist", e)
      }
    }
  }

  static function closeResultSet(rs : ResultSet, callingObject: Object) {
    if(rs != null) {
      try {
        rs.close()
      } catch (e : Exception) {
       _logger.error_ACC(callingObject + "persist", e)
      }
    }
  }

  static function getResultSetLongValue(rs : ResultSet, columnName : String) : Long {
    if (rs != null and columnName != null) {
      var value = rs.getLong(columnName)
      if (rs.wasNull()) {
        return null
      }
      return value
    }
    return null
  }

}