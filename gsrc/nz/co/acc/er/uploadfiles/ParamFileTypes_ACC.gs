package nz.co.acc.er.uploadfiles

uses java.io.Serializable

/**
 * Created by andy on 12/09/2017.
 */
class ParamFileTypes_ACC implements Serializable {

  var fileTypeId : ArrayList<int> as ID = new ArrayList<int>()
  var fileTypeName : ArrayList<String> as Names = new ArrayList<String>()
  var supportedExtensions : ArrayList<String> as Extensions = new ArrayList<String>()


  construct(){

  }

  /**
   * Return an ER filetype ID of the record with the name  as the key
   * @param name
   * @return  int ID
   */
  function getIdFromName(name : String) : int {
    if (name == null) {
      return -1
    }
    return fileTypeId.get( fileTypeName.indexOf(name) )
  }

  /**
   * Return a list of acceptable filetypes for the file that has this type name
   * @param name
   * @return String Comma seperated list of file types
   */
  function getExtensionsFromName(name : String) : String {
    if (name == null) {
      return null
    }
    return supportedExtensions.get( fileTypeName.indexOf(name) )
  }

  function toString() : String {

    if (fileTypeId == null or
        fileTypeName == null or
        supportedExtensions == null) {
      return ""
    }
    var sb : StringBuffer = new StringBuffer()
    for (i in 0..fileTypeId.size()-1) {
      sb.append("ID = " + fileTypeId[i])
      sb.append(", Name = " + fileTypeName[i])
      sb.append(", Extns = " + supportedExtensions[i])
      sb.append("\n")
    }

    return sb.toString()
  }
}