package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class RateRoutineConfigCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, productLine : APDProductLine) {
    var subPackage : String[] = {productLine.LinePrefixLowerCase, RATING}
    var filePrefix = productLine.LinePrefix
    _generators = {
        new APDProductLineBasedGenerator(context, productLine, Templates.RATE_ROUTINE_CONFIG,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}RateRoutineConfigBase.gs"
        ),
        new APDProductLineBasedGenerator(context, productLine, Templates.RATE_ROUTINE_CONFIG_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}RateRoutineConfig.gs"
        )
    }
  }

}