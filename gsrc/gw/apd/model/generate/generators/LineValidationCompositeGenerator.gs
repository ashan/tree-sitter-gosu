package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class LineValidationCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, productLine : entity.APDProductLine) {
    var subPackage : String[] = {productLine.LinePrefixLowerCase}
    var filePrefix = productLine.LinePrefix
    _generators = {
        new APDProductLineBasedGenerator(context, productLine, Templates.LINE_VALIDATION,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}LineValidationBase.gs"
        ),
        new APDProductLineBasedGenerator(context, productLine, Templates.LINE_VALIDATION_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}LineValidation.gs"
        )
    }
  }

}