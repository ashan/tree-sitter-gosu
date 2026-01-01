package nz.co.acc.er.databeans

/**
 * Created by andy on 11/10/2017.
 */
class LevyTransferType_ACC {

  // These codes need to che changed if the ER transfer types change in the ER database.
  static var _transferTypeFullCode : String as readonly TransferTypeFullCode = "FUL"
  static var _transferTypeSplitCode : String as readonly TransferTypeSplitCode = "SPL"

  var _code : ArrayList<String> as Code = new ArrayList<String>()
  var _desc : ArrayList<String> as Description = new ArrayList<String>()


  construct() {
  }

  /**
   * Return if this type is a Full transfer type or not.
   * @param description
   * @return
   */
  function isTransferTypeFull(description : String) : boolean {
    var code = getCodeFromDescription(description)
    if (code.equals(_transferTypeFullCode)) {
      return true
    }
    return false
  }

  /**
   * Return the ArrayList of descriptions as a String Array
   * This is needed for the UI dropdown lists
   *
   * @return String[]
   */
  function getDescriptionAsList() : String[] {
    return _desc.toArray(new String[_desc.size()])
  }

  /**
   * Return the ArrayList of codes as a String Array
   * This is needed for the UI dropdown lists
   *
   * @return String[]
   */
  function getCodesAsList() : String[] {
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
    return ""
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