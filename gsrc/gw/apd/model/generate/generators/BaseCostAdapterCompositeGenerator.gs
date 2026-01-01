package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class BaseCostAdapterCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, productLine : APDProductLine) {
    var subPackage : String[] = {productLine.LinePrefixLowerCase, FINANCIALS}
    var filePrefix = productLine.LinePrefix
    _generators = {
        new APDProductLineBasedGenerator(context, productLine, Templates.BASE_COST_ADAPTER,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CostAdapterBase.gs"
        ),
        new APDProductLineBasedGenerator(context, productLine, Templates.BASE_COST_ADAPTER_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CostAdapter.gs"
        )
    }
  }

}