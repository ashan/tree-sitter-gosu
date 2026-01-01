package nz.co.acc.gwer.fileinfo

/**
 * Entity to store result of File Info Procedures
 * 16.10.2018 US12122 NowchoO
 */
class FileInfoDetails_ACC {

  private var _fileChecked : Date as FileChecked
  private var _fileGenerated : Date as FileGenerated
  private var _suppressionListFolder : String as SuppressionListFolder
  private var _suppressionListFileName : String as SuppressionListFileName

  property get FilePath() : String {
    if (_suppressionListFolder.endsWith("\\")) {
      return _suppressionListFolder + _suppressionListFileName
    } else {
      return _suppressionListFolder + "\\" + _suppressionListFileName
    }
  }

}