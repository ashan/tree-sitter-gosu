package nz.co.acc.sampledata

uses com.guidewire.modules.key.SingleFileKey
uses com.guidewire.pl.system.dependency.PLDependencies
uses com.guidewire.pl.web.internaltools.smoketest.SmokeTestSessionMock
uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.pcf.rating.ratebook.RateBookXMLImportUIHelper
uses gw.rating.rtm.domain.migration.RateBookImporter
uses gw.rating.rtm.util.WebFileWrapper
uses gw.sampledata.AbstractSampleDataCollection
uses nz.co.acc.common.sampledata.MockHttpServletRequest_ACC
uses nz.co.acc.common.sampledata.SampleDataWebFile_ACC
uses org.easymock.EasyMock

uses javax.servlet.http.HttpServletResponse

@Export
class RatingData_ACC extends AbstractSampleDataCollection
{
  construct() { }

  /**
   * The name of this sample data collection, for logging and debugging
   */
  public override property get CollectionName() : String {
    return "ACC Rating"
  }
  private static final var ACC_RATE_BOOK_XML_FILE_PATH = "config/sampledata/rating/"
  private static final var ACC_RATE_BOOK_XML_FILE_NAME = "ACCRateBook-1.14-staged.xml"
  private static final var ACC_RATE_BOOK_XML_FILE_CONTENT_TYPE = "text/xml"
  private static final var ACC_RATE_BOOK_CODE = "acc_rating"

  override property get AlreadyLoaded() : boolean {
    return isRateBookLoaded(ACC_RATE_BOOK_CODE)
  }

  private function isRateBookLoaded(rateBookCode : String) : boolean {
    return not (getRateBookQueryResult(rateBookCode).Empty)
  }

  private function getRateBookQueryResult(rateBookCode : String) : IQueryBeanResult<RateBook> {
    return Query<RateBook>.make(RateBook).compare(RateBook#BookCode, Equals, rateBookCode).select()
  }

  override function load() {
    // US2008 - Load ACC ratebook from XML instead of Gosu code.
    var fileKey : SingleFileKey = null
    if (SingleFileKey.get(ACC_RATE_BOOK_XML_FILE_NAME) == null) { // lazy load
      fileKey = new SingleFileKey(ACC_RATE_BOOK_XML_FILE_NAME, ACC_RATE_BOOK_XML_FILE_PATH + ACC_RATE_BOOK_XML_FILE_NAME, null, true, false, "The ACC Rate Book XML")
    } else {
      fileKey = SingleFileKey.get(ACC_RATE_BOOK_XML_FILE_NAME) as SingleFileKey
    }
    var accRateBookFile = fileKey.File
    var webFile = new SampleDataWebFile_ACC(accRateBookFile, ACC_RATE_BOOK_XML_FILE_NAME, ACC_RATE_BOOK_XML_FILE_CONTENT_TYPE)
    var importer = RateBookImporter.create()
    var importFileWrapper = new WebFileWrapper()
    importFileWrapper.File = webFile
    var testPath = ""
    var errorLogs = new String[0]
    var rateBookXMLImportUIHelper = new RateBookXMLImportUIHelper(importer, importFileWrapper, testPath, errorLogs)
    var webController = PLDependencies.getWebController()
    var request = webController.getRequest()
    if (request == null) { // this is being run in a unit test
      // Mock the HTTP request and response
      var mockHttpRequest = new MockHttpServletRequest_ACC()
      var session = new SmokeTestSessionMock()
      mockHttpRequest.Session = session
      var httpResponse = EasyMock.createMock(HttpServletResponse) as HttpServletResponse
      webController.setupRequestInfo(mockHttpRequest, httpResponse)
    }
    rateBookXMLImportUIHelper.doImport(false)

  }

}
