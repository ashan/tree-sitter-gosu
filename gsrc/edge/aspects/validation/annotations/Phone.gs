package edge.aspects.validation.annotations

uses edge.el.dto.ExpressionDTO
uses edge.aspects.validation.Validation
uses edge.el.Expr
uses gw.api.util.PhoneUtil
uses edge.metadata.annotation.IMetaMultiFactory
uses edge.aspects.validation.dto.ValidationRuleDTO
uses gw.api.validation.PhoneValidator_ACC

class Phone implements IMetaMultiFactory {

  private var _countryCode : ExpressionDTO as CountryCode

  construct() {
    _countryCode = Expr.dtoConst(PhoneUtil.getDefaultPhoneCountryCode())
  }

  construct(code :ExpressionDTO) {
    _countryCode = code
  }

  override function getState(): Object[] {
    return {
        new ValidationRuleDTO(
            Expr.call(PhoneValidator_ACC#isPossibleNumber_ACC(String, PhoneCountryCode), {Validation.VALUE, _countryCode}),
            Expr.translate("Edge.Web.Api.Model.Phone", {})
        )
    }
  }
}
