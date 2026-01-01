package nz.co.acc.gwer.databeans


uses java.io.Serializable

/**
 * Created by andy on 25/09/2017.
 */
class CUData_ACC implements Serializable {

  private var _cuCode : String as CuCode
  private var _cuDescription : String as CuDescription

  var _transactionId : String as TransactionId
  var _transferRole : String as TransferRole

  construct() {
  }

  construct(code : String, desc : String) {
    _cuCode = code
    _cuDescription = desc
  }
}