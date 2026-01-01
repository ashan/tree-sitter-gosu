package gw.apd.model.generate

uses entity.APDClause
uses entity.APDCoverable
uses gw.apd.model.generate.generators.ConditionAdapterCompositeGenerator
uses gw.apd.model.generate.generators.ConditionMatcherCompositeGenerator
uses gw.apd.model.generate.generators.CoverableAdapterCompositeGenerator
uses gw.apd.model.generate.generators.CoverableCostDataCompositeGenerator
uses gw.apd.model.generate.generators.CoverableCostMethodsImplCompositeGenerator
uses gw.apd.model.generate.generators.CoverableSyncableAdapterCompositeGenerator
uses gw.apd.model.generate.generators.CoverageAdapterCompositeGenerator
uses gw.apd.model.generate.generators.CoverageCostDataCompositeGenerator
uses gw.apd.model.generate.generators.CoverageCostMethodsImplCompositeGenerator
uses gw.apd.model.generate.generators.CoverageMatcherCompositeGenerator
uses gw.apd.model.generate.generators.ExclusionAdapterCompositeGenerator
uses gw.apd.model.generate.generators.ExclusionMatcherCompositeGenerator
uses gw.apd.model.generate.generators.ExposureSyncableAdapterCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleCondImplCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleCondItemCondConditionAdapterCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleCondItemCondMatcherCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleCondItemCoverableAdapterCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleCondItemMatcherCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleCovImplCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleCovItemCovCoverageAdapterCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleCovItemCovMatcherCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleCovItemCoverableAdapterCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleCovItemMatcherCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleExclImplCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleExclItemExclExclusionAdapterCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleExclItemExclMatcherCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleExclItemCoverableAdapterCompositeGenerator
uses gw.apd.model.generate.generators.ScheduleExclItemMatcherCompositeGenerator
uses gw.apd.model.generate.generators.SplitCoverableImplCompositeGenerator
uses gw.apd.model.generate.generators.SplitExposureImplCompositeGenerator
uses gw.apd.model.generate.templates.TemplateComparators
uses gw.apd.model.generate.templates.coverable.ClauseName
uses gw.apd.model.generate.templates.coverable.ConditionEntity
uses gw.apd.model.generate.templates.coverable.ConditionLookupDefinitions
uses gw.apd.model.generate.templates.coverable.ConditionLookupEntity
uses gw.apd.model.generate.templates.coverable.ConditionLookups
uses gw.apd.model.generate.templates.coverable.Condition_Existing
uses gw.apd.model.generate.templates.coverable.Condition_New
uses gw.apd.model.generate.templates.coverable.CostEntity
uses gw.apd.model.generate.templates.coverable.CovTermLookupEntity
uses gw.apd.model.generate.templates.coverable.CovTermOptLookupEntity
uses gw.apd.model.generate.templates.coverable.CovTermPackLookupEntity
uses gw.apd.model.generate.templates.coverable.CoverableDefaultValuesEnhancement
uses gw.apd.model.generate.templates.coverable.CoverableEnhancement
uses gw.apd.model.generate.templates.coverable.CoverableList
uses gw.apd.model.generate.templates.coverable.CoverableLookupDefinitions
uses gw.apd.model.generate.templates.coverable.CoverableScheduleCondEntity
uses gw.apd.model.generate.templates.coverable.CoverableScheduleCondItemCondEntity
uses gw.apd.model.generate.templates.coverable.CoverableScheduleCondItemEntity
uses gw.apd.model.generate.templates.coverable.CoverableScheduleConditionLookupDefinitions
uses gw.apd.model.generate.templates.coverable.CoverableScheduleExclEntity
uses gw.apd.model.generate.templates.coverable.CoverableScheduleExclItemExclEntity
uses gw.apd.model.generate.templates.coverable.CoverableScheduleExclItemEntity
uses gw.apd.model.generate.templates.coverable.CoverableScheduleExclusionLookupDefinitions
uses gw.apd.model.generate.templates.coverable.CoverableScheduleLookupDefinitions
uses gw.apd.model.generate.templates.coverable.CoverableModifiableAdapter
uses gw.apd.model.generate.templates.coverable.CoverablePanelSet
uses gw.apd.model.generate.templates.coverable.CoverablePopup
uses gw.apd.model.generate.templates.coverable.CoverableScheduleCovEntity
uses gw.apd.model.generate.templates.coverable.CoverableScheduleCovItemCovEntity
uses gw.apd.model.generate.templates.coverable.CoverableScheduleCovItemEntity
uses gw.apd.model.generate.templates.coverable.CoverableScheduledItemName
uses gw.apd.model.generate.templates.coverable.CoverableUIDisplayProperties
uses gw.apd.model.generate.templates.coverable.CoverageEntity
uses gw.apd.model.generate.templates.coverable.CoverageLookupDefinitions
uses gw.apd.model.generate.templates.coverable.CoverageLookupEntity
uses gw.apd.model.generate.templates.coverable.CoverageLookups
uses gw.apd.model.generate.templates.coverable.Coverage_Existing
uses gw.apd.model.generate.templates.coverable.Coverage_New
uses gw.apd.model.generate.templates.coverable.ExclusionEntity
uses gw.apd.model.generate.templates.coverable.ExclusionLookupDefinitions
uses gw.apd.model.generate.templates.coverable.ExclusionLookupEntity
uses gw.apd.model.generate.templates.coverable.ExclusionLookups
uses gw.apd.model.generate.templates.coverable.Exclusion_Existing
uses gw.apd.model.generate.templates.coverable.Exclusion_New
uses gw.apd.model.generate.templates.coverable.ExposureDefaultValuesEnhancement
uses gw.apd.model.generate.templates.coverable.ExposureEnhancement
uses gw.apd.model.generate.templates.coverable.ExposureEntity
uses gw.apd.model.generate.templates.coverable.ExposureList
uses gw.apd.model.generate.templates.coverable.ExposureName
uses gw.apd.model.generate.templates.coverable.ModifiableAdapter
uses gw.apd.model.generate.templates.coverable.ModifierFactorLookupEntity
uses gw.apd.model.generate.templates.coverable.ModifierLookupDefinitions
uses gw.apd.model.generate.templates.coverable.ModifierLookupEntity
uses gw.apd.model.generate.templates.coverable.ScheduledItemConditionLookupDefinitions
uses gw.apd.model.generate.templates.coverable.ScheduledItemConditionLookups
uses gw.apd.model.generate.templates.coverable.ScheduledItemCondition_Existing
uses gw.apd.model.generate.templates.coverable.ScheduledItemCondition_New
uses gw.apd.model.generate.templates.coverable.ScheduledItemCoverageLookups
uses gw.apd.model.generate.templates.coverable.ScheduledItemCoverage_Existing
uses gw.apd.model.generate.templates.coverable.ScheduledItemCoverage_New
uses gw.apd.model.generate.templates.coverable.ScheduledItemCoverageLookupDefinitions
uses gw.apd.model.generate.templates.coverable.ScheduledItemExclusionLookupDefinitions
uses gw.apd.model.generate.templates.coverable.ScheduledItemExclusionLookups
uses gw.apd.model.generate.templates.coverable.ScheduledItemExclusion_Existing
uses gw.apd.model.generate.templates.coverable.ScheduledItemExclusion_New
uses gw.apd.model.generate.templates.coverable.SplittableCoverableList
uses gw.apd.model.generate.templates.coverable.SplittableExposureList
uses gw.apd.model.generate.templates.coverable.TermLookup
uses gw.apd.model.generate.xsd.clausemodel.ConditionPattern
uses gw.apd.model.generate.xsd.clausemodel.CoveragePattern
uses gw.apd.model.generate.xsd.clausemodel.ExclusionPattern
uses gw.xml.XmlElement

