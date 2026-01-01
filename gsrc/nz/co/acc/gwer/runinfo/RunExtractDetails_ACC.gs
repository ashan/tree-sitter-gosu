package nz.co.acc.gwer.runinfo

class RunExtractDetails_ACC {
  private var _extractID : Long as ExtractID
  private var _extractTargetFolder : String as ExtractTargetFolder
  private var _extractFileName : String as ExtractFileName

  property get FilePath() : String {
    if (_extractTargetFolder.endsWith("\\")) {
      return _extractTargetFolder + _extractFileName
    } else {
      return _extractTargetFolder + "\\" + _extractFileName
    }
  }

}