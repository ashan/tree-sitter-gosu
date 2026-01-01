package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class RatingEngineCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, productLine : APDProductLine) {
    var subPackage : String[] = {productLine.LinePrefixLowerCase, RATING}
    var filePrefix = productLine.LinePrefix
    _generators = {
      new APDProductLineBasedGenerator(context, productLine, Templates.RATING_ENGINE,
          BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}RatingEngineBase.gs"
      ),
      new APDProductLineBasedGenerator(context, productLine, Templates.RATING_ENGINE_EXT,
          EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}RatingEngine.gs"
      )
    }
  }

}