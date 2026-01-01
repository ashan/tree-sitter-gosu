package edge.capabilities.quote.streamlined.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required
uses java.lang.Integer
uses edge.aspects.validation.annotations.Augment
uses edge.capabilities.address.dto.AddressDTO
uses edge.capabilities.quote.lob.dto.DraftLobDataDTO
uses edge.aspects.validation.annotations.Email
uses edge.aspects.validation.Validation
uses edge.el.Expr
uses edge.aspects.validation.annotations.Ensure

class StreamlinedQuoteDTO {
  @JsonProperty
  var _tempID : Integer as TempID

  @JsonProperty @Required
  var _year : Integer as Year

  @JsonProperty @Required
  var _make : String as Make

  @JsonProperty @Required
  var _model : String as Model

  @JsonProperty
  @Augment({"AddressLine1", "City", "State", "PostalCode"}, {new Required()})
  var _policyAddress : AddressDTO as PolicyAddress

  @JsonProperty @Required @Email
  var _email : String as Email

  @JsonProperty @Required
  var _age : Integer as Age

  @JsonProperty
  var _vin : String as Vin

  @JsonProperty @Required @Ensure(Expr.eq(Validation.VALUE, true),
      Expr.translate("Edge.Web.Api.Quote.streamlined.CheckTermsAndConditions", {}))
  var _termsChecked : Boolean as TermsChecked

  @JsonProperty @Required
  var _productCode : String as ProductCode

  /** Line-of-business extensions for the draft object. Only used for quoting the submission, not passed from frontend. */
  @JsonProperty
  var _lobs : DraftLobDataDTO as Lobs

  /** The term type of the submission e.g. Annual, HalfYear, Other, etc. */
  @JsonProperty
  var _termType : typekey.TermType as TermType

  /** Existing SLQ submission number */
  @JsonProperty
  var _submissionNumber : String as SubmissionNumber
}
