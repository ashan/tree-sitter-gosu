package gw.plugin.billing.bc1000

uses gw.billing.ChargeBreakdownCriterion
uses wsi.remote.gw.webservice.bc.bc1000.entity.anonymous.elements.BreakdownCriteriaInfo_TranslatedNames
uses wsi.remote.gw.webservice.bc.bc1000.entity.types.complex.BreakdownCriteriaInfo

enhancement BreakdownCriteriaInfoEnhancement : BreakdownCriteriaInfo {
  function sync(criterionDefinition : ChargeBreakdownCriterion){
    this.Code = criterionDefinition.Code
    this.Name = criterionDefinition.Name
    criterionDefinition.Translations.each(\translation -> {
      var translatedName = new BreakdownCriteriaInfo_TranslatedNames() {
        :LanguageCode = translation.LanguageType.Code,
        :Translation = translation.Value
      }
      this.TranslatedNames.add(translatedName)
    })
  }
}
