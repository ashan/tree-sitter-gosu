package nz.co.acc.gwer.databeans

/**
 * Created by andy on 11/10/2017.
 */
class LevyTransferStatus_ACC {


  // These codes need to che changed if the ER transfer types change in the ER database.
  static var _transferStatusDraftCode : String as readonly TransferStatusDraftCode = "DRF"
  static var _transferStatusReadyForApprovalCode : String as readonly TransferStatusReadyForApprovalCode = "RFA"
  static var _transferStatusApprovedCode : String as readonly TransferStatusApprovedtCode = "APP"
  static var _transferStatusDeclinedCode : String as readonly TransferStatusDeclinedCode = "DEC"
  static var _transferStatusWithdrawnCode : String as readonly TransferStatusWithdrawnCode = "WDN"


  var _code : ArrayList<String> as Code = new ArrayList<String>()
  var _desc : ArrayList<String> as Description = new ArrayList<String>()


  construct() {
  }

  /**
   * Return the ArrayList of descriptions as a String Array
   * This is needed for the UI dropdown lists
   *
   * @return String[]
   */
  property get DescriptionAsList() : String[] {
    return _desc.toArray(new String[_desc.size()])
  }

  /**
   * Return the ArrayList of codes as a String Array
   * This is needed for the UI dropdown lists
   *
   * @return String[]
   */
  property get CodesAsList() : String[] {
    return _code.toArray(new String[_code.size()])
  }

  /**
   * Return the associated code from the description
   * @param desc
   * @return Code
   */
  function getCodeFromDescription(desc : String) : String {

    if (_desc.contains(desc)) {
      return _code[_desc.indexOf(desc)]
    }
    return TransferStatusDraftCode
  }

  /**
   * Return the associated code from the description
   * @param desc
   * @return Code
   */
  function getDescriptionFromCode(code : String) : String {

    if (_code.contains(code)) {
      return _desc[_code.indexOf(code)]
    }
    return ""
  }

}