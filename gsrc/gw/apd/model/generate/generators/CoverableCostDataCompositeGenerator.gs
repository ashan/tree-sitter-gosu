package gw.apd.model.generate.generators

uses entity.APDCoverable
uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class CoverableCostDataCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, coverable : APDCoverable, coverableBasis : Set<APDCoverable>, exposureBasis : Set<APDExposure>) {
    var subPackage : String[] = {coverable.LinePrefixLowerCase, RATING}
    var filePrefix = coverable.QualifiedName
    _generators = {
        new APDCoverableWithBasisBasedGenerator(context, coverable, coverableBasis, exposureBasis, Templates.COVERABLE_COST_DATA,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CostDataBase.gs"
        ),
        new APDCoverableWithBasisBasedGenerator(context, coverable, coverableBasis, exposureBasis, Templates.COVERABLE_COST_DATA_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CostData.gs"
        )
    }
  }

}