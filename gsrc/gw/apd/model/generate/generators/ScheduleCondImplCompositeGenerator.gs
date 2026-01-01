package gw.apd.model.generate.generators

uses entity.APDCoverable
uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class ScheduleCondImplCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, coverable : APDCoverable) {
    var subPackage : String[] = {coverable.LinePrefixLowerCase}
    var filePrefix = coverable.QualifiedName
    _generators = {
        new APDCoverableBasedGenerator(context, coverable, Templates.SCH_CONDITION_IMPL,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}ScheduleCondImplBase.gs"
        ),
        new APDCoverableBasedGenerator(context, coverable, Templates.SCH_CONDITION_IMPL_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}ScheduleCondImpl.gs"
        )
    }
  }

}