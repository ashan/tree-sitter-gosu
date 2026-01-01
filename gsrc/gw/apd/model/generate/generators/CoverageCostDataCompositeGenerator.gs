package gw.apd.model.generate.generators

uses entity.APDCoverable
uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class CoverageCostDataCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, coverable : APDCoverable, coverableBasis : Set<APDCoverable>, exposureBasis : Set<APDExposure>) {
    var subPackage : String[] = {coverable.LinePrefixLowerCase, RATING}
    var filePrefix = coverable.QualifiedName
    _generators = {
        new APDCoverableWithBasisBasedGenerator(context, coverable, coverableBasis, exposureBasis, Templates.COVERAGE_COST_DATA,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CovCostDataBase.gs"
        ),
        new APDCoverableWithBasisBasedGenerator(context, coverable, coverableBasis, exposureBasis, Templates.COVERAGE_COST_DATA_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CovCostData.gs"
        )
    }
  }

}