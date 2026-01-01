package edge.capabilities.gpa.job.cancellation.dto

uses edge.capabilities.gpa.job.dto.JobDTO
uses java.util.Date
uses edge.aspects.validation.annotations.Required
uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.FilterByCategory
uses edge.el.Expr
uses edge.aspects.validation.Validation
uses edge.capabilities.gpa.currency.dto.CurrencyDTO

class CancellationDTO extends JobDTO{

  @JsonProperty @Required
  var _source : typekey.CancellationSource as CancellationSource

  @JsonProperty @Required @FilterByCategory("CancellationSource")
  var _cancelReasonCode : typekey.ReasonCode as CancelReasonCode

  @JsonProperty   @Required (Expr.eq(Expr.getProperty("IsTempCancellation",Validation.PARENT), null))
  var _cancellationRefundMethod : typekey.CalculationMethod as CancellationRefundMethod

  @JsonProperty    @Required (Expr.eq(Expr.getProperty("IsTempCancellation",Validation.PARENT), null))
  var _effectiveDate : Date as EffectiveDate

  @JsonProperty
  var _isTempCancellation : Boolean as IsTempCancellation

  @JsonProperty
  var _changeInCost : CurrencyDTO as ChangeInCost

  @JsonProperty
  var _description : String as Description

  @JsonProperty
  var _isInsuredSource : Boolean as IsInsuredSource

  @JsonProperty
  var _isRefund : Boolean as IsRefund

  @JsonProperty
  var _canWithdraw : Boolean as CanWithdraw

  @JsonProperty
  var _canBind : Boolean as CanBind
}
