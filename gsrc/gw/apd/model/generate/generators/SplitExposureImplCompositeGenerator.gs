package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class SplitExposureImplCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, exposure : APDExposure) {
    var subPackage : String[] = {exposure.Coverable.LinePrefixLowerCase}
    var filePrefix = exposure.QualifiedName
    _generators = {
        new APDExposureBasedGenerator(context, exposure, Templates.SPLIT_EXPOSURE,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}SplittableBase.gs"
        ),
        new APDExposureBasedGenerator(context, exposure, Templates.SPLIT_EXPOSURE_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}Splittable.gs"
        )
    }
  }

}

