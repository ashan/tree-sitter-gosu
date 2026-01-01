package nz.co.acc.common.upgrade.function

uses gw.api.database.Query
uses gw.api.database.Relop
uses nz.co.acc.common.function.Funxion

uses java.util.function.Consumer

/**
 * @author Ron Webb
 * @since 2019-06-25
 */
class ExecuteDataChangeByRefID implements Consumer<String> {

  override function accept(refID : String) {
    var qry = Query.make<DataChange>(DataChange)
    qry.compare(DataChange#ExternalReference, Relop.Equals, refID)
    var dataChange = qry.select().AtMostOneRow
    Funxion.buildExecutor(new ExecuteDataChange()).execute(dataChange)
  }

}