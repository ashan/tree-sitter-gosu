package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class PolicyLineMethodsCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, productLine : entity.APDProductLine) {
    var subPackage : String[] = {productLine.LinePrefixLowerCase}
    var filePrefix = productLine.LinePrefix
    _generators = {
        new APDProductLineBasedGenerator(context, productLine, Templates.POLICY_LINE_METHODS,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}PolicyLineMethodsBase.gs"
        ),
        new APDProductLineBasedGenerator(context, productLine, Templates.POLICY_LINE_METHODS_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}PolicyLineMethods.gs"
        )
    }
  }

}