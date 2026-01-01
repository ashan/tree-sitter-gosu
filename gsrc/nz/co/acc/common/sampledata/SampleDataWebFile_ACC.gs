package nz.co.acc.common.sampledata

uses gw.api.web.WebFile

uses java.io.File
uses java.io.FileInputStream
uses java.io.InputStream

/**
 * Sample Data Web File.
 */
class SampleDataWebFile_ACC implements WebFile {
  private var _file : File as File
  private var _name : String as Name
  private var _contentType : String as ContentType

  construct(file : File, name : String, contentType : String) {
    _file = file
    _name = name
    _contentType = contentType
  }

  property get FilePath() : String {
    return _file.Path
  }

  override property get InputStream() : InputStream {
    return _file == null ? null : new FileInputStream(_file)
  }

  override property get Size() : long {
    return _file == null ? 0L : _file.length()
  }

  override property get MIMEType() : String {
    return _contentType
  }

  override property get Name() : String {
    return _name
  }

  override function markResources() {

  }

  override function unmarkResources() {

  }

  override function releaseResources() {

  }
}