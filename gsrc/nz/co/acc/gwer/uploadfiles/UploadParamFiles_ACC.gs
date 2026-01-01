package nz.co.acc.gwer.uploadfiles

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.api.web.WebFile
uses gw.plugin.util.CurrentUserUtil
uses gwservices.DataLoader.Parser.ExcelFileParser
uses gwservices.DataLoader.Processor.DataLoaderProcessor
//uses nz.co.acc.erV2.configuration.ERConfigurationUtil_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.StoreProcController_ACC
uses nz.co.acc.gwer.request.ERRetrieveExpectedSpreadsheetTabs_ACC
uses nz.co.acc.gwer.request.ERRetrieveFileType_ACC
uses nz.co.acc.gwer.request.ERRetrieveTargetfolder_ACC
uses nz.co.acc.gwer.request.RemoveFileImportLog_ACC
uses nz.co.acc.gwer.request.RetrieveFileNameforDeletion_ACC
uses org.apache.commons.io.FileUtils

uses java.io.File
uses java.io.IOException
uses java.io.Serializable


class UploadParamFiles_ACC implements Serializable {

  private var _commentsValue : String as CommentsValue
  private var _selectedFileType : String as SelectedFileType
  private var _fileTypeList : ParamFileTypes_ACC as FileTypeList
  private var _selectedWebFile: WebFile as SelectedWebFile
  private var _newInputFile: File as NewInputFile
  private var _dataLoaderProcessor : DataLoaderProcessor as DataLoaderProcessor
  private var _tabsInFileForUpload: List<String>
  private var _successMessage : String as SuccessMessage = ""

  private var _tabValidationSuccessfull = true
  private var _excelFileParser = new ExcelFileParser() as ExcelFileParser
  private var _maxFileNameLength = 36  // Max chars SQL server filename can be
  private var _deletedOldFile = false


  construct() {
    // populate all the filetypes for the gui
    _dataLoaderProcessor = new DataLoaderProcessor()
    _fileTypeList = new ERRetrieveFileType_ACC().retrieveFileTypes()
  }


  /**
   * The Import button has been pressed.
   * Check the selected file exists and the user fields are completed as expected
   */
//  function importDataFile()  {
//
//    _deletedOldFile = false
//    _successMessage = ""
//
//    if (_selectedFileType == null) {
//      throw new DisplayableException(DisplayKey.get("Web.Rating.Errors.No.Type.Selected_ACC"))
//    }
//
//    if (_selectedWebFile == null) {
//      throw new DisplayableException(DisplayKey.get("Web.Rating.Errors.No.File.Selected_ACC"))
//    }
//
//    // Check the file extension
//    checkFileExtension()
//
//    // Check the file size
//    checkFileSize()
//
//    // We do not know the path of the file because this is a Guidewire WebFile and not a java.io.File
//    // we need to Binary Copy the file to the temp location and then we can do what is needed.
//    // Thanks Guidewire
//    _newInputFile = _dataLoaderProcessor.copyWebFileToFile(_selectedWebFile, _dataLoaderProcessor.generateGUID(), getFileExtension(_selectedWebFile))
//
//    _tabsInFileForUpload = new ERRetrieveExpectedSpreadsheetTabs_ACC().retrieveSpreadsheetTabs(_fileTypeList.getIdFromName(_selectedFileType))
//
//    // If this is a binary file then we have a problem as Guidewire will not open binary excel files.
//    //*** *** ***  I am leaving the code here as Guidewire MAY be able to check in the near future *** *** ***//
////    if (_excelFileParser.canFileBeMadeIntoWorkbook(_newInputFile)) {
////
////      // If we get there then it is all good news..... So far
////      _excelFileParser.listWorkbookSheets()
////
////      // Now check the file has all the Tabs we are expecting.   If there are more tabs than we need we dont care.
////      _tabValidationSuccessfull = _excelFileParser.checkWorkbookSheets(_tabsInFileForUpload)
////      _tabsInFileForUpload = _excelFileParser.getSheetNamesInFile()
////    }
//
//    if (_selectedFileType != FileTypes_ACC.ManualModifers.FileTypeName) {
//      // Remove any old waiting files that have not been processed yet
//      var fileForDeleting: String = new RetrieveFileNameforDeletion_ACC().retrieveFileNameforDeletion(_fileTypeList.getIdFromName(_selectedFileType))
//      if (fileForDeleting != null and !fileForDeleting.isEmpty()) {
//        _deletedOldFile = true
//        try {
//          deleteFileFromERFolder(fileForDeleting)
//        } catch (e: DisplayableException) {
//          // in this case we do not want to tell the user there is a problem because they do not know it is happening.
//        }
//        new RemoveFileImportLog_ACC().removeFileImportLog(_fileTypeList.getIdFromName(_selectedFileType), fileForDeleting)
//      }
//    }
//
//    // Now move the file to the ER File location
//    relocateFileToERFolder()
//
//
//    // Last step, tell ER about the file we just uploaded
//    var procController = new StoreProcController_ACC()
//    var failure = procController.addFileToErImportLog(_selectedWebFile.Name,
//        _fileTypeList.getIdFromName(_selectedFileType),
//        _newInputFile.NameSansExtension,
//        _newInputFile.Extension,
//        _commentsValue,
//        _tabValidationSuccessfull,
//        listToString(_tabsInFileForUpload),
//        CurrentUserUtil.CurrentUser.User.DisplayName,
//        CurrentUserUtil.CurrentUser.User.Contact.EmailAddress1)
//    if (failure != null and !failure.Empty) {
//      // Ohh so close,  But there had to be an error didnt there
//      throw new DisplayableException(failure)
//    }
//
//    // Success Message
//    if (_deletedOldFile) {
//      _successMessage = DisplayKey.get("Web.Rating.File.Upload.Successfull.With.Override_ACC")
//    } else {
//      _successMessage = DisplayKey.get("Web.Rating.File.Upload.Successfull_ACC")
//    }
//  }

