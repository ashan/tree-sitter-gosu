package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class CoverableSyncableAdapterCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, coverable : APDCoverable) {
    var subPackage : String[] = {coverable.LinePrefixLowerCase}
    var filePrefix = coverable.QualifiedName
    _generators = {
        new APDCoverableBasedGenerator(context, coverable, Templates.SYNCABLE_ADAPTER,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}SyncableAdapterBase.gs"
        ),
        new APDCoverableBasedGenerator(context, coverable, Templates.SYNCABLE_ADAPTER_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}SyncableAdapter.gs"
        )
    }
  }

}

