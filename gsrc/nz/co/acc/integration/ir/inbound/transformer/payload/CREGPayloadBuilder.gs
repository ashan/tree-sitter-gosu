package nz.co.acc.integration.ir.inbound.transformer.payload

class CREGPayloadBuilder extends AbstractPayloadBuilder {

  function setBusinessACCNumber(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.ACCNumber", value)
  }

  function setBusinessEmail(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.Email", value)
  }

  function setBusinessEmployerClassification(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.EmployerClassification", value)
  }

  function setBusinessEntityClass(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.EntityClass", value)
  }

  function setBusinessEntityType(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.EntityType", value)
  }

  function setBusinessIRDRefNumber(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.IRDRefNumber", value)
  }

  function setBusinessName(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.Name", value)
  }

  function setBusinessNatureOfBusiness(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.NatureOfBusiness", value)
  }

  function setBusinessNZBN(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.NZBN", value)
  }

  function setBusinessPhoneNumber(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.PhoneNumber", value)
  }

  function setBusinessCellNumber(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.FaxNumber", value)
  }

  function setBusinessTaxTypeEndDate(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.TaxTypeEndDate", value)
  }

  function setBusinessTaxTypeEndReason(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.TaxTypeEndReason", value)
  }

  function setBusinessTaxTypeStartDate(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.TaxTypeStartDate", value)
  }

  function setBusinessTradeName(value : String) {
    appendIfNotBlank("CustomerUpdate.Business.TradeName", value)
  }

  function setControlAgentCode(value : String) {
    appendIfNotBlank("CustomerUpdate.Control.AgentCode", value)
  }

  function setControlChangeType(value : String) {
    appendIfNotBlank("CustomerUpdate.Control.ChangeType", value)
  }

  function setControlIRDSortKey(value : String) {
    appendIfNotBlank("CustomerUpdate.Control.IRDSortKey", value)
  }

  function setControlRecordType(value : String) {
    appendIfNotBlank("CustomerUpdate.Control.RecordType", value)
  }

  function setIndividualDateOfBirth(value : String) {
    appendIfNotBlank("CustomerUpdate.Individual.DateOfBirth", value)
  }

  function setIndividualFirstNames(value : String) {
    appendIfNotBlank("CustomerUpdate.Individual.FirstNames", value)
  }

  function setIndividualLastName(value : String) {
    appendIfNotBlank("CustomerUpdate.Individual.LastName", value)
  }

  function setIndividualPhoneNumber(value : String) {
    appendIfNotBlank("CustomerUpdate.Individual.PhoneNumber", value)
  }

  function setIndividualTitle(value : String) {
    appendIfNotBlank("CustomerUpdate.Individual.Title", value)
  }

  function setParentACCNumber(value : String) {
    appendIfNotBlank("CustomerUpdate.Parent.ACCNumber", value)
  }

  function setPhysicalAddressLine1(value : String) {
    appendIfNotBlank("CustomerUpdate.PhysicalAddress.AddressLine1", value)
  }

  function setPhysicalAddressLine2(value : String) {
    appendIfNotBlank("CustomerUpdate.PhysicalAddress.AddressLine2", value)
  }

  function setPhysicalAddressChangeDate(value : String) {
    appendIfNotBlank("CustomerUpdate.PhysicalAddress.ChangeDate", value)
  }

  function setPhysicalAddressPostCode(value : String) {
    appendIfNotBlank("CustomerUpdate.PhysicalAddress.PostCode", value)
  }

  function setPhysicalAddressStatusIndicatorFlag(value : String) {
    appendIfNotBlank("CustomerUpdate.PhysicalAddress.StatusIndicatorFlag", value)
  }

  function setPostalAddressLine1(value : String) {
    appendIfNotBlank("CustomerUpdate.PostalAddress.AddressLine1", value)
  }

  function setPostalAddressLine2(value : String) {
    appendIfNotBlank("CustomerUpdate.PostalAddress.AddressLine2", value)
  }

  function setPostalAddressChangeDate(value : String) {
    appendIfNotBlank("CustomerUpdate.PostalAddress.ChangeDate", value)
  }

  function setPostalAddressPostCode(value : String) {
    appendIfNotBlank("CustomerUpdate.PostalAddress.PostCode", value)
  }

  function setPostalAddressStatusIndicatorFlag(value : String) {
    appendIfNotBlank("CustomerUpdate.PostalAddress.StatusIndicatorFlag", value)
  }

}