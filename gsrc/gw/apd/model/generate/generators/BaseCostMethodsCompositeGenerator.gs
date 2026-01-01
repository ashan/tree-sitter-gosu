package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class BaseCostMethodsCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, productLine : APDProductLine) {
    var subPackage : String[] = {productLine.LinePrefixLowerCase, FINANCIALS}
    var filePrefix = productLine.LinePrefix
    _generators = {
        new APDProductLineBasedGenerator(context, productLine, Templates.BASE_COST_METHODS,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CostMethods.gs"
        ),
        new APDProductLineBasedGenerator(context, productLine, Templates.BASE_COST_METHODS_IMPL,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CostMethodsImplBase.gs"
        ),
        new APDProductLineBasedGenerator(context, productLine, Templates.BASE_COST_METHODS_IMPL_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CostMethodsImpl.gs"
        )
    }

  }

}