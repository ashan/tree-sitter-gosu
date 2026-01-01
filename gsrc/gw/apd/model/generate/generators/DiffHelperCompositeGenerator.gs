package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class DiffHelperCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, productLine : entity.APDProductLine) {
    var subPackage : String[] = {productLine.LinePrefixLowerCase}
    var filePrefix = productLine.LinePrefix
    _generators = {
        new APDProductLineBasedGenerator(context, productLine, Templates.DIFF_HELPER,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}DiffHelperBase.gs"
        ),
        new APDProductLineBasedGenerator(context, productLine, Templates.DIFF_HELPER_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}DiffHelper.gs"
        )
    }
  }

}