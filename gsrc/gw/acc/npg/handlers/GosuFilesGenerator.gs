package gw.acc.npg.handlers

uses gw.acc.npg.exception.HandlerException
uses gw.acc.npg.model.ProductLine
uses gw.acc.npg.templates.gosu.AbstractCostData
uses gw.acc.npg.templates.gosu.PolicyLineConfiguration
uses gw.acc.npg.templates.gosu.CCPolicyGenerator
uses gw.acc.npg.templates.gosu.CCPolicyLineMapper800
uses gw.acc.npg.templates.gosu.CCPolicyLineMapper900
uses gw.acc.npg.templates.gosu.ConditionAdapter
uses gw.acc.npg.templates.gosu.ConditionMatcher
uses gw.acc.npg.templates.gosu.CostAdapter
uses gw.acc.npg.templates.gosu.CostDataImpl
uses gw.acc.npg.templates.gosu.CostMethods
uses gw.acc.npg.templates.gosu.CostMethodsImpl
uses gw.acc.npg.templates.gosu.CoverableAdapter
uses gw.acc.npg.templates.gosu.CoverableModifiableAdapter
uses gw.acc.npg.templates.gosu.CoverageAdapter
uses gw.acc.npg.templates.gosu.CoverageMatcher
uses gw.acc.npg.templates.gosu.DiffHelper
uses gw.acc.npg.templates.gosu.ExclusionAdapter
uses gw.acc.npg.templates.gosu.ExclusionMatcher
uses gw.acc.npg.templates.gosu.GenericCostMethodsImpl
uses gw.acc.npg.templates.gosu.LineConfiguration
uses gw.acc.npg.templates.gosu.LineEnhancement
uses gw.acc.npg.templates.gosu.LineValidation
uses gw.acc.npg.templates.gosu.ModifiableAdapter
uses gw.acc.npg.templates.gosu.ModifierAdapter
uses gw.acc.npg.templates.gosu.ModifierMatcher
uses gw.acc.npg.templates.gosu.PolicyLineMethods
uses gw.acc.npg.templates.gosu.QuoteDisplayUtil
uses gw.acc.npg.templates.gosu.RateFactorAdapter
uses gw.acc.npg.templates.gosu.RateFactorMatcher
uses gw.acc.npg.templates.gosu.RateRoutineConfig
uses gw.acc.npg.templates.gosu.RatingEngine
uses gw.acc.npg.templates.gosu.TransactionAdapter
uses gw.util.GosuStringUtil
uses org.slf4j.LoggerFactory

uses java.nio.file.Path

/**
 * Generator handler for generating gosu files for provided {@link gw.acc.npg.model.ProductLine}
 * in {@link gw.acc.npg.handlers.Request}
 */
class GosuFilesGenerator extends AbstractGeneratorHandler {

  private static final var LOGGER = LoggerFactory.getLogger(GosuFilesGenerator)
  private static final var GW = "gw"
  private static final var WEBSERVICE = "webservice"
  private static final var PC = "pc"
  private static final var POLICY = "policy"
  private static final var LOB = "lob"
  private static final var GW_LOB = "gw.lob"
  private static final var PC800 = "pc800"
  private static final var PC900 = "pc900"
  private static final var CCINTEGRATION = "ccintegration"
  private static final var POLICYLINECONFIGURATION = "PolicyLineConfiguration"
  private static final var POLICY_LINE_INSERTION_MATCHING_TEXT = "// Add additional policy lines here"
  private var _absoluteAppPath: String

  override function handleRequest(req: Request) {
    validateRequest(req)
    try {
      if (GosuStringUtil.isBlank(req.AbsoluteAppPath)) {
        LOGGER.warn("Application path is not specified. Default path: [{}] will be used.", APPLICATION_PATH)
        req.AbsoluteAppPath = APPLICATION_PATH
      }
      _absoluteAppPath = req.AbsoluteAppPath
      generateFiles(req.ProductLine)
    } catch (ex: HandlerException) {
      var newException = new HandlerException("Problem while generating gosu files. ${ex.Message}", ex.getCause())
      logAndThrowException(LOGGER, newException)
    } catch (ex: Exception) {
      var newException = new HandlerException("Problem while generating gosu files. Cause: ${ex.Message}", ex)
      logAndThrowException(LOGGER, newException)
    }
    _nextHandler?.handleRequest(req)
  }

