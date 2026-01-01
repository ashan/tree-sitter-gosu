package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class ExposureSyncableAdapterCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, exposure : APDExposure) {
    var subPackage : String[] = {exposure.Coverable.LinePrefixLowerCase}
    var filePrefix = exposure.QualifiedName
    _generators = {
        new APDExposureBasedGenerator(context, exposure, Templates.EXPOSURE_SYNCABLE_ADAPTER,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}SyncableAdapterBase.gs"
        ),
        new APDExposureBasedGenerator(context, exposure, Templates.EXPOSURE_SYNCABLE_ADAPTER_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}SyncableAdapter.gs"
        )
    }
  }

}

