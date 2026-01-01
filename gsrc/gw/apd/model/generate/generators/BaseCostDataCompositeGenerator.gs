package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class BaseCostDataCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, productLine : APDProductLine) {
    var subPackage : String[] = {productLine.LinePrefixLowerCase, RATING}
    var filePrefix = productLine.LinePrefix
    _generators = {
        new APDProductLineBasedGenerator(context, productLine, Templates.BASE_COST_DATA,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CostData.gs"
        )
    }
  }

}