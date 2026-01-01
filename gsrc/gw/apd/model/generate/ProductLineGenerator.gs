package gw.apd.model.generate

uses gw.apd.model.generate.generators.BaseCostAdapterCompositeGenerator
uses gw.apd.model.generate.generators.BaseCostDataCompositeGenerator
uses gw.apd.model.generate.generators.BaseCostMethodsCompositeGenerator
uses gw.apd.model.generate.generators.ChargeBreakdownCategoryLookupCompositeGenerator
uses gw.apd.model.generate.generators.ConfigurationCompositeGenerator
uses gw.apd.model.generate.generators.DiffHelperCompositeGenerator
uses gw.apd.model.generate.generators.LineEntityGenerator
uses gw.apd.model.generate.generators.LineTransactionAdapterCompositeGenerator
uses gw.apd.model.generate.generators.LineValidationCompositeGenerator
uses gw.apd.model.generate.generators.PolicyLineMethodsCompositeGenerator
uses gw.apd.model.generate.generators.QuoteDisplayUtilCompositeGenerator
uses gw.apd.model.generate.generators.RateRoutineConfigCompositeGenerator
uses gw.apd.model.generate.generators.RatingEngineCompositeGenerator
uses gw.apd.model.generate.templates.TemplateComparators
uses gw.apd.model.generate.templates.productline.BaseCost
uses gw.apd.model.generate.templates.productline.BaseCostEntityName
uses gw.apd.model.generate.templates.productline.CostDefinitionEntity
uses gw.apd.model.generate.templates.productline.InstalledPolicyLine_Code
uses gw.apd.model.generate.templates.productline.InstalledPolicyLine_Name
uses gw.apd.model.generate.templates.productline.LineCoverablePage
uses gw.apd.model.generate.templates.productline.LineCoverableWizardScreen
uses gw.apd.model.generate.templates.productline.LineLinks
uses gw.apd.model.generate.templates.productline.LineScheduledItemDelegate
uses gw.apd.model.generate.templates.productline.LineTransaction
uses gw.apd.model.generate.templates.productline.LineTransactionName
uses gw.apd.model.generate.templates.productline.PolicyFileCoverableScreen
uses gw.apd.model.generate.templates.productline.PolicyLineUIDisplayProperties
uses gw.apd.model.generate.templates.productline.PolicyPeriodTransArray
uses gw.apd.model.generate.templates.productline.PolicyLine_Code
uses gw.apd.model.generate.templates.productline.ProductLineDisplayProperties
uses gw.apd.model.generate.templates.productline.ProductLineLookupTables
uses gw.apd.model.generate.templates.productline.ProductLineLookups
uses gw.apd.model.generate.templates.productline.ProductLineProperties
uses gw.apd.model.generate.templates.productline.ProductLine_Existing
uses gw.apd.model.generate.templates.productline.ProductLine_New
uses gw.apd.model.generate.templates.systables.CostDefinition
uses gw.apd.model.generate.templates.systables.Systables_Existing
uses gw.apd.model.generate.xsd.productlinemodel.PolicyLinePattern

@Export
class ProductLineGenerator extends TrackedFileGenerator {
  private static final var TRANSACTION_INSERTION_MATCHING_TEXT = "<!-- Insert transaction arrays for additional lines here -->"
  private static final var POLICY_LINE_INSERTION_MATCHING_TEXT = "// Add additional policy lines here"
  private static final var LOOKUP_TABLE_END_TEXT = "</LookupTables>"
  var _line : APDProductLine
  var _product : APDProduct
  var _coverableGenerator : CoverableGenerator

  construct(context : GenerationContext, product : APDProduct, line : APDProductLine) {
    this (context, product, line, new CoverableGenerator(context, line))
  }

  construct(context : GenerationContext, product : APDProduct, line : APDProductLine, coverableGenerator : CoverableGenerator) {
    super(context)

    _product = product
    _line = line
    _coverableGenerator = coverableGenerator
  }

  private function getFilename(name : String, extension : String) : String {
    return "${_line.LinePrefix}${name}.${extension}"
  }

  function generateConfig() {
    // create directories
    var path = createPath(PRODUCTLINESDIRECTORY.concat(new String[]{_line.CodeIdentifier}))
    createOrConfirmDirectory(path)
    path = createPath(PRODUCTLINESDIRECTORY.concat(new String[]{_line.CodeIdentifier, "coveragepatterns"}))
    createOrConfirmDirectory(path)
    path = createPath(PRODUCTLINESDIRECTORY.concat(new String[]{_line.CodeIdentifier, "images"}))
    createOrConfirmDirectory(path)
    path = createPath(GOSULOBDIRECTORY.concat(new String[]{_line.LinePrefix.toLowerCase()}))
    createOrConfirmDirectory(path)
    path = createPath(GOSULOBDIRECTORY.concat(new String[]{_line.LinePrefix.toLowerCase(), "financials"}))
    createOrConfirmDirectory(path)
    path = createPath(GOSULOBDIRECTORY.concat(new String[]{_line.LinePrefix.toLowerCase(), "rating"}))
    createOrConfirmDirectory(path)
    path = createPath(LINEUIDIRECTORY.concat(new String[]{_line.LinePrefix.toLowerCase(), JOB}))
    createOrConfirmDirectory(path)
    path = createPath(LINEUIDIRECTORY.concat(new String[]{_line.LinePrefix.toLowerCase(), POLICY}))
    createOrConfirmDirectory(path)
    path = createPath(LINEUIDIRECTORY.concat(new String[]{_line.LinePrefix.toLowerCase(), POLICYFILE}))
    createOrConfirmDirectory(path)

    // PRODUCT MODEL
    // create or update product line definition
    var file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_line.CodeIdentifier, _line.CodeIdentifier.concat(".xml")})))
    var firstTime = false // used to ensure some updates are only done once
    if (fileDoesNotExist(file)) {
      firstTime = true
      addOrReplaceFile(file, \-> ProductLine_New.renderToString(_line), false)
    } else {
      addOrReplaceFile(file, \-> {
        var pmLineProduct = PolicyLinePattern.parse(file)
        return ProductLine_Existing.renderToString(_line, pmLineProduct)
      }, false)
    }
    // only write the lookup file if it does not exist; this preserves any modifier availability logic added
    file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_line.CodeIdentifier, _line.CodeIdentifier.concat("-lookups.xml")})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \-> ProductLineLookups.renderToString(_line), false)
    }
    // only write the properties file if it does not exist; this preserves any properties addedS
    file = createPath((PRODUCTLINESDIRECTORY.concat(new String[]{_line.CodeIdentifier, _line.CodeIdentifier.concat(".properties")})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \-> ProductLineProperties.renderToString(_line), false)
    }
    // add product model display properties for each language
    AllLanguages.each(\language -> {
      file = createPath(APDLanguageResolver.resolveProductModelDisplayPropertiesFilePaths(language))
      if (fileExists(file)) {
        // add the display literals to the end
        appendToFile(file, \-> ProductLineDisplayProperties.renderToString(_line, language), false)
      } else {
        addOrReplaceFile(file, \-> ProductLineDisplayProperties.renderToString(_line, language), false)
      }
    })
    // add lookup tags if they do not exist
    file = createPath((LOOKUPDIRECTORY.concat(new String[]{"lookuptables.xml"})))
    if (not this.startTagExists(file, _line.LookupLineStartTag)) {
      insertContents(file, \-> ProductLineLookupTables.renderToString(_line), LOOKUP_TABLE_END_TEXT, false)
    }

    // POLICY LINE ENTITY ETC
    // add the policy line typelist entry
    file = createPath(TYPELISTDIRECTORY.concat(new String[]{"InstalledPolicyLine.".concat(_line.LinePrefix).concat(".ttx")}))
    addOrReplaceFile(file, \-> InstalledPolicyLine_Code.renderToString(_line))

    file = createPath(TYPELISTDIRECTORY.concat(new String[]{"PolicyLine.".concat(_line.LinePrefix).concat(".ttx")}))
    addOrReplaceFile(file, \-> PolicyLine_Code.renderToString(_line))

    AllLanguages.each(\language -> {
      file = createPath(APDLanguageResolver.resolveTypelistPropertiesFilePaths(language))
      if (fileExists(file)) {
        // add the display literals to the end
        appendToFile(file, \-> InstalledPolicyLine_Name.renderToString(_line, language), false)
      } else {
        addOrReplaceFile(file, \-> InstalledPolicyLine_Name.renderToString(_line, language), false)
      }
    })

    // add the policy line subclass entity
    new LineEntityGenerator(Context, _line).generate()

    new ConfigurationCompositeGenerator(Context, _line).generate()

    new LineValidationCompositeGenerator(Context, _line).generate()

    new PolicyLineMethodsCompositeGenerator(Context, _line).generate()

    new DiffHelperCompositeGenerator(Context, _line).generate()

    // FINANCIALS
    // add abstract cost entity
    file = createPath(ENTITYDIRECTORY.concat(new String[]{_line.LinePrefix.concat("Cost.eti")}))
    if (fileDoesNotExist(file)) { // only recreate if deleted
      addOrReplaceFile(file, \-> BaseCost.renderToString(_line))
    }
    file = createPath(ENTITYNAMESDIRECTORY.concat(new String[]{_line.LinePrefix.concat("Cost.en")}))
    if (fileDoesNotExist(file)) { // only recreate if deleted
      addOrReplaceFile(file, \-> BaseCostEntityName.renderToString(_line))
    }

    new BaseCostAdapterCompositeGenerator(Context, _line).generate()

    new BaseCostMethodsCompositeGenerator(Context, _line).generate()

    // add transaction entity
    file = createPath(ENTITYDIRECTORY.concat(new String[]{_line.LinePrefix.concat("Transaction.eti")}))
    if (fileDoesNotExist(file)) { // only recreate if deleted
      addOrReplaceFile(file, \-> LineTransaction.renderToString(_line))
    }

    new LineTransactionAdapterCompositeGenerator(Context, _line).generate()

    file = createPath(ENTITYNAMESDIRECTORY.concat(new String[]{_line.LinePrefix.concat("Transaction.en")}))
    if (fileDoesNotExist(file)) { // only recreate if deleted
      addOrReplaceFile(file, \-> LineTransactionName.renderToString(_line))
    }
    if (firstTime) { // don't re-add the array
      file = createPath(ENTITYDIRECTORY.concat(new String[]{"PolicyPeriod.etx"}))
      insertContents(file, \-> PolicyPeriodTransArray.renderToString(_line), TRANSACTION_INSERTION_MATCHING_TEXT, false)
    }
    // add quote worksheet display utility (which diplays costs and transactions)
    new QuoteDisplayUtilCompositeGenerator(Context, _line).generate()

    // RATING
    new BaseCostDataCompositeGenerator(Context, _line).generate()

    new RatingEngineCompositeGenerator(Context, _line).generate()

    new RateRoutineConfigCompositeGenerator(Context, _line).generate()

    // CLAIMS MAPPING & INTEGRATION

    // THE LINE AS A COVERABLE
    _coverableGenerator.generateConfig()

    // the scheduled item delegate for this line
    if (_line.AllClauses.hasMatch(\clause -> clause.HasSchedule)) {
      file = createPath(ENTITYDIRECTORY.concat(new String[]{"${_line.LinePrefix}ScheduledItem.eti"}))
      addOrReplaceFile(file, \-> LineScheduledItemDelegate.renderToString(_line))
    }

    // UI - PCFS
    // wizard screens
    if (_line.Fields.Count > 0 or _line.ChildCoverables.Count == 1 or _line.Exposures.Count > 0 or _line.Clauses.Count > 0) {
      file = createPath(LINEUIDIRECTORY.concat(new String[]{_line.LinePrefix.toLowerCase(), POLICY, _line.LinePrefix.concat(_line.TypeName + "Screen.pcf")}))
      addOrReplaceFile(file, \-> LineCoverableWizardScreen.renderToString(_line, _line))
    }
    // add line level child screens if they are needed
    if (_line.Fields.Count > FIELDMAX or _line.Fields.Count == 0 or _line.ChildCoverables.Count > 1 or _line.Exposures.Count > 0) {
      for (_child in _line.ChildCoverables.orderBy(\cc -> cc.Name)) {
        file = createPath(LINEUIDIRECTORY.concat(new String[]{_line.LinePrefix.toLowerCase(), POLICY, _line.LinePrefix.concat(_child.TypeName + "Screen.pcf")}))
        addOrReplaceFile(file, \-> LineCoverableWizardScreen.renderToString(_line, _child))
      }
    }
    // PolicyFile LocationGroup, Pages and Screens
    file = createPath(LINEUIDIRECTORY.concat(new String[]{_line.LinePrefix.toLowerCase(), POLICYFILE, _line.CodeIdentifier.concat("Links.pcf")}))
    addOrReplaceFile(file, \-> LineLinks.renderToString(_line, FIELDMAX))
    if (_line.Fields.Count > 0 or _line.ChildCoverables.Count == 1 or _line.Exposures.Count > 0 or _line.Clauses.Count > 0) {
      file = createPath(LINEUIDIRECTORY.concat(new String[]{_line.LinePrefix.toLowerCase(), POLICYFILE, "PolicyFile_" + _line.LinePrefix.concat(_line.TypeName + ".pcf")}))
      addOrReplaceFile(file, \-> LineCoverablePage.renderToString(_line, _line))
      file = createPath(LINEUIDIRECTORY.concat(new String[]{_line.LinePrefix.toLowerCase(), POLICYFILE, "PolicyFile_" + _line.LinePrefix.concat(_line.TypeName + "Screen.pcf")}))
      addOrReplaceFile(file, \-> PolicyFileCoverableScreen.renderToString(_line, _line))
    }
    // add line level child pages if they are needed
    if (_line.Fields.Count > FIELDMAX or _line.Fields.Count == 0 or _line.ChildCoverables.Count > 1 or _line.Exposures.Count > 0) {
      for (_child in _line.ChildCoverables.orderBy(\cc -> cc.Name)) {
        file = createPath(LINEUIDIRECTORY.concat(new String[]{_line.LinePrefix.toLowerCase(), POLICYFILE, "PolicyFile_" + _line.LinePrefix.concat(_child.TypeName + ".pcf")}))
        addOrReplaceFile(file, \-> LineCoverablePage.renderToString(_line, _child))
        file = createPath(LINEUIDIRECTORY.concat(new String[]{_line.LinePrefix.toLowerCase(), POLICYFILE, "PolicyFile_" + _line.LinePrefix.concat(_child.TypeName + "Screen.pcf")}))
        addOrReplaceFile(file, \-> PolicyFileCoverableScreen.renderToString(_line, _child))
      }
    }
    // add UI display properties for each language
    AllLanguages.each(\language -> {
      file = createPath(APDLanguageResolver.resolveDisplayPropertiesFilePaths(language))
      if (fileExists(file)) {
        // add the display literals to the end
        appendToFile(file, \-> PolicyLineUIDisplayProperties.renderToString(_product, _line, language), false)
      } else {
        addOrReplaceFile(file, \-> PolicyLineUIDisplayProperties.renderToString(_product, _line, language), false)
      }
    })

    /**Charge Breakdown integration with BillingCenter **/
    file = createPath(RESOURCESDIRECTORY.concat(new String[]{"systables.xml"}))
    insertContentsIfNoMatchFound(file, \-> Systables_Existing.renderToString(_line), "</Systables>", false)

    file = createPath(SYSTABLESDIRECTORY.concat(new String[]{"${_line.LinePrefix.toLowerCase()}costdef.xml"}))
    addOrReplaceFile(file, \-> CostDefinition.renderToString(_line))

    file = createPath(ENTITYDIRECTORY.concat(new String[]{_line.LinePrefix.concat("CostDefinition.eti")}))
    addOrReplaceFile(file, \-> CostDefinitionEntity.renderToString(_line))

    new ChargeBreakdownCategoryLookupCompositeGenerator(Context, _line).generate()
    /**End Charge Breakdown Integration codegen **/
  }
}