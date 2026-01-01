package gw.acc.npg.handlers

uses gw.acc.npg.exception.HandlerException
uses gw.acc.npg.model.ProductLine
uses gw.acc.npg.templates.pcf.CoverableCoveragesDV
uses gw.acc.npg.templates.pcf.CoverableDetailsDV
uses gw.acc.npg.templates.pcf.CoverablePanelSet
uses gw.acc.npg.templates.pcf.CoverableScreen
uses gw.acc.npg.templates.pcf.DiffTree
uses gw.acc.npg.templates.pcf.DisplayProperties
uses gw.acc.npg.templates.pcf.LineCoveragesScreen
uses gw.acc.npg.templates.pcf.LineStandardCoveragesDV
uses gw.acc.npg.templates.pcf.LineWizardStepSet
uses gw.acc.npg.templates.pcf.PolicyFileCoverable
uses gw.acc.npg.templates.pcf.PolicyFileForms
uses gw.acc.npg.templates.pcf.PolicyFileLineCoverages
uses gw.acc.npg.templates.pcf.PolicyLineSummaryPanelSet
uses gw.acc.npg.templates.pcf.PolicyMenuItemSet
uses gw.acc.npg.templates.pcf.RatingCumulDetailsPanelSet
uses gw.acc.npg.templates.pcf.RatingOverrideCostLV
uses gw.acc.npg.templates.pcf.RatingOverridePanelSet
uses gw.acc.npg.templates.pcf.RatingTxDetailsPanelSet
uses gw.util.GosuStringUtil
uses org.slf4j.LoggerFactory

uses java.nio.file.Path

/**
 * Generator handler for generating pcfs and display keys for provided {@link ProductLine}
 * in {@link Request}
 */
class PCFGenerator extends AbstractGeneratorHandler {

  internal static final var RESOURCES: String = "resources"
  internal static final var DIFF: String = "diff"
  internal static final var PAGE_CONFIGURATION: String = "web"

  internal static final var LOCALIZATIONS: String = "locale"
  internal static final var PCF: String = "pcf"
  internal static final var LINE: String = "line"
  internal static final var JOB: String = "job"
  internal static final var POLICY_FILE: String = "policyfile"
  internal static final var POLICY: String = "policy"
  private static final var LOGGER = LoggerFactory.getLogger(PCFGenerator)
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
      var newException = new HandlerException("Problem while generating pcfs. ${ex.Message}", ex.getCause())
      logAndThrowException(LOGGER, newException)
    } catch (ex: Exception) {
      var newException = new HandlerException("Problem while generating pcfs. Cause: ${ex.Message}", ex)
      logAndThrowException(LOGGER, newException)
    }
    _nextHandler?.handleRequest(req)
  }

  private function validateRequest(req: Request) {
    if (req == null) {
      var ex = new IllegalArgumentException("Problem while generating pcfs. Cause: [req] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
    if (req.ProductLine == null) {
      var ex = new IllegalArgumentException("Problem while generating pcfs. Cause: [ProductLine] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
  }

  override function generateFiles(productLine: ProductLine) {
    createDirectories(productLine.AbbrevationLowerCase)
    generateProductFiles(productLine)
    generateCoverableFiles(productLine)
  }

  private function generateProductFiles(productLine: ProductLine): void {
    writeContents(LineWizardStepSet.renderToString(productLine), createJobFilePath(buildFileName(productLine.LineWizardName), productLine.AbbrevationLowerCase))
    appendContents(DisplayProperties.renderToString(productLine), createDisplayPropertyFilePath(productLine.DisplayPropertiesName))
    writeContents(DiffTree.renderToString(productLine), createDiffFilePath("${productLine.DiffTreeName}.xml"))

    writeContents(LineCoveragesScreen.renderToString(productLine), createPolicyFilePath(buildFileName(productLine.LineCoveragesScreenName), productLine.AbbrevationLowerCase))
    writeContents(LineStandardCoveragesDV.renderToString(productLine), createPolicyFilePath(buildFileName(productLine.LineStandardCoveragesDVName), productLine.AbbrevationLowerCase))
    writeContents(RatingOverrideCostLV.renderToString(productLine), createPolicyFilePath(buildFileName(productLine.RatingOverrideCostLVName), productLine.AbbrevationLowerCase))
    writeContents(PolicyLineSummaryPanelSet.renderToString(productLine), createPolicyFilePath("${productLine.PolicyLineSummaryPanelSetName}.${productLine.LineCode}.pcf", productLine.AbbrevationLowerCase))
    writeContents(RatingCumulDetailsPanelSet.renderToString(productLine), createPolicyFilePath("${productLine.RatingCumulDetailsPanelSetName}.${productLine.LineCode}.pcf", productLine.AbbrevationLowerCase))
    writeContents(RatingOverridePanelSet.renderToString(productLine), createPolicyFilePath("${productLine.RatingOverridePanelSetName}.${productLine.LineCode}.pcf", productLine.AbbrevationLowerCase))
    writeContents(RatingTxDetailsPanelSet.renderToString(productLine), createPolicyFilePath("${productLine.RatingTxDetailsPanelSetName}.${productLine.LineCode}.pcf", productLine.AbbrevationLowerCase))

    writeContents(PolicyFileForms.renderToString(productLine), createPolicyFileFilePath(buildFileName(productLine.PolicyFileFormsName), productLine.AbbrevationLowerCase))
    writeContents(PolicyFileLineCoverages.renderToString(productLine), createPolicyFileFilePath(buildFileName(productLine.PolicyFileLineCoveragesName), productLine.AbbrevationLowerCase))
    writeContents(PolicyMenuItemSet.renderToString(productLine), createPolicyFileFilePath("${productLine.PolicyMenuItemSetName}.${productLine.ProductCode}.pcf", productLine.AbbrevationLowerCase))

  }

  private function generateCoverableFiles(productLine: ProductLine) {
    productLine.Coverables.each(\coverable -> {
      writeContents(CoverableCoveragesDV.renderToString(coverable), createPolicyFilePath(buildFileName(coverable.CoverableCoveragesDVName), productLine.AbbrevationLowerCase))
      writeContents(CoverableDetailsDV.renderToString(coverable), createPolicyFilePath(buildFileName(coverable.CoverableDetailsDVName), productLine.AbbrevationLowerCase))
      writeContents(CoverablePanelSet.renderToString(coverable), createPolicyFilePath(buildFileName(coverable.CoverablePanelSetName), productLine.AbbrevationLowerCase))
      writeContents(CoverableScreen.renderToString(coverable), createPolicyFilePath(buildFileName(coverable.CoverableScreenName), productLine.AbbrevationLowerCase))
      writeContents(PolicyFileCoverable.renderToString(coverable), createPolicyFileFilePath(buildFileName(coverable.PolicyFileCoverableName), productLine.AbbrevationLowerCase))
    })
  }

  private function createDiffFilePath(fileName: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, RESOURCES, DIFF}, new String[]{}, new String[]{fileName})
  }

  private function createJobFilePath(fileName: String, lineAbrevationLowerCase: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, PAGE_CONFIGURATION, PCF}, new String[]{LINE, lineAbrevationLowerCase, JOB}, new String[]{fileName})
  }

  private function createPolicyFilePath(fileName: String, lineAbrevationLowerCase: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, PAGE_CONFIGURATION, PCF}, new String[]{LINE, lineAbrevationLowerCase, POLICY}, new String[]{fileName})
  }

  function createPolicyFileFilePath(fileName: String, lineAbrevationLowerCase: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, PAGE_CONFIGURATION, PCF}, new String[]{LINE, lineAbrevationLowerCase, POLICY_FILE}, new String[]{fileName})
  }

  function createDisplayPropertyFilePath(fileName: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, LOCALIZATIONS}, new String[]{}, new String[]{fileName})
  }

  private function createDirectories(lineAbrevationLowerCase: String) {
    createJobDirectory(lineAbrevationLowerCase)
    createPolicyDirectory(lineAbrevationLowerCase)
    createPolicyFileDirectory(lineAbrevationLowerCase)
  }

  private function createJobDirectory(lineAbrevationLowerCase: String) {
    var directoryPath = createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, PAGE_CONFIGURATION, PCF}, new String[]{LINE, lineAbrevationLowerCase, JOB}, new String[]{})
    createDirectoriesIfNotExists(directoryPath)
  }

  private function createPolicyDirectory(lineAbrevationLowerCase: String) {
    var directoryPath = createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, PAGE_CONFIGURATION, PCF}, new String[]{LINE, lineAbrevationLowerCase, POLICY}, new String[]{})
    createDirectoriesIfNotExists(directoryPath)
  }

  private function createPolicyFileDirectory(lineAbrevationLowerCase: String) {
    var directoryPath = createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, PAGE_CONFIGURATION, PCF}, new String[]{LINE, lineAbrevationLowerCase, POLICY_FILE}, new String[]{})
    createDirectoriesIfNotExists(directoryPath)
  }

  private function buildFileName(fileName: String): String {
    return "${fileName}.pcf"
  }
}