uses java.nio.file.Path

@Export
class CoverableGenerator extends TrackedFileGenerator {

  var _cbl : APDCoverable

  construct(context : GenerationContext, cbl : APDCoverable) {
    super(context)
    _cbl = cbl
  }

  function generateConfig() {
    var file : Path

    // add splittable implementation files for coverable
    if (_cbl.HasSplittableFields) {
      new SplitCoverableImplCompositeGenerator(Context, _cbl).generate()
    }

    // add lookups only if clauses are defined for this coverable
    if (_cbl.IsACoverable) {
      new CoverableAdapterCompositeGenerator(Context, _cbl).generate()

      // add section for this coverable to lookuptables.xml if it does not exist
      file = createPath((LOOKUPDIRECTORY.concat(new String[]{"lookuptables.xml"})))
      if (not this.startTagExists(file, _cbl.LookupCblStartTag)) {
        insertContents(file, \-> CoverableLookupDefinitions.renderToString(_cbl), _cbl.ProductLine.LookupLineEndTag, false)
      }
      // add section for schedule item lookups if it is needed and does not exist
      if (_cbl.Coverages.hasMatch(\coverage -> coverage.ScheduleLinkedClauseTerms.HasElements)) {
        if (not this.startTagExists(file, _cbl.LookupCblSchStartTag)) {
          insertContents(file, \-> CoverableScheduleLookupDefinitions.renderToString(_cbl), _cbl.ProductLine.LookupLineEndTag, false)
        }
      }
      if (_cbl.Conditions.hasMatch(\condition -> condition.ScheduleLinkedClauseTerms.HasElements)) {
        if (not this.startTagExists(file, _cbl.LookupCblSchConditionStartTag)) {
          insertContents(file, \-> CoverableScheduleConditionLookupDefinitions.renderToString(_cbl), _cbl.ProductLine.LookupLineEndTag, false)
        }
      }
      if (_cbl.Exclusions.hasMatch(\exclusion -> exclusion.ScheduleLinkedClauseTerms.HasElements)) {
        if (not this.startTagExists(file, _cbl.LookupCblSchExclusionStartTag)) {
          insertContents(file, \-> CoverableScheduleExclusionLookupDefinitions.renderToString(_cbl), _cbl.ProductLine.LookupLineEndTag, false)
        }
      }
      // add covterm lookup entities
      file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("TermLookup.eti")}))
      if (fileDoesNotExist(file)) { // only add, to preserve any custom changes
        addOrReplaceFile(file, \-> CovTermLookupEntity.renderToString(_cbl))
      }
      file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("OptLookup.eti")}))
      if (fileDoesNotExist(file)) { // only add, to preserve any custom changes
        addOrReplaceFile(file, \-> CovTermOptLookupEntity.renderToString(_cbl))
      }
      file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("PackLookup.eti")}))
      if (fileDoesNotExist(file)) { // only add, to preserve any custom changes
        addOrReplaceFile(file, \-> CovTermPackLookupEntity.renderToString(_cbl))
      }
    }

    // add coverages
    if (_cbl.Coverages.HasElements) {
      file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("Cov.eti")}))
      var covEntityHelper = new ClauseEntityHelper(_cbl, APDCoverage, file)
      covEntityHelper.initialise()
      addOrReplaceFile(file, \-> CoverageEntity.renderToString(_cbl, covEntityHelper))
      file = createPath(ENTITYNAMESDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("Cov.en")}))
      addOrReplaceFile(file, \-> ClauseName.renderToString(_cbl, "Cov"))

      new CoverageAdapterCompositeGenerator(Context, _cbl).generate()

      new CoverageMatcherCompositeGenerator(Context, _cbl).generate()

      file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("CovLookup.eti")}))
      if (fileDoesNotExist(file)) { // only add, to preserve any custom changes
        addOrReplaceFile(file, \-> CoverageLookupEntity.renderToString(_cbl))
      }
      // add availability lookup definitions if they do not exist
      file = createPath((LOOKUPDIRECTORY.concat(new String[]{"lookuptables.xml"})))
      if (not this.startTagExists(file, _cbl.LookupCovStartTag)) {
        insertContents(file, \-> CoverageLookupDefinitions.renderToString(_cbl), _cbl.LookupCblEndTag, false)
      }
      if (_cbl.Coverages.hasMatch(\cov -> cov.ScheduleLinkedClauseTerms.HasElements)) {
        if (not this.startTagExists(file, _cbl.LookupSchItemCovStartTag)) {
          insertContents(file, \-> ScheduledItemCoverageLookupDefinitions.renderToString(_cbl), _cbl.LookupCblEndTag, false)
        }
      }

      if (_cbl.Coverages.hasMatch(\cov -> cov.HasSchedule)) {
        generateScheduleDataModelForCoverage()
      }

      for (cov in _cbl.Coverages.sort(TemplateComparators.ClauseOrdering)) {
        generateCoverageProductModel(cov)
        if (cov.ScheduleLinkedClauseTerms.HasElements) {
          generateScheduledItemCoverageProductModel(cov)
        }
      }

      // determine any extra foreign keys needed for coverage costs
      var expCosts = new HashSet<APDExposure>()
      var cblCosts = new HashSet<APDCoverable>()
      _cbl.Coverages.each(\cov -> {
        var costMap = cov.CostDefinitions.where(\c -> c.Basis != null)*.Basis.partition(\a -> typeof a)
        costMap.eachKeyAndValue(\k, val -> {
          switch (k) {
            case APDExposureField: // exposure cost
              expCosts.addAll(val.map<APDExposureField>(\elt -> elt as APDExposureField)*.Exposure.toSet())
              break
            case APDField: // coverage cost (using coverable details)
              cblCosts.addAll(val.map<APDField>(\elt -> elt as APDField)*.Coverable.toSet().where(\elt -> cov.Coverable != elt)) // don't need parent
              break
            case APDTerm: // coverage cost
              break
          }
        })
      })

      // add coverage cost entity
      file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("CovCost.eti")}))
      addOrReplaceFile(file, \-> CostEntity.renderToString(_cbl, true, expCosts, cblCosts))

      // add coverage cost methods implementation
      new CoverageCostMethodsImplCompositeGenerator(Context, _cbl, cblCosts, expCosts).generate()

      // add coverage costData
      new CoverageCostDataCompositeGenerator(Context, _cbl, cblCosts, expCosts).generate()
    }

    // add exclusions
    if (_cbl.Exclusions.HasElements) {
      file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("Excl.eti")}))
      var exclEntityHelper = new ClauseEntityHelper(_cbl, APDExclusion, file)
      exclEntityHelper.initialise()
      addOrReplaceFile(file, \-> ExclusionEntity.renderToString(_cbl, exclEntityHelper))
      file = createPath(ENTITYNAMESDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("Excl.en")}))
      addOrReplaceFile(file, \-> ClauseName.renderToString(_cbl, "Excl"))

      new ExclusionAdapterCompositeGenerator(Context, _cbl).generate()

      new ExclusionMatcherCompositeGenerator(Context, _cbl).generate()

      file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("ExclLookup.eti")}))
      if (fileDoesNotExist(file)) { // only add, to preserve any custom changes
        addOrReplaceFile(file, \-> ExclusionLookupEntity.renderToString(_cbl))
      }
      // add availability lookup definitions if they do not exist
      file = createPath((LOOKUPDIRECTORY.concat(new String[]{"lookuptables.xml"})))
      if (not this.startTagExists(file, _cbl.LookupExclStartTag)) {
        insertContents(file, \-> ExclusionLookupDefinitions.renderToString(_cbl), _cbl.LookupCblEndTag, false)
      }
      if (_cbl.Exclusions.hasMatch(\excl -> excl.ScheduleLinkedClauseTerms.HasElements)) {
        if (not this.startTagExists(file, _cbl.LookupSchItemExclStartTag)) {
          insertContents(file, \-> ScheduledItemExclusionLookupDefinitions.renderToString(_cbl), _cbl.LookupCblEndTag, false)
        }
      }

      if (_cbl.Exclusions.hasMatch(\excl -> excl.HasSchedule)) {
        generateScheduleDataModelForExclusion()
      }
      for (excl in _cbl.Exclusions.sort(TemplateComparators.ClauseOrdering)) {
        generateExclusionProductModel(excl)
        if (excl.ScheduleLinkedClauseTerms.HasElements) {
          generateScheduledItemExclusionProductModel(excl)
        }
      }
    }

    // add conditions
    if (_cbl.Conditions.HasElements) {
      file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("Cond.eti")}))
      var condEntityHelper = new ClauseEntityHelper(_cbl, APDCondition, file)
      condEntityHelper.initialise()
      addOrReplaceFile(file, \-> ConditionEntity.renderToString(_cbl, condEntityHelper))
      file = createPath(ENTITYNAMESDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("Cond.en")}))
      addOrReplaceFile(file, \-> ClauseName.renderToString(_cbl, "Cond"))

      new ConditionAdapterCompositeGenerator(Context, _cbl).generate()

      new ConditionMatcherCompositeGenerator(Context, _cbl).generate()

      file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("CondLookup.eti")}))
      if (fileDoesNotExist(file)) { // only add, to preserve any custom changes
        addOrReplaceFile(file, \-> ConditionLookupEntity.renderToString(_cbl))
      }
      // add availability lookup definitions if they do not exist
      file = createPath((LOOKUPDIRECTORY.concat(new String[]{"lookuptables.xml"})))
      if (not this.startTagExists(file, _cbl.LookupCondStartTag)) {
        insertContents(file, \-> ConditionLookupDefinitions.renderToString(_cbl), _cbl.LookupCblEndTag, false)
      }
      if (_cbl.Conditions.hasMatch(\cond -> cond.ScheduleLinkedClauseTerms.HasElements)) {
        if (not this.startTagExists(file, _cbl.LookupSchItemCondStartTag)) {
          insertContents(file, \-> ScheduledItemConditionLookupDefinitions.renderToString(_cbl), _cbl.LookupCblEndTag, false)
        }
      }

      if (_cbl.Conditions.hasMatch(\cond -> cond.HasSchedule)) {
        generateScheduleDataModelForCondition()
      }
      for (cond in _cbl.Conditions.sort(TemplateComparators.ClauseOrdering)) {
        generateConditionProductModel(cond)
        if (cond.ScheduleLinkedClauseTerms.HasElements) {
          generateScheduledItemConditionProductModel(cond)
        }
      }
    }

    // add modifiers
    if (_cbl.HasModifiers) {
      // add adapter classes
      if (_cbl.IsACoverable) {
        file = createPath(GOSULOBDIRECTORY.concat(new String[]{_cbl.LinePrefix.toLowerCase(), _cbl.LinePrefix.concat(_cbl.TypeName).concat("CoverableModifiableAdapter.gs")}))
        addOrReplaceFile(file, \-> CoverableModifiableAdapter.renderToString(_cbl))
      } else {
        file = createPath(GOSULOBDIRECTORY.concat(new String[]{_cbl.LinePrefix.toLowerCase(), _cbl.LinePrefix.concat(_cbl.TypeName).concat("ModifiableAdapter.gs")}))
        addOrReplaceFile(file, \-> ModifiableAdapter.renderToString(_cbl))
      }
      // add lookup entities
      file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("ModLookup.eti")}))
      if (fileDoesNotExist(file)) { // only add, to preserve any custom changes
        addOrReplaceFile(file, \-> ModifierLookupEntity.renderToString(_cbl))
      }
      file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.LinePrefix.concat(_cbl.TypeName).concat("MFLookup.eti")}))
      if (fileDoesNotExist(file)) { // only add, to preserve any custom changes
        addOrReplaceFile(file, \-> ModifierFactorLookupEntity.renderToString(_cbl))
      }
      // add availability lookup definitions if they do not exist
      file = createPath((LOOKUPDIRECTORY.concat(new String[]{"lookuptables.xml"})))
      if (not this.startTagExists(file, _cbl.LookupModStartTag)) {
        insertContents(file, \-> ModifierLookupDefinitions.renderToString(_cbl), _cbl.LookupCblEndTag, false)
      }
    }

    // add coverable enhancement to manage child coverables, exposures, location fields, splittable fields or coverables without clauses
    if (_cbl.ChildCoverables.HasElements
        or _cbl.Exposures.HasElements
        or _cbl.Fields.hasMatch(\f -> f.Type == APDFieldType.TC_LOCATION)
        or _cbl.HasSplittableFields
        or !_cbl.IsACoverable
        or _cbl.Fields.HasElements) {
      file = createPath(DEFAULTGOSULOBDIRECTORY.concat(new String[]{_cbl.LinePrefix.toLowerCase(), _cbl.LinePrefix.concat(_cbl.TypeName).concat("Enhancement.gsx")}))
      addOrReplaceFile(file, \-> CoverableEnhancement.renderToString(_cbl))
    }

    file = createPath(DEFAULTGOSULOBDIRECTORY.concat(new String[]{_cbl.LinePrefix.toLowerCase(), _cbl.LinePrefix.concat(_cbl.TypeName).concat("DefaultValuesEnhancement.gsx")}))
    addOrReplaceFile(file, \-> CoverableDefaultValuesEnhancement.renderToString(_cbl))

    // add exposures, if any
    for (exposure in _cbl.Exposures) {
      file = createPath(ENTITYDIRECTORY.concat(new String[]{exposure.QualifiedName.concat(".eti")}))
      addOrReplaceFile(file, \-> ExposureEntity.renderToString(exposure))

      file = createPath(ENTITYNAMESDIRECTORY.concat(new String[]{exposure.QualifiedName.concat(".en")}))
      addOrReplaceFile(file, \-> ExposureName.renderToString(exposure))

      file = createPath(DEFAULTGOSULOBDIRECTORY.concat(new String[]{_cbl.LinePrefix.toLowerCase(), _cbl.LinePrefix.concat(exposure.TypeName).concat("Enhancement.gsx")}))
      addOrReplaceFile(file, \-> ExposureEnhancement.renderToString(exposure))

      file = createPath(DEFAULTGOSULOBDIRECTORY.concat(new String[]{_cbl.LinePrefix.toLowerCase(), _cbl.LinePrefix.concat(exposure.TypeName).concat("DefaultValuesEnhancement.gsx")}))
      addOrReplaceFile(file, \-> ExposureDefaultValuesEnhancement.renderToString(exposure))

      // add splittable implementation files for exposure
      if (exposure.HasSplittableFields) {
        new SplitExposureImplCompositeGenerator(Context, exposure).generate()
      }

      new ExposureSyncableAdapterCompositeGenerator(Context, exposure).generate()
    }

    // add coverable cost entity
    // no extra foreign keys needed - coverable level costs should not have a basis that is not an accumulation of its children or some other number
    file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.QualifiedName.concat("Cost.eti")}))
    addOrReplaceFile(file, \-> CostEntity.renderToString(_cbl, false, {}, {}))

    // add coverable cost methods implementation
    new CoverableCostMethodsImplCompositeGenerator(Context, _cbl).generate()

    // add coverable costData
    new CoverableCostDataCompositeGenerator(Context, _cbl, {}, {}).generate()

    new CoverableSyncableAdapterCompositeGenerator(Context, _cbl).generate()

    // and finally, add any children (especially if this is not really a coverable itself)
    _cbl.ChildCoverables.each(\cbl -> new CoverableEntityGenerator(Context, cbl, new CoverableGenerator(Context, cbl)).generateConfig())

    // add the UI
    // coverable details
    file = createPath(LINEUIDIRECTORY.concat(new String[]{_cbl.LinePrefix.toLowerCase(), POLICY, _cbl.LinePrefix.concat(_cbl.TypeName + "PanelSet.pcf")}))
    addOrReplaceFile(file, \-> CoverablePanelSet.renderToString(_cbl, FIELDMAX))
    // exposure lists per coverable
    for (exposure in _cbl.Exposures) {
      file = createPath(LINEUIDIRECTORY.concat(new String[]{_cbl.LinePrefix.toLowerCase(), POLICY, _cbl.LinePrefix.concat(exposure.TypeName + "ListPanelSet.pcf")}))
      if (exposure.HasSplittableFields) {
        addOrReplaceFile(file, \-> SplittableExposureList.renderToString(_cbl, exposure))
      } else {
        addOrReplaceFile(file, \-> ExposureList.renderToString(_cbl, exposure))
      }
    }
    // coverable lists and pop-ups for all coverables except the line
    if (_cbl.Parent != null) {
      file = createPath(LINEUIDIRECTORY.concat(new String[]{_cbl.LinePrefix.toLowerCase(), POLICY, _cbl.LinePrefix.concat(_cbl.TypeName + "ListPanelSet.pcf")}))
      if (_cbl.HasSplittableFields) {
        addOrReplaceFile(file, \-> SplittableCoverableList.renderToString(_cbl.Parent, _cbl))
      } else {
        addOrReplaceFile(file, \-> CoverableList.renderToString(_cbl.Parent, _cbl))
      }
      file = createPath(LINEUIDIRECTORY.concat(new String[]{_cbl.LinePrefix.toLowerCase(), POLICY, _cbl.LinePrefix.concat(_cbl.TypeName + "Popup.pcf")}))
      addOrReplaceFile(file, \-> CoverablePopup.renderToString(_cbl, FIELDMAX))
    }
    // add UI display properties for each language
    AllLanguages.each(\language -> {
      file = createPath(APDLanguageResolver.resolveDisplayPropertiesFilePaths(language))
      if (fileExists(file)) {
        // add the display literals to the end
        appendToFile(file, \-> CoverableUIDisplayProperties.renderToString(_cbl, language), false)
      } else {
        addOrReplaceFile(file, \-> CoverableUIDisplayProperties.renderToString(_cbl, language), false)
      }
    })

  }

  /**
   * Generates the data model files required for this coverable to support schedules on coverage.
   */
  protected function generateScheduleDataModelForCoverage() {
    // XXCoverableScheduleCov.eti
    var file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.QualifiedName + "ScheduleCov.eti"}))
    addOrReplaceFile(file, \-> CoverableScheduleCovEntity.renderToString(_cbl))

    new ScheduleCovImplCompositeGenerator(Context, _cbl).generate()

    // XXCoverableScheduleCovItem.eti
    file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.QualifiedName + "ScheduleCovItem.eti"}))
    addOrReplaceFile(file, \-> CoverableScheduleCovItemEntity.renderToString(_cbl))

    new ScheduleCovItemCoverableAdapterCompositeGenerator(Context, _cbl).generate()
    new ScheduleCovItemMatcherCompositeGenerator(Context, _cbl).generate()

    // XXCoverableSchCovItemCov.eti
    file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.QualifiedName + "SchCovItemCov.eti"}))
    addOrReplaceFile(file, \-> CoverableScheduleCovItemCovEntity.renderToString(_cbl))

    new ScheduleCovItemCovCoverageAdapterCompositeGenerator(Context, _cbl).generate()
    new ScheduleCovItemCovMatcherCompositeGenerator(Context, _cbl).generate()

    // XXCoverableScheduleCovItem.en
    file = createPath(ENTITYNAMESDIRECTORY.concat(new String[]{_cbl.QualifiedName + "ScheduleCovItem.en"}))
    addOrReplaceFile(file, \-> CoverableScheduledItemName.renderToString(_cbl, "Cov"))
  }

  /**
   * Generates the data model files required for this coverable to support schedules on exclusion.
   */
  protected function generateScheduleDataModelForExclusion() {
    // XXCoverableScheduleExcl.eti
    var file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.QualifiedName + "ScheduleExcl.eti"}))
    addOrReplaceFile(file, \-> CoverableScheduleExclEntity.renderToString(_cbl))

    new ScheduleExclImplCompositeGenerator(Context, _cbl).generate()

    // XXCoverableScheduleExclItem.eti
    file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.QualifiedName + "ScheduleExclItem.eti"}))
    addOrReplaceFile(file, \-> CoverableScheduleExclItemEntity.renderToString(_cbl))

    new ScheduleExclItemCoverableAdapterCompositeGenerator(Context, _cbl).generate()
    new ScheduleExclItemMatcherCompositeGenerator(Context, _cbl).generate()

    // XXCoverableSchExclItemExcl.eti
    file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.QualifiedName + "SchExclItemExcl.eti"}))
    addOrReplaceFile(file, \-> CoverableScheduleExclItemExclEntity.renderToString(_cbl))

    new ScheduleExclItemExclExclusionAdapterCompositeGenerator(Context, _cbl).generate()
    new ScheduleExclItemExclMatcherCompositeGenerator(Context, _cbl).generate()

    // XXCoverableScheduleExclItem.en
    file = createPath(ENTITYNAMESDIRECTORY.concat(new String[]{_cbl.QualifiedName + "ScheduleExclItem.en"}))
    addOrReplaceFile(file, \-> CoverableScheduledItemName.renderToString(_cbl, "Excl"))
  }

  /**
   * Generates the data model files required for this coverable to support schedules on condition.
   */
  protected function generateScheduleDataModelForCondition() {
    // XXCoverableScheduleCond.eti
    var file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.QualifiedName + "ScheduleCond.eti"}))
    addOrReplaceFile(file, \-> CoverableScheduleCondEntity.renderToString(_cbl))

    new ScheduleCondImplCompositeGenerator(Context, _cbl).generate()

    // XXCoverableScheduleCondItem.eti
    file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.QualifiedName + "ScheduleCondItem.eti"}))
    addOrReplaceFile(file, \-> CoverableScheduleCondItemEntity.renderToString(_cbl))

    new ScheduleCondItemCoverableAdapterCompositeGenerator(Context, _cbl).generate()
    new ScheduleCondItemMatcherCompositeGenerator(Context, _cbl).generate()

    // XXCoverableSchCondItemCond.eti
    file = createPath(ENTITYDIRECTORY.concat(new String[]{_cbl.QualifiedName + "SchCondItemCond.eti"}))
    addOrReplaceFile(file, \-> CoverableScheduleCondItemCondEntity.renderToString(_cbl))

    new ScheduleCondItemCondConditionAdapterCompositeGenerator(Context, _cbl).generate()
    new ScheduleCondItemCondMatcherCompositeGenerator(Context, _cbl).generate()

    // XXCoverableScheduleCondItem.en
    file = createPath(ENTITYNAMESDIRECTORY.concat(new String[]{_cbl.QualifiedName + "ScheduleCondItem.en"}))
    addOrReplaceFile(file, \-> CoverableScheduledItemName.renderToString(_cbl, "Cond"))
  }

  /**
   * Generates the product model files for this coverage.
   *
   * @param cov
   */
  protected function generateCoverageProductModel(cov : APDCoverage) {
    var pmCoverage : CoveragePattern
    // create or update coverage product model coverage definition
    var file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_cbl.ProductLine.CodeIdentifier, "coveragepatterns", _cbl.LinePrefix + cov.CodeIdentifier + ".xml"})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \-> Coverage_New.renderToString(cov), false)
    } else {
      pmCoverage = parseCoveragePattern(file)
      addOrReplaceFile(file, \-> Coverage_Existing.renderToString(cov, pmCoverage), false)
    }

    // only write the lookup file if the coverage does not exist; this preserves any availability logic added afer generation
    file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_cbl.ProductLine.CodeIdentifier, "coveragepatterns", _cbl.LinePrefix + cov.CodeIdentifier + "-lookups.xml"})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \-> CoverageLookups.renderToString(cov), false)
    } else {
      cov.StandardTerms.sort(TemplateComparators.AttributeOrdering).each(\t -> {
        var genTerm = pmCoverage.CovTerms.GenericCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cov.CodeIdentifier + t.Name)
        var dirTerm = pmCoverage.CovTerms.DirectCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cov.CodeIdentifier + t.Name)
        var tkTerm = pmCoverage.CovTerms.TypekeyCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cov.CodeIdentifier + t.Name)
        var optTerm = pmCoverage.CovTerms.OptionCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cov.CodeIdentifier + t.Name)
        var pkgTerm = pmCoverage.CovTerms.PackageCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cov.CodeIdentifier + t.Name)
        if (dirTerm == null and genTerm == null and tkTerm == null and optTerm == null and pkgTerm == null)
          insertContents(file, \-> TermLookup.renderToString(cov, t), "</import>", false)
      })
      //remove availability lookups for terms that no longer exist
      deleteRemovedTermsFromLookups(file, cov, pmCoverage)
    }
  }

  /**
   * Generates the product model files for this exclusion.
   *
   * @param excl
   */
  protected function generateExclusionProductModel(excl : APDExclusion) {
    var pmExclusion : ExclusionPattern
    // create or update exclusion product model exclusion definition
    var file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_cbl.ProductLine.CodeIdentifier, "coveragepatterns", _cbl.LinePrefix + excl.CodeIdentifier + ".xml"})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \-> Exclusion_New.renderToString(excl), false)
    } else {
      pmExclusion = parseExclusionPattern(file)
      addOrReplaceFile(file, \-> Exclusion_Existing.renderToString(excl, pmExclusion), false)
    }

    // only write the lookup file if the exclusion does not exist; this preserves any availability logic added afer generation
    file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_cbl.ProductLine.CodeIdentifier, "coveragepatterns", _cbl.LinePrefix + excl.CodeIdentifier + "-lookups.xml"})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \-> ExclusionLookups.renderToString(excl), false)
    } else {
      excl.StandardTerms.sort(TemplateComparators.AttributeOrdering).each(\t -> {
        var genTerm = pmExclusion.CovTerms.GenericCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + excl.CodeIdentifier + t.Name)
        var dirTerm = pmExclusion.CovTerms.DirectCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + excl.CodeIdentifier + t.Name)
        var tkTerm = pmExclusion.CovTerms.TypekeyCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + excl.CodeIdentifier + t.Name)
        var optTerm = pmExclusion.CovTerms.OptionCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + excl.CodeIdentifier + t.Name)
        var pkgTerm = pmExclusion.CovTerms.PackageCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + excl.CodeIdentifier + t.Name)
        if (dirTerm == null and genTerm == null and tkTerm == null and optTerm == null and pkgTerm == null)
          insertContents(file, \-> TermLookup.renderToString(excl, t), "</import>", false)
      })
      //remove availability lookups for terms that no longer exist
      deleteRemovedTermsFromLookups(file, excl, pmExclusion)
    }
  }

  /**
   * Generates the product model files for this condition.
   *
   * @param cond
   */
  protected function generateConditionProductModel(cond : APDCondition) {
    var pmCondition : ConditionPattern
    // create or update condition product model condition definition
    var file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_cbl.ProductLine.CodeIdentifier, "coveragepatterns", _cbl.LinePrefix + cond.CodeIdentifier + ".xml"})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \-> Condition_New.renderToString(cond), false)
    } else {
      pmCondition = parseConditionPattern(file)
      addOrReplaceFile(file, \-> Condition_Existing.renderToString(cond, pmCondition), false)
    }

    // only write the lookup file if the condition does not exist; this preserves any availability logic added afer generation
    file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_cbl.ProductLine.CodeIdentifier, "coveragepatterns", _cbl.LinePrefix + cond.CodeIdentifier + "-lookups.xml"})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \-> ConditionLookups.renderToString(cond), false)
    } else {
      cond.StandardTerms.sort(TemplateComparators.AttributeOrdering).each(\t -> {
        var genTerm = pmCondition.CovTerms.GenericCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cond.CodeIdentifier + t.Name)
        var dirTerm = pmCondition.CovTerms.DirectCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cond.CodeIdentifier + t.Name)
        var tkTerm = pmCondition.CovTerms.TypekeyCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cond.CodeIdentifier + t.Name)
        var optTerm = pmCondition.CovTerms.OptionCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cond.CodeIdentifier + t.Name)
        var pkgTerm = pmCondition.CovTerms.PackageCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cond.CodeIdentifier + t.Name)
        if (dirTerm == null and genTerm == null and tkTerm == null and optTerm == null and pkgTerm == null)
          insertContents(file, \-> TermLookup.renderToString(cond, t), "</import>", false)
      })
      //remove availability lookups for terms that no longer exist
      deleteRemovedTermsFromLookups(file, cond, pmCondition)
    }
  }

  private function deleteRemovedTermsFromLookups(file : Path, apdClause : APDClause, pmClause : XmlElement) {
    var termsInNewModel = apdClause.StandardTerms.map(\elt -> _cbl.LinePrefix + apdClause.CodeIdentifier + elt.Name).toSet()

    var termsInCurrentFile = pmClause.getChild("CovTerms").getChildren("GenericCovTermPattern")*.getAttributeValue("codeIdentifier").toSet()
    termsInCurrentFile.addAll(pmClause.getChild("CovTerms").getChildren("DirectCovTermPattern")*.getAttributeValue("codeIdentifier").toList())
    termsInCurrentFile.addAll(pmClause.getChild("CovTerms").getChildren("TypekeyCovTermPattern")*.getAttributeValue("codeIdentifier").toList())
    termsInCurrentFile.addAll(pmClause.getChild("CovTerms").getChildren("OptionCovTermPattern")*.getAttributeValue("codeIdentifier").toList())
    termsInCurrentFile.addAll(pmClause.getChild("CovTerms").getChildren("PackageCovTermPattern")*.getAttributeValue("codeIdentifier").toList())

    var termsToRemove = termsInCurrentFile.subtract(termsInNewModel)
    for (termCodeId in termsToRemove) {
      removeLookupsForTerm(file, "${_cbl.LinePrefix}${_cbl.TypeName}TermLookup", termCodeId, false)
      removeLookupsForTerm(file, "${_cbl.LinePrefix}${_cbl.TypeName}OptLookup", termCodeId, false)
      removeLookupsForTerm(file, "${_cbl.LinePrefix}${_cbl.TypeName}PackLookup", termCodeId, false)
    }
  }

  /**
   * Generates the product model files for a linked coverage of the given schedule coverage.
   */
  protected function generateScheduledItemCoverageProductModel(cov : APDCoverage) {
    var pmCoverage : CoveragePattern
    // create or update schedule item coverage product model coverage definition
    var file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_cbl.ProductLine.CodeIdentifier, "coveragepatterns", _cbl.LinePrefix + cov.CodeIdentifier + "ItemCov.xml"})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \ -> ScheduledItemCoverage_New.renderToString(cov))
    } else {
      pmCoverage = parseCoveragePattern(file)
      addOrReplaceFile(file, \ -> ScheduledItemCoverage_Existing.renderToString(cov, pmCoverage))
    }

    // only write the lookup file if the coverage does not exist; this preserves any availability logic added afer generation
    file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_cbl.ProductLine.CodeIdentifier, "coveragepatterns", _cbl.LinePrefix + cov.CodeIdentifier + "ItemCov-lookups.xml"})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \ -> ScheduledItemCoverageLookups.renderToString(cov))
    } else {
      cov.ScheduleLinkedClauseTerms.sort(TemplateComparators.AttributeOrdering).each(\t -> {
        var genTerm = pmCoverage.CovTerms.GenericCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cov.CodeIdentifier + "ItemCov" + t.Name)
        var dirTerm = pmCoverage.CovTerms.DirectCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cov.CodeIdentifier + "ItemCov" + t.Name)
        var tkTerm = pmCoverage.CovTerms.TypekeyCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cov.CodeIdentifier + "ItemCov" + t.Name)
        var optTerm = pmCoverage.CovTerms.OptionCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cov.CodeIdentifier + "ItemCov" + t.Name)
        var pkgTerm = pmCoverage.CovTerms.PackageCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cov.CodeIdentifier + "ItemCov" + t.Name)
        if (dirTerm == null and genTerm == null and tkTerm == null and optTerm == null and pkgTerm == null)
          insertContents(file, \ -> TermLookup.renderToString(cov, t), "</import>", false)
      })
      //remove availability lookups for terms that no longer exist
      deleteRemovedScheduledItemTermsFromLookups(file, cov, pmCoverage)
    }
  }

  protected function generateScheduledItemExclusionProductModel(excl : APDExclusion) {
    var pmExclusion : ExclusionPattern
    // create or update schedule item exclusion product model exclusion definition
    var file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_cbl.ProductLine.CodeIdentifier, "coveragepatterns", _cbl.LinePrefix + excl.CodeIdentifier + "ItemExcl.xml"})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \ -> ScheduledItemExclusion_New.renderToString(excl))
    } else {
      pmExclusion = parseExclusionPattern(file)
      addOrReplaceFile(file, \ -> ScheduledItemExclusion_Existing.renderToString(excl, pmExclusion))
    }

    // only write the lookup file if the exclusion does not exist; this preserves any availability logic added afer generation
    file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_cbl.ProductLine.CodeIdentifier, "coveragepatterns", _cbl.LinePrefix + excl.CodeIdentifier + "ItemExcl-lookups.xml"})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \ -> ScheduledItemExclusionLookups.renderToString(excl))
    } else {
      excl.ScheduleLinkedClauseTerms.sort(TemplateComparators.AttributeOrdering).each(\t -> {
        var genTerm = pmExclusion.CovTerms.GenericCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + excl.CodeIdentifier + "ItemExcl" + t.Name)
        var dirTerm = pmExclusion.CovTerms.DirectCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + excl.CodeIdentifier + "ItemExcl" + t.Name)
        var tkTerm = pmExclusion.CovTerms.TypekeyCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + excl.CodeIdentifier + "ItemExcl" + t.Name)
        var optTerm = pmExclusion.CovTerms.OptionCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + excl.CodeIdentifier + "ItemExcl" + t.Name)
        var pkgTerm = pmExclusion.CovTerms.PackageCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + excl.CodeIdentifier + "ItemExcl" + t.Name)
        if (dirTerm == null and genTerm == null and tkTerm == null and optTerm == null and pkgTerm == null)
          insertContents(file, \ -> TermLookup.renderToString(excl, t), "</import>", false)
      })
      //remove availability lookups for terms that no longer exist
      deleteRemovedScheduledItemTermsFromLookups(file, excl, pmExclusion)
    }
  }

  protected function generateScheduledItemConditionProductModel(cond : APDCondition) {
    var pmCondition : ConditionPattern
    // create or update schedule item condition product model condition definition
    var file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_cbl.ProductLine.CodeIdentifier, "coveragepatterns", _cbl.LinePrefix + cond.CodeIdentifier + "ItemCond.xml"})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \ -> ScheduledItemCondition_New.renderToString(cond))
    } else {
      pmCondition = parseConditionPattern(file)
      addOrReplaceFile(file, \ -> ScheduledItemCondition_Existing.renderToString(cond, pmCondition))
    }

    // only write the lookup file if the condition does not exist; this preserves any availability logic added afer generation
    file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_cbl.ProductLine.CodeIdentifier, "coveragepatterns", _cbl.LinePrefix + cond.CodeIdentifier + "ItemCond-lookups.xml"})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \ -> ScheduledItemConditionLookups.renderToString(cond))
    } else {
      cond.ScheduleLinkedClauseTerms.sort(TemplateComparators.AttributeOrdering).each(\t -> {
        var genTerm = pmCondition.CovTerms.GenericCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cond.CodeIdentifier + "ItemCond" + t.Name)
        var dirTerm = pmCondition.CovTerms.DirectCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cond.CodeIdentifier + "ItemCond" + t.Name)
        var tkTerm = pmCondition.CovTerms.TypekeyCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cond.CodeIdentifier + "ItemCond" + t.Name)
        var optTerm = pmCondition.CovTerms.OptionCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cond.CodeIdentifier + "ItemCond" + t.Name)
        var pkgTerm = pmCondition.CovTerms.PackageCovTermPattern.firstWhere(\pmT -> pmT.CodeIdentifier == _cbl.LinePrefix + cond.CodeIdentifier + "ItemCond" + t.Name)
        if (dirTerm == null and genTerm == null and tkTerm == null and optTerm == null and pkgTerm == null)
          insertContents(file, \ -> TermLookup.renderToString(cond, t), "</import>", false)
      })
      //remove availability lookups for terms that no longer exist
      deleteRemovedScheduledItemTermsFromLookups(file, cond, pmCondition)
    }
  }

  private function deleteRemovedScheduledItemTermsFromLookups(file : Path, apdClause : APDClause, pmClause : XmlElement) {
    var termsInNewModel = apdClause.ScheduleLinkedClauseTerms.map(\elt -> _cbl.LinePrefix + apdClause.CodeIdentifier + "Item" + apdClause.TypeAbbreviation + elt.Name).toSet()

    var termsInCurrentFile = pmClause.getChild("CovTerms").getChildren("GenericCovTermPattern")*.getAttributeValue("codeIdentifier").toSet()
    termsInCurrentFile.addAll(pmClause.getChild("CovTerms").getChildren("DirectCovTermPattern")*.getAttributeValue("codeIdentifier").toList())
    termsInCurrentFile.addAll(pmClause.getChild("CovTerms").getChildren("TypekeyCovTermPattern")*.getAttributeValue("codeIdentifier").toList())
    termsInCurrentFile.addAll(pmClause.getChild("CovTerms").getChildren("OptionCovTermPattern")*.getAttributeValue("codeIdentifier").toList())
    termsInCurrentFile.addAll(pmClause.getChild("CovTerms").getChildren("PackageCovTermPattern")*.getAttributeValue("codeIdentifier").toList())

    var termsToRemove = termsInCurrentFile.subtract(termsInNewModel)
    for (termCodeId in termsToRemove) {
      removeLookupsForTerm(file, "${_cbl.LinePrefix}${_cbl.TypeName}TermLookup", termCodeId, false)
      removeLookupsForTerm(file, "${_cbl.LinePrefix}${_cbl.TypeName}OptLookup", termCodeId, false)
      removeLookupsForTerm(file, "${_cbl.LinePrefix}${_cbl.TypeName}PackLookup", termCodeId, false)
    }
  }
}