package gw.apd.model.generate.generators

uses entity.APDCoverable
uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class CoverableCostMethodsImplCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, coverable : APDCoverable) {
    var subPackage : String[] = {coverable.LinePrefixLowerCase, FINANCIALS}
    var filePrefix = coverable.QualifiedName
    _generators = {
        new APDCoverableBasedGenerator(context, coverable, Templates.COVERABLE_COST_METHODS_IMPL,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CostMethodsImplBase.gs"
        ),
        new APDCoverableBasedGenerator(context, coverable, Templates.COVERABLE_COST_METHODS_IMPL_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}CostMethodsImpl.gs"
        )
    }
  }

}