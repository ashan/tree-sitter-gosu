package gw.apd.model.generate.generators

uses entity.APDCoverable
uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class ScheduleExclItemExclMatcherCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, coverable : APDCoverable) {
    var subPackage : String[] = {coverable.LinePrefixLowerCase}
    var filePrefix = coverable.QualifiedName
    _generators = {
        new APDCoverableBasedGenerator(context, coverable, Templates.SCH_EXCL_ITEM_EXCL_MATCHER,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}SchExclItemExclMatcherBase.gs"
        ),
        new APDCoverableBasedGenerator(context, coverable, Templates.SCH_EXCL_ITEM_EXCL_MATCHER_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}SchExclItemExclMatcher.gs"
        )
    }
  }

}