package nz.co.acc.integration.ir.inbound.transformer

uses nz.co.acc.integration.ir.inbound.transformer.payload.CREGPayloadBuilder

class CREGFileRecord implements IRFileRecord {
  var recordType : String
  var changeType : String
  var accNumber : String
  var employerOrSelfEmployedName : String
  var tradeName : String
  var irdSortKey : String
  var title : String
  var firstNames : String
  var lastName : String
  var postalAddressLine1 : String
  var postalAddressLine2 : String
  var postalAddressPostCode : String
  var postalAddressStatusIndicator : String
  var physicalAddressLine1 : String
  var physicalAddressLine2 : String
  var physicalAddressPostCode : String
  var physicalAddressStatusIndicator : String
  var taxTypeStartDate : String
  var taxTypeEndDate : String
  var taxTypeEndReason : String
  var entityType : String
  var entityClass : String
  var parentAccNumber : String
  var businessPhoneNumber : String
  var businessCellNumber : String // was businessFaxNumber
  var natureOfBusiness : String
  var employerClassification : String
  var irdReferenceNumber : String
  var agentCode : String
  var dateOfBirth : String
  var homePhoneNumber : String
  var postalAddressChangeDate : String
  var physicalAddressChangeDate : String
  var nzbn : String
  var email : String

  public construct() {
  }

  public construct(line : String) {
    validateRecordType(line)

    var reader = new FixedWidthFieldReader(line)
    recordType = reader.nextString(1)
    changeType = reader.nextString(1)
    accNumber = reader.nextString(8)
    employerOrSelfEmployedName = reader.nextString(74)
    tradeName = reader.nextString(74)
    irdSortKey = reader.nextString(30)
    title = reader.nextString(6)
    firstNames = reader.nextString(37)
    lastName = reader.nextString(31)
    postalAddressLine1 = reader.nextString(30)
    postalAddressLine2 = reader.nextString(30)
    postalAddressPostCode = reader.nextString(4)
    postalAddressStatusIndicator = reader.nextString(1)
    physicalAddressLine1 = reader.nextString(30)
    physicalAddressLine2 = reader.nextString(30)
    physicalAddressPostCode = reader.nextString(4)
    physicalAddressStatusIndicator = reader.nextString(1)
    taxTypeStartDate = reader.nextString(8)
    taxTypeEndDate = reader.nextString(8)
    taxTypeEndReason = reader.nextString(2)
    entityType = reader.nextString(1)
    entityClass = reader.nextString(2)
    parentAccNumber = reader.nextString(8)
    businessPhoneNumber = reader.nextString(13)
    businessCellNumber = reader.nextString(13)
    natureOfBusiness = reader.nextString(50)
    employerClassification = reader.nextString(1)
    irdReferenceNumber = reader.nextString(13)
    agentCode = reader.nextString(8)
    dateOfBirth = reader.nextString(8)
    homePhoneNumber = reader.nextString(13)
    postalAddressChangeDate = reader.nextString(8)
    physicalAddressChangeDate = reader.nextString(8)
    nzbn = reader.nextString(13)
    email = reader.nextString(50)

    generatePayload()
  }

  private function validateRecordType(line : String) {
    var firstChar = line.charAt(0)
    if (firstChar != InboundIRConstants.CREG_RECORD_TYPE) {
      throw new IRLoadException("Invalid record type: '${firstChar}'")
    }
  }

  override property get AccNumber() : String {
    return accNumber
  }

  override property get RecordType() : IRExtRecordType_ACC {
    return IRExtRecordType_ACC.TC_CREG1
  }

  override function generatePayload() : String {
    var builder = new CREGPayloadBuilder()
    var properCaseUtil = new ProperCaseUtil()
    var isIndividualEntityType = entityType == "I"
    
    builder.setBusinessACCNumber(accNumber)
    builder.setBusinessEmail(email)
    builder.setBusinessEmployerClassification(employerClassification)
    builder.setBusinessEntityClass(entityClass)
    builder.setBusinessEntityType(entityType)
    builder.setBusinessIRDRefNumber(irdReferenceNumber)
    builder.setBusinessName(properCaseUtil.capitalize(employerOrSelfEmployedName, !isIndividualEntityType))
    builder.setBusinessNatureOfBusiness(natureOfBusiness)
    builder.setBusinessNZBN(nzbn)
    builder.setBusinessPhoneNumber(businessPhoneNumber)
    builder.setBusinessCellNumber(businessCellNumber)
    builder.setBusinessTaxTypeEndDate(InboundIRUtil.getValidIRDate(taxTypeEndDate))
    builder.setBusinessTaxTypeEndReason(taxTypeEndReason)
    builder.setBusinessTaxTypeStartDate(InboundIRUtil.getValidIRDate(taxTypeStartDate))
    builder.setBusinessTradeName(properCaseUtil.capitalize(tradeName, true))
    builder.setControlAgentCode(agentCode)
    builder.setControlChangeType(changeType)
    builder.setControlIRDSortKey(irdSortKey)
    builder.setControlRecordType(recordType)
    builder.setIndividualDateOfBirth(InboundIRUtil.getValidIRDate(dateOfBirth))
    builder.setIndividualFirstNames(properCaseUtil.capitalize(firstNames, false))
    builder.setIndividualLastName(properCaseUtil.capitalize(lastName, false))
    builder.setIndividualPhoneNumber(homePhoneNumber)
    builder.setIndividualTitle(properCaseUtil.capitalize(title, false))
    builder.setParentACCNumber(parentAccNumber)
    builder.setPhysicalAddressLine1(properCaseUtil.capitalize(physicalAddressLine1, false))
    builder.setPhysicalAddressLine2(properCaseUtil.capitalize(physicalAddressLine2, false))
    builder.setPhysicalAddressChangeDate(InboundIRUtil.getValidIRDate(physicalAddressChangeDate))
    builder.setPhysicalAddressPostCode(physicalAddressPostCode)
    builder.setPhysicalAddressStatusIndicatorFlag(physicalAddressStatusIndicator)
    builder.setPostalAddressLine1(properCaseUtil.capitalize(postalAddressLine1, false))
    builder.setPostalAddressLine2(properCaseUtil.capitalize(postalAddressLine2, false))
    builder.setPostalAddressChangeDate(InboundIRUtil.getValidIRDate(postalAddressChangeDate))
    builder.setPostalAddressPostCode(postalAddressPostCode)
    builder.setPostalAddressStatusIndicatorFlag(postalAddressStatusIndicator)

    return builder.PropertiesString
  }

}