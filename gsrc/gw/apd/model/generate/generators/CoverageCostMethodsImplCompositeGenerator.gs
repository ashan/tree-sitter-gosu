package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates
uses entity.APDCoverable

@Export
class CoverageCostMethodsImplCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, coverable : APDCoverable, coverableBasis : Set<APDCoverable>, exposureBasis : Set<APDExposure>) {
    var subPackage : String[] = {coverable.LinePrefixLowerCase, FINANCIALS}
    var filePrefix = coverable.QualifiedName
    _generators = {
        new APDCoverableWithBasisBasedGenerator(context, coverable, coverableBasis, exposureBasis, Templates.COVERAGE_COST_METHODS_IMPL,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CovCostMethodsImplBase.gs"
        ),
        new APDCoverableBasedGenerator(context, coverable, Templates.COVERAGE_COST_METHODS_IMPL_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CovCostMethodsImpl.gs"
        )
    }
  }

}