  private function validateRequest(req: Request) {
    if (req == null) {
      var ex = new IllegalArgumentException("Problem while generating gosu files. Cause: [req] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
    if (req.ProductLine == null) {
      var ex = new IllegalArgumentException("Problem while generating gosu files. Cause: [ProductLine] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
  }

  override function generateFiles(productLine: ProductLine) {
    LOGGER.info("Generating entity files in package: [{}]", productLine.LOBPackageName)
    var packageTokens = productLine.LOBPackageName.split("\\.")
    createDirectories(packageTokens, productLine.AbbrevationLowerCase)
    generateProductFiles(productLine, packageTokens)
    generateCoverableFiles(productLine, packageTokens)
    generateCostFiles(productLine, packageTokens)
  }

  private function generateProductFiles(productLine: ProductLine, packageTokens: String[]): void {
    writeContents(GenericCostMethodsImpl.renderToString(productLine.BaseCost), createFinancialFilePath(buildFileName(productLine.BaseCost.GenericCostMethodsImplName), packageTokens))
    writeContents(CostAdapter.renderToString(productLine.BaseCost), createFinancialFilePath(buildFileName(productLine.BaseCost.CostAdapterImplName), packageTokens))
    writeContents(CostMethods.renderToString(productLine.BaseCost), createFinancialFilePath(buildFileName(productLine.BaseCost.CostMethodsInterfaceName), packageTokens))
    writeContents(CostMethodsImpl.renderToString(productLine.BaseCost, productLine), createFinancialFilePath(buildFileName(productLine.BaseCost.CostMethodsImplName), packageTokens))
    writeContents(AbstractCostData.renderToString(productLine.BaseCost), createRatingFilePath(buildFileName(productLine.BaseCost.CostDataImplName), packageTokens))
    writeContents(RateRoutineConfig.renderToString(productLine), createRatingFilePath(buildFileName(productLine.RateRoutineConfigName), packageTokens))
    writeContents(RatingEngine.renderToString(productLine), createRatingFilePath(buildFileName(productLine.RatingEngineName), packageTokens))
    writeContents(DiffHelper.renderToString(productLine), createClauseFilePath(buildFileName(productLine.DiffHelperName), packageTokens))
    writeContents(LineEnhancement.renderToString(productLine), createClauseFilePath("${productLine.EnhancementName}.gsx", packageTokens))
    writeContents(LineValidation.renderToString(productLine), createClauseFilePath(buildFileName(productLine.ValidationName), packageTokens))
    writeContents(PolicyLineMethods.renderToString(productLine), createClauseFilePath(buildFileName(productLine.PolicyLineMethodsImplName), packageTokens))
    writeContents(QuoteDisplayUtil.renderToString(productLine), createFinancialFilePath(buildFileName(productLine.QuoteDisplayUtilName), packageTokens))
    writeContents(CoverageAdapter.renderToString(productLine), createClauseFilePath(buildFileName(productLine.Coverage.CoverageAdapterImplName), packageTokens))
    writeContents(TransactionAdapter.renderToString(productLine.Transaction), createFinancialFilePath(buildFileName(productLine.Transaction.TransactionAdapterImplName), packageTokens))
    writeContents(LineConfiguration.renderToString(productLine), createClauseFilePath(buildFileName(productLine.LineConfigurationName), packageTokens))
    writeContents(CCPolicyLineMapper800.renderToString(productLine), createCCPolicyLineMapperFilePath(buildFileName(productLine.CCPolicyLineMapperName), PC800))
    writeContents(CCPolicyLineMapper900.renderToString(productLine), createCCPolicyLineMapperFilePath(buildFileName(productLine.CCPolicyLineMapperName), PC900))
    if (productLine.PackageName != GW_LOB) {
      insertContents(PolicyLineConfiguration.renderToString(productLine), POLICY_LINE_INSERTION_MATCHING_TEXT, createPolicyFilePath(buildFileName(POLICYLINECONFIGURATION)))
    }
    insertContents(CCPolicyGenerator.renderToString(productLine, PC800), POLICY_LINE_INSERTION_MATCHING_TEXT, createCCPolicyGeneratorFilePath(buildFileName(productLine.CCPolicyGeneratorName), PC800))
    insertContents(CCPolicyGenerator.renderToString(productLine, PC900), POLICY_LINE_INSERTION_MATCHING_TEXT, createCCPolicyGeneratorFilePath(buildFileName(productLine.CCPolicyGeneratorName), PC900))
  }

  private function generateCoverableFiles(productLine: ProductLine, packageTokens: String[]): void {
    productLine.Coverables.each(\coverable -> {
      generateClauseFiles(coverable, packageTokens, productLine.LineTypeKey)
      writeContents(CoverageAdapter.renderToString(coverable), createClauseFilePath(buildFileName(coverable.Coverage.CoverageAdapterImplName), packageTokens))
    })
    generateClauseFiles(productLine, packageTokens, productLine.LineTypeKey)
  }

  private function generateClauseFiles(coverable: gw.acc.npg.model.Coverable, packageTokens: String[], lineTypeKeyName: String): void {
    writeContents(CoverableAdapter.renderToString(coverable, lineTypeKeyName), createClauseFilePath(buildFileName(coverable.CoverableAdapterImplName), packageTokens))
    writeContents(CoverageMatcher.renderToString(coverable), createClauseFilePath(buildFileName(coverable.Coverage.CoverageMatcherImplName), packageTokens))

    if (coverable.IncludeExclusion) {
      writeContents(ExclusionAdapter.renderToString(coverable), createClauseFilePath(buildFileName(coverable.Exclusion.ExclusionAdapterImplName), packageTokens))
      writeContents(ExclusionMatcher.renderToString(coverable), createClauseFilePath(buildFileName(coverable.Exclusion.ExclusionMatcherImplName), packageTokens))
    }
    if (coverable.IncludeModifier) {
      writeContents(ModifierAdapter.renderToString(coverable), createClauseFilePath(buildFileName(coverable.Modifier.ModifierAdapterImplName), packageTokens))
      writeContents(ModifierMatcher.renderToString(coverable), createClauseFilePath(buildFileName(coverable.Modifier.ModifierMatcherImplName), packageTokens))
      writeContents(RateFactorAdapter.renderToString(coverable), createClauseFilePath(buildFileName(coverable.RateFactor.RateFactorAdapterImplName), packageTokens))
      writeContents(RateFactorMatcher.renderToString(coverable), createClauseFilePath(buildFileName(coverable.RateFactor.RateFactorMatcherImplName), packageTokens))
      writeContents(ModifiableAdapter.renderToString(coverable), createClauseFilePath(buildFileName(coverable.ModifiableAdapterImplName), packageTokens))
      writeContents(CoverableModifiableAdapter.renderToString(coverable), createClauseFilePath(buildFileName(coverable.CoverableModifiableAdapterImplName), packageTokens))
    }
    if (coverable.IncludeCondition) {
      writeContents(ConditionAdapter.renderToString(coverable), createClauseFilePath(buildFileName(coverable.Condition.ConditionAdapterImplName), packageTokens))
      writeContents(ConditionMatcher.renderToString(coverable), createClauseFilePath(buildFileName(coverable.Condition.ConditionMatcherImplName), packageTokens))
    }
  }

  private function generateCostFiles(productLine: ProductLine, packageTokens: String[]): void {
    productLine.Costs.each(\cost -> {
      writeContents(CostDataImpl.renderToString(cost), createRatingFilePath(buildFileName(cost.CostDataImplName), packageTokens))
      if (cost.Coverable != null) {
        writeContents(CostMethodsImpl.renderToString(cost, productLine), createFinancialFilePath(buildFileName(cost.CostMethodsImplName), packageTokens))
      }
    })
    productLine.Coverables.each(\coverable -> {
      coverable.Costs.each(\cost -> {
        writeContents(CostDataImpl.renderToString(cost), createRatingFilePath(buildFileName(cost.CostDataImplName), packageTokens))
        writeContents(CostMethodsImpl.renderToString(cost, productLine), createFinancialFilePath(buildFileName(cost.CostMethodsImplName), packageTokens))
      })
    })
  }

  private function createPolicyFilePath(fileName: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, GSRC}, new String[]{GW, POLICY}, new String[]{fileName})
  }

  private function createFinancialFilePath(fileName: String, packageTokens: String[]): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, GSRC}, packageTokens, new String[]{FINANCIALS, fileName})
  }

  private function createRatingFilePath(fileName: String, packageTokens: String[]): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, GSRC}, packageTokens, new String[]{RATING, fileName})
  }

  function createClauseFilePath(fileName: String, packageTokens: String[]): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, GSRC}, packageTokens, new String[]{fileName})
  }

  function createCCPolicyGeneratorFilePath(fileName: String, pcVersion: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, GSRC}, new String[]{GW, WEBSERVICE, PC, pcVersion, CCINTEGRATION}, new String[]{fileName})
  }

  function createCCPolicyLineMapperFilePath(fileName: String, pcVersion: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, GSRC}, new String[]{GW, WEBSERVICE, PC, pcVersion, CCINTEGRATION, LOB}, new String[]{fileName})
  }

  private function createDirectories(packageTokens: String[], lineAbbLower: String) {
    createClauseDirectory(packageTokens)
    createRatingDirectory(packageTokens)
    createFinancialDirectory(packageTokens)
  }

  private function createRatingDirectory(packageTokens: String[]) {
    var directoryPath = createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, GSRC}, packageTokens, new String[]{RATING})
    createDirectoriesIfNotExists(directoryPath)
  }

  private function createClauseDirectory(packageTokens: String[]) {
    var directoryPath = createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, GSRC}, packageTokens, new String[]{})
    createDirectoriesIfNotExists(directoryPath)
  }

  private function createFinancialDirectory(packageTokens: String[]) {
    var directoryPath = createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, GSRC}, packageTokens, new String[]{FINANCIALS})
    createDirectoriesIfNotExists(directoryPath)
  }

  private function buildFileName(fileName: String): String {
    return "${fileName}.gs"
  }
}