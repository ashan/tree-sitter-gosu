package nz.co.acc.integration.util

uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

uses java.io.File

class InboundFileUtil {

  private var _baseDir: String

  construct(baseDir: String) {
    _baseDir = baseDir
  }

  public function deleteDoneFiles() {
    var pathName = _baseDir + "/done"
    var files = new File(pathName).listFiles()
    for (file in files) {
      file.delete()
    }
  }

  public function listDoneFiles() : List<String> {
    var pathName = _baseDir + "/done"
    return listFiles(pathName)
  }

  public function listErrorFiles() : List<String> {
    var pathName = _baseDir + "/error"
    return listFiles(pathName)
  }

  public function listIncomingFiles() : List<String> {
    var pathName = _baseDir + "/incoming"
    return listFiles(pathName)
  }

  public function listProcessingFiles() : List<String> {
    var pathName = _baseDir + "/processing"
    return listFiles(pathName)
  }

  public function listFiles(pathName : String) : List<String> {
    var files = new File(pathName).listFiles()
    if (files == null) {
      return {}
    } else {
      return files.toList().map(\file -> file.Name)
    }
  }
}