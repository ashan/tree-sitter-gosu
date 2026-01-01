package nz.co.acc.plm.integration.files.inbound.validation

uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.xml.XmlElement
uses nz.co.acc.common.integration.files.inbound.InboundFileValidator
uses nz.co.acc.common.integration.files.inbound.utils.InboundFileValidationResponse
uses nz.co.acc.common.integration.files.inbound.utils.InboundUtility

uses java.nio.file.Path

/**
 * Created by Nithy on 13/02/2017.
 */
class GNAUpdateFileValidation  extends InboundFileValidator {

  private static final var DATE_POSTED_FORMAT = "yyMMMdd"
  private static final var FILE_DATE_FORMAT = "dd MMMM yyyy"
  private static final var ROOT_ELEMENT_ACC_STANDARD_HEADER = "ACCStandardHeader"
  private static final var GNA = "GNA"
  private static final var ELEMENT_GNA_HEADER = "GNAHeader"
  private static final var ELEMENT_CREATION_DATE = "creation_date"
  private static final var ELEMENT_RECORD_COUNT = "record_count"
  private static final var ELEMENT_GNA_UPDATE = "GNAUpdate"
  private static final var ELEMENT_ACC_STANDARD_TRAILER = "ACCStandardTrailer"

  private var gnaUpdateXML : XmlElement
  private var fileName : String as FileName
  private var recordCount=0
  private var accHeader : XmlElement
  private var gnaHeader : List<XmlElement>
  private var gnaDetail : List<XmlElement>
  private var gnaTail : List<XmlElement>

  construct(filePath: Path) {
    super(filePath)
  }

  override function hasErrors(): List<String> {
    this.addError(this.checkIfEmpty())
    extractFileName()
    parseXML()
    return this._errors
  }

  function parseXML(){
    try {
      gnaUpdateXML = XmlElement.parse(this._filePath.toFile())
    }catch(ex : Exception){
      // This is to capture the enumeration validation of version numbers as it happens during parsing
      StructuredLogger.INTEGRATION_FILE.error_ACC(this.getClass().getCanonicalName() + InboundFileValidationResponse.INVALID_VERSION + " in : " + fileName)
      this.addError(InboundFileValidationResponse.INVALID_VERSION.toString())
      gnaUpdateXML=null
    }
    if(gnaUpdateXML!=null) {
      accHeader = gnaUpdateXML.$Children.singleWhere(\el -> el.$QName.LocalPart == ROOT_ELEMENT_ACC_STANDARD_HEADER.toString())
      gnaHeader = gnaUpdateXML.$Children.where(\el -> el.$QName.LocalPart == ELEMENT_GNA_HEADER.toString())
      gnaDetail = gnaUpdateXML.$Children.where(\el -> el.$QName.LocalPart == ELEMENT_GNA_UPDATE.toString())
      gnaTail = gnaUpdateXML.$Children.where(\el -> el.$QName.LocalPart == ELEMENT_ACC_STANDARD_TRAILER.toString())

      this.addError(this.checkFileName())
      this.addError(this.checkCreationDate())
      this.addError(this.checkRecordCount())
    }
  }

  function extractFileName(){
    fileName = this._filePath.toFile().getName()
  }

  function checkFileName():String{
    if(!fileName.startsWith(GNA.toString())){
      StructuredLogger.INTEGRATION_FILE.error_ACC(this.getClass().getCanonicalName() + InboundFileValidationResponse.INVALID_GNA_FILE_FORMAT + " in : " + fileName)
      return InboundFileValidationResponse.INVALID_GNA_FILE_FORMAT.toString()
    }
    return null
  }


  function checkCreationDate():String{

    var fileDate = ""
    var validFileDate = Date.Now
    var validCreationDate = Date.Now
    var creationDate = ""

    for (attrib in gnaHeader.iterator()) {
      creationDate = attrib.$Children.singleWhere(\elt -> elt.$QName.LocalPart == ELEMENT_CREATION_DATE.toString()).$Text
      recordCount = attrib.$Children.singleWhere(\elt -> elt.$QName.LocalPart == ELEMENT_RECORD_COUNT.toString()).$Text.toInt()
    }

    //Check that filename date YYMMMDD matches "creation date"
    fileDate = fileName.substring(4, 11)

    try {
      validFileDate = InboundUtility.stringToDate(fileDate, DATE_POSTED_FORMAT)
      validCreationDate = InboundUtility.stringToDate(creationDate, FILE_DATE_FORMAT)
      if(validFileDate!=validCreationDate){
        StructuredLogger.INTEGRATION_FILE.error_ACC(this.getClass().getCanonicalName() + InboundFileValidationResponse.CREATED_DATE_NOMATCH + " in : " + fileName)
        this.addError(InboundFileValidationResponse.CREATED_DATE_NOMATCH.toString())
      }
    }catch(e : Exception){
      StructuredLogger.INTEGRATION_FILE.error_ACC(this.getClass().getCanonicalName() + InboundFileValidationResponse.CREATED_DATE_FORMAT_ERROR + " in : " + fileName)
      this.addError(InboundFileValidationResponse.CREATED_DATE_FORMAT_ERROR.toString())
    }
    return null
  }


  function checkRecordCount():String {

    //Check record count equals  total number of GNA Update records processed
    if(recordCount!=gnaDetail.Count){
      StructuredLogger.INTEGRATION_FILE.error_ACC(this.getClass().getCanonicalName() + InboundFileValidationResponse.NO_OF_RECORDS +" in : " + fileName)
      return(InboundFileValidationResponse.NO_OF_RECORDS.toString())
    }
    return null
  }

}