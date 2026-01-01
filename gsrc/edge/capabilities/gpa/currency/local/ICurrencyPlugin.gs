package edge.capabilities.gpa.currency.local

uses gw.api.financials.CurrencyAmount
uses edge.capabilities.gpa.currency.dto.CurrencyDTO

interface ICurrencyPlugin {

  public function toDTO(aCurrencyAmount : CurrencyAmount) : CurrencyDTO

}