  function listToString(providedTabs : List<String>) : String {
    var sb = new StringBuffer()

    for (name in providedTabs) {
      sb.append(name + ",")
    }
    sb.setLength(sb.length() - 1);
    return sb.toString()
  }

  /**
   * Get this files extension
   *
   * @return String  extension
   */
  public property get FileExtension() : String {
    return getFileExtension(_selectedWebFile)
  }

  /**
   * Get this files extension
   * @return  String  extension
   */
  public function getFileExtension(file : WebFile) : String  {
    var name = _selectedWebFile.getName()
    return  _selectedWebFile.getName().substring(name.lastIndexOf(".") + 1)
  }

  /**
   * Is this files extension they correct type for the report type the user selected.
   * Do you the ER DB and get a list of the allowable file extension types.
   */
  public function checkFileExtension()  {

    var extensions = this.FileTypeList.getExtensionsFromName(_selectedFileType).split(",")

    if ( !extensions.contains(FileExtension.toLowerCase()) ) {
      throw new DisplayableException(DisplayKey.get("Web.Rating.Errors.Incorrect.File.Extension_ACC", Arrays.toString(extensions)))
    }
  }

  /**
   * Relocate the file for ER to process
   */
  function relocateFileToERFolder() {
    try {
      var file = new File(ErFileDestination + truncateName(_newInputFile.NameSansExtension) + "." + _newInputFile.Extension)
      FileUtils.copyFile(_newInputFile, file)
      file.setReadable(true, false)
      file.setWritable(true, false)
      file.setExecutable(true, false)
    } catch (e : Exception) {
      throw new DisplayableException(DisplayKey.get("Web.Rating.Errors.File.Copy"))
    }
  }

  /**
   * Delete old file before ER can process
   */
  function deleteFileFromERFolder(filename : String) {
    try {
      FileUtils.forceDelete(new File(ErFileDestination + filename))
    } catch (e : IOException) {
      throw new DisplayableException(DisplayKey.get("Web.Rating.Errors.File.Delete"))
    }
  }

  /**
   * Work out the final destination directory path
   *
   * @return String Path
   */
  property get ErFileDestination() : String {
    var destination = new ERRetrieveTargetfolder_ACC().retrieveLocation()
    return destination + File.separator + _selectedFileType + File.separator
  }

  /**
   * Truncate the file name to fit into the SQL table
   */
  function truncateName(fullName : String) : String {
    var newName =  _newInputFile.NameSansExtension
    if (newName.length > _maxFileNameLength) {
      newName = newName.substring(0, _maxFileNameLength)
    }
    return newName
  }

  /**
   * The cancel button has been cancelled
   */
  function doCancel() {
    _selectedWebFile = null
    _selectedFileType = null
    _commentsValue = null
    _deletedOldFile = false
    _successMessage = ""
  }

  /**
   * Is this files too large.
   * The size will be checked against the ER Configuration 'UploadFileSizeLimitMB'.
   */
//  public function checkFileSize()  {
//    var maxFileSize = new ERConfigurationUtil_ACC().RetrieveERConfigurationIntegerValue("UploadFileSizeLimitMB")
//    if (maxFileSize != null) {
//      var fileSizeInMB = _selectedWebFile.Size / (1024.0 * 1024.0)
//      if (fileSizeInMB > maxFileSize) {
//        throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.File.Uploads.ExceedMaxFileSize_ACC", maxFileSize))
//      }
//    }
//  }
}