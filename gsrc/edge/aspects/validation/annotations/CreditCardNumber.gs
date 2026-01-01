package edge.aspects.validation.annotations

uses java.util.HashMap
uses edge.metadata.annotation.IMetaMultiFactory
uses edge.aspects.validation.Validation
uses edge.aspects.validation.ValidationFunctions
uses edge.el.Expr
uses edge.aspects.validation.dto.ValidationRuleDTO

class CreditCardNumber implements IMetaMultiFactory {


  final var codeMap :  HashMap<String, int> = {
      CreditCardIssuer.TC_AMEX.Code -> 15,
      CreditCardIssuer.TC_MASTERCARD.Code -> 16,
      CreditCardIssuer.TC_DISCOVER.Code -> 16,
      CreditCardIssuer.TC_VISA.Code -> 16,
      CreditCardIssuer.TC_DINERSCLUB.Code -> 14
  }
  final var issuer = Expr.getProperty("CreditCardIssuer.Code", Validation.PARENT)
  final var requiredLength = Expr.call(ValidationFunctions#getFromMap(java.util.HashMap<Object,Object>,Object), {Expr.dtoConst(codeMap), issuer})
  override function getState(): Object[] {
    var creditCardNumberLength = Validation.strLength(Validation.VALUE)
    return {new ValidationRuleDTO(
        Expr.isNot(Expr.lessThan(creditCardNumberLength, requiredLength)),
            Expr.translate("Edge.Web.Api.Model.CreditCardNumber", {}))}
  }

}
