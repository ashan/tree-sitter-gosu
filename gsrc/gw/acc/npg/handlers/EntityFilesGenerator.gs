package gw.acc.npg.handlers

uses gw.acc.npg.exception.HandlerException
uses gw.acc.npg.model.Coverable
uses gw.acc.npg.model.ProductLine
uses gw.acc.npg.templates.entity.BaseCostEntity
uses gw.acc.npg.templates.entity.ConditionEntity
uses gw.acc.npg.templates.entity.CostSubtypeEntity
uses gw.acc.npg.templates.entity.CoverableEntity
uses gw.acc.npg.templates.entity.CoverageEntity
uses gw.acc.npg.templates.entity.ExclusionEntity
uses gw.acc.npg.templates.entity.InstalledPolicyLine
uses gw.acc.npg.templates.entity.LineEntity
uses gw.acc.npg.templates.entity.ModifierEntity
uses gw.acc.npg.templates.entity.OtherEntity
uses gw.acc.npg.templates.entity.RateFactorEntity
uses gw.acc.npg.templates.entity.PolicyPeriod
uses gw.acc.npg.templates.entity.TransactionEntity
uses gw.acc.npg.templates.entityname.ClauseName
uses gw.acc.npg.templates.entityname.CoverableName
uses gw.acc.npg.templates.entityname.TransactionName
uses gw.acc.npg.templates.entityname.ModifierName
uses gw.util.GosuStringUtil
uses org.slf4j.LoggerFactory

uses java.nio.file.Path

/**
 * Generator handler for generating entity files for provided {@link gw.acc.npg.model.ProductLine}
 * in {@link gw.acc.npg.handlers.Request}
 */
class EntityFilesGenerator extends AbstractGeneratorHandler {

  internal static final var EXTENSIONS: String = "Extensions"
  internal static final var ENTITY_NAMES: String = "displaynames"
  internal static final var ENTITY: String = "Entity"
  internal static final var TYPELIST: String = "Typelist"
  private static final var TRANSACTION_INSERTION_MATCHING_TEXT = "<!-- Insert transaction arrays for additional lines here -->"
  private static final var LOGGER = LoggerFactory.getLogger(EntityFilesGenerator)
  private var _absoluteAppPath: String

  /**
   * Handles request for generating all entity files required for new line of business
   * provided as {@link gw.acc.npg.model.ProductLine} in the {@link gw.acc.npg.handlers.Request}.
   *
   * @param req {@link gw.acc.npg.handlers.Request} carries information required to carried out processing for the handler
   */
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
      var newException = new HandlerException("Problem while generating entity files. ${ex.Message}", ex.getCause())
      logAndThrowException(LOGGER, newException)
    } catch (ex: Exception) {
      var newException = new HandlerException("Problem while generating entity files. Cause: ${ex.Message}", ex)
      logAndThrowException(LOGGER, newException)
    }
    _nextHandler?.handleRequest(req)
  }

  private function validateRequest(req: Request) {
    if (req == null) {
      var ex = new IllegalArgumentException("Problem while generating entity files. Cause: [req] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
    if (req.ProductLine == null) {
      var ex = new IllegalArgumentException("Problem while generating entity files. Cause: [ProductLine] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
  }

  function createEntityFilePath(fileName: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, EXTENSIONS, ENTITY}, new String[]{},
        new String[]{fileName})
  }

  function createEntityNameFilePath(fileName: String): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, ENTITY_NAMES}, new String[]{},
        new String[]{fileName})
  }

  function createEntityDirectoryPath(): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, EXTENSIONS, ENTITY}, new String[]{},
        new String[]{})
  }

  function createEntityNameDirectoryPath(): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, ENTITY_NAMES}, new String[]{},
        new String[]{})
  }

  function createTypeListDirectoryPath(): Path {
    return createPath(_absoluteAppPath, new String[]{MODULES, CONFIGURATION, CONFIG, EXTENSIONS, TYPELIST}, new String[]{},
        new String[]{})
  }

  override function generateFiles(productLine: ProductLine) {
    var directoryPath = createEntityDirectoryPath()
    createDirectoriesIfNotExists(directoryPath)
    createDirectoriesIfNotExists(createTypeListDirectoryPath())
    createDirectoriesIfNotExists(createEntityNameDirectoryPath())
    LOGGER.info("Generating entity files in directory: [{}]", directoryPath)
    generateProductFiles(productLine)
    generateCostFiles(productLine)
    generateCoverableFiles(productLine)
    generateOtherFiles(productLine)
    generateTypeListFiles(productLine)
    generateEntityNameFiles(productLine)
  }

  function generateCostFiles(productLine: ProductLine) {
    writeContents(BaseCostEntity.renderToString(productLine.BaseCost), createEntityFilePath(buildEntityFileName(productLine.BaseCost.EntityName)))
    productLine.Costs.each(\cost -> {
      writeContents(CostSubtypeEntity.renderToString(cost), createEntityFilePath(buildEntityFileName(cost.EntityName)))
    })
    productLine.Coverables.each(\coverable -> {
      coverable.Costs.each(\cost -> {
        writeContents(CostSubtypeEntity.renderToString(cost), createEntityFilePath(buildEntityFileName(cost.EntityName)))
      })
    })
  }

  function generateProductFiles(productLine: ProductLine) {
    writeContents(LineEntity.renderToString(productLine), createEntityFilePath(buildEntityFileName(productLine.EntityName)))
    writeContents(TransactionEntity.renderToString(productLine.Transaction), createEntityFilePath(buildEntityFileName(productLine.Transaction.EntityName)))
    writeContents(CoverageEntity.renderToString(productLine.Coverage), createEntityFilePath(buildEntityFileName(productLine.Coverage.EntityName)))
    insertContents(PolicyPeriod.renderToString(productLine), TRANSACTION_INSERTION_MATCHING_TEXT, createEntityFilePath("${productLine.PolicyPeriodName}.etx"))
    generateClauseFiles(productLine)
  }

  function generateEntityNameFiles(productLine: ProductLine) {
    writeContents(TransactionName.renderToString(productLine.Transaction), createEntityNameFilePath(buildEntityNameFileName(productLine.Transaction.EntityName)))
    generateNameFilesForCoverable(productLine)
    productLine.Coverables.each(\coverable -> {
      generateNameFilesForCoverable(coverable)
    })
  }

  function generateNameFilesForCoverable(coverable: Coverable) {
    if (not(coverable typeis ProductLine)) {
      writeContents(CoverableName.renderToString(coverable), createEntityNameFilePath(buildEntityNameFileName(coverable.EntityName)))
    }
    writeContents(ClauseName.renderToString(coverable.Coverage.EntityName), createEntityNameFilePath(buildEntityNameFileName(coverable.Coverage.EntityName)))
    if (coverable.IncludeExclusion) {
      writeContents(ClauseName.renderToString(coverable.Exclusion.EntityName), createEntityNameFilePath(buildEntityNameFileName(coverable.Exclusion.EntityName)))
    }
    if (coverable.IncludeCondition) {
      writeContents(ClauseName.renderToString(coverable.Condition.EntityName), createEntityNameFilePath(buildEntityNameFileName(coverable.Condition.EntityName)))
    }
    if (coverable.IncludeModifier) {
      writeContents(ModifierName.renderToString(coverable.Modifier.EntityName), createEntityNameFilePath(buildEntityNameFileName(coverable.Modifier.EntityName)))
      writeContents(ModifierName.renderToString(coverable.RateFactor.EntityName), createEntityNameFilePath(buildEntityNameFileName(coverable.RateFactor.EntityName)))
    }
  }

  function generateClauseFiles(coverable: Coverable) {
    if (coverable.IncludeExclusion) {
      writeContents(ExclusionEntity.renderToString(coverable.Exclusion), createEntityFilePath(buildEntityFileName(coverable.Exclusion.EntityName)))
    }
    if (coverable.IncludeModifier) {
      writeContents(ModifierEntity.renderToString(coverable.Modifier), createEntityFilePath(buildEntityFileName(coverable.Modifier.EntityName)))
      writeContents(RateFactorEntity.renderToString(coverable.RateFactor), createEntityFilePath(buildEntityFileName(coverable.RateFactor.EntityName)))
    }
    if (coverable.IncludeCondition) {
      writeContents(ConditionEntity.renderToString(coverable.Condition), createEntityFilePath(buildEntityFileName(coverable.Condition.EntityName)))
    }
  }

  function generateOtherFiles(productLine: ProductLine) {
    productLine.OtherEntities.each(\otherEntity -> {
      writeContents(OtherEntity.renderToString(otherEntity), createEntityFilePath(buildEntityFileName(otherEntity.EntityName)))
    })
  }

  function generateTypeListFiles(productLine: ProductLine) {
    writeContents(InstalledPolicyLine.renderToString(productLine), createPath(_absoluteAppPath,
        new String[]{MODULES, CONFIGURATION, CONFIG, EXTENSIONS, TYPELIST}, new String[]{},
        new String[]{"${productLine.InstalledPolicyLineName}.${productLine.Abbrevation}.ttx"}))
  }

  function generateCoverableFiles(productLine: ProductLine) {
    productLine.Coverables.each(\coverable -> {
      writeContents(CoverableEntity.renderToString(coverable), createEntityFilePath(buildEntityFileName(coverable.EntityName)))
      writeContents(CoverageEntity.renderToString(coverable.Coverage), createEntityFilePath(buildEntityFileName(coverable.Coverage.EntityName)))
      generateClauseFiles(coverable)
    })
  }

  function buildEntityFileName(entityName: String): String {
    return "${entityName}.eti"
  }

  function buildEntityNameFileName(entityName: String): String {
    return "${entityName}.en"
  }
}