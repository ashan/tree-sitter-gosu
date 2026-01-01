package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class ChargeBreakdownCategoryLookupCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, productLine : APDProductLine) {
    var subPackage : String[] = {productLine.LinePrefixLowerCase}
    var filePrefix = productLine.CodeIdentifier
    _generators = {
        new APDProductLineBasedGenerator(context, productLine, Templates.CHARGE_BREAKDOWN_CATEGORY_LOOKUP,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}ChargeBreakdownCategoryLookupBase.gs"
        ),
        new APDProductLineBasedGenerator(context, productLine, Templates.CHARGE_BREAKDOWN_CATEGORY_LOOKUP_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}ChargeBreakdownCategoryLookup.gs"
        )
    }
  }

}