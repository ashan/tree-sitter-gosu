package gw.apd.model.generate.generators

uses entity.APDCoverable
uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class ConditionMatcherCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, coverable : APDCoverable) {
    var subPackage : String[] = {coverable.LinePrefixLowerCase}
    var filePrefix = coverable.QualifiedName
    _generators = {
        new APDCoverableBasedGenerator(context, coverable, Templates.CONDITION_MATCHER,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CondMatcherBase.gs"
        ),
        new APDCoverableBasedGenerator(context, coverable, Templates.CONDITION_MATCHER_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CondMatcher.gs"
        )
    }
  }

}