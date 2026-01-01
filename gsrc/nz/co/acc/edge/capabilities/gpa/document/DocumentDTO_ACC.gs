package nz.co.acc.edge.capabilities.gpa.document

uses edge.capabilities.gpa.document.dto.DocumentDTO
uses edge.jsonmapper.JsonProperty

/**
 * Created by lee.teoh on 26/06/2017.
 */
class DocumentDTO_ACC extends DocumentDTO {

  @JsonProperty
  var _accountNumber : String as AccountNumber

  @JsonProperty
  var _invoiceNumber : String as InvoiceNumber

  @JsonProperty
  var _createdDate : Date as CreatedDate
}