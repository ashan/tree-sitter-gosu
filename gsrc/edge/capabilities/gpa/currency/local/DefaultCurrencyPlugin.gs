package edge.capabilities.gpa.currency.local

uses gw.api.financials.CurrencyAmount
uses edge.capabilities.gpa.currency.dto.CurrencyDTO
uses edge.di.annotations.ForAllGwNodes
uses gw.api.util.CurrencyUtil

class DefaultCurrencyPlugin implements ICurrencyPlugin {

  @ForAllGwNodes
  construct(){}

  override function toDTO(aCurrencyAmount: CurrencyAmount): CurrencyDTO {
    final var dto = new CurrencyDTO()
    dto.Amount = aCurrencyAmount.Amount == null ? 0 : aCurrencyAmount.Amount
    if(aCurrencyAmount.Currency == null){
      dto.Currency = CurrencyUtil.getDefaultCurrency()
    } else {
      dto.Currency = aCurrencyAmount.Currency
    }
    return dto
  }
}
