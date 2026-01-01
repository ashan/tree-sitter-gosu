package gwservices.DataLoader.Processor

uses gw.api.util.DisplayableException

uses java.io.BufferedInputStream
uses java.io.File
uses java.io.FileOutputStream

uses org.slf4j.LoggerFactory

class DataLoaderProcessor {
  public static final var LOG: org.slf4j.Logger = LoggerFactory.getLogger("DataLoader.Parser")

  private var _myWebFile: gw.api.web.WebFile as MyWebFile
  //Excel File

  private var _path: String as Path
  //File Path
  private var _tmpFile: File as TempFile


  construct() {
  }


  function copyWebFileToFile(myWebFile: gw.api.web.WebFile, tempFileName : String, tempExtension : String): File {
    _myWebFile = myWebFile
    return copyWebFileToFile(tempFileName, tempExtension)
  }

  function copyWebFileToFile(tempFileName : String, tempExtension : String): File {
    // If the start of the extension is not the period then add it.
    if (!tempExtension.substring(0,0).equals(".")) {
      tempExtension = "." + tempExtension
    }

    _tmpFile = File.createTempFile(tempFileName, tempExtension)

    try {
      using(var bos = new FileOutputStream(_tmpFile)) {
        using(var bis = new BufferedInputStream(_myWebFile.InputStream)) {
          var ba = new byte[2048]
          var count = bis.read(ba)
          while (count > 0)
          {
            bos.write(ba, 0, count)
            count = bis.read(ba)
          }
          return _tmpFile
        }
      }
    } catch (e: Exception) {
      var msg = "ExcelFileParser: Error occurred while reading the file: "
      LOG.error(msg, e)
      throw new DisplayableException(msg + e.toString())
    }
  }


  public function generateGUID() : String {
    // Creating a random UUID (Universally unique identifier).
    var uuid : UUID = UUID.randomUUID();
    var uuidAsString = uuid.toString().toUpperCase()
    // The DB will only accept 36 chars in length
    uuidAsString = uuidAsString.substring(0,36)
    print("Generated UUID String  = " + uuidAsString);
    return uuidAsString
  }

}
