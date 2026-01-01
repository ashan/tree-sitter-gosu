package gw.apd.model.generate.generators

uses entity.APDCoverable
uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class ExclusionAdapterCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, coverable : APDCoverable) {
    var subPackage : String[] = {coverable.LinePrefixLowerCase}
    var filePrefix = coverable.QualifiedName
    _generators = {
        new APDCoverableBasedGenerator(context, coverable, Templates.EXCLUSION_ADAPTER,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}ExclusionAdapterBase.gs"
        ),
        new APDCoverableBasedGenerator(context, coverable, Templates.EXCLUSION_ADAPTER_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}ExclusionAdapter.gs"
        )
    }
  }

}