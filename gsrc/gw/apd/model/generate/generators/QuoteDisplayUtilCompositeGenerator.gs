package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class QuoteDisplayUtilCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, productLine : APDProductLine) {
    var subPackage : String[] = {productLine.LinePrefixLowerCase, FINANCIALS}
    var filePrefix = productLine.LinePrefix
    _generators = {
        new APDProductLineBasedGenerator(context, productLine, Templates.LINE_QUOTE_DISPLAY_UTIL,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}QuoteDisplayUtilBase.gs"
        ),
        new APDProductLineBasedGenerator(context, productLine, Templates.LINE_QUOTE_DISPLAY_UTIL_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}QuoteDisplayUtil.gs"
        )
    }
  }

}