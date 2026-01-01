package gw.acc.npg.handlers

uses gw.acc.npg.builders.BaseProductModelBuilder
uses gw.acc.npg.builders.CostBuilder
uses gw.acc.npg.builders.CoverableBuilder
uses gw.acc.npg.builders.FieldBuilder
uses gw.acc.npg.builders.OtherEntityBuilder
uses gw.acc.npg.builders.ProductLineBuilder
uses gw.acc.npg.exception.HandlerException
uses gw.acc.npg.model.BaseCost
uses gw.acc.npg.model.ColumnType
uses gw.acc.npg.model.Coverable
uses gw.acc.npg.model.ProductLine
uses gw.acc.npg.schema.line_of_business.Product
uses gw.acc.npg.schema.line_of_business.anonymous.elements.Cost_AdditionalFields_Field
uses gw.acc.npg.schema.line_of_business.anonymous.elements.Coverable_AdditionalFields_Field
uses gw.acc.npg.schema.line_of_business.anonymous.elements.Entity_Fields_Field
uses gw.acc.npg.schema.line_of_business.anonymous.elements.Line_AdditionalFields_Field
uses gw.util.GosuStringUtil
uses org.slf4j.LoggerFactory

/**
 * Transformer handler for transforming {@link gw.acc.npg.schema.line_of_business.Product}
 * to {@link gw.acc.npg.model.ProductLine} provided in {@link gw.acc.npg.handlers.Request}
 */
class ModelTransformer extends AbstractHandler {

  private static final var LOGGER = LoggerFactory.getLogger(ModelTransformer)
  private static final var DEFAULT_PACKAGE = "gw.lob"

  /**
   * Handles request for transforming xml {@link gw.acc.npg.schema.line_of_business.Product} model
   * to {@link gw.acc.npg.model.ProductLine} provided in {@link gw.acc.npg.handlers.Request}
   *
   * @param req Request carries information required to carried out processing for the handler
   */
  override function handleRequest(req: Request) {
    validateRequest(req)
    if (GosuStringUtil.isBlank(req.PackageName)) {
      LOGGER.warn("Package name not specified, using default package: [gw.lob] will be used.")
      req.PackageName = DEFAULT_PACKAGE
    }
    try {
      req.ProductLine = transformXMLModelToProductLine(req.XMLProductModel, req.PackageName)
    } catch (ex: Exception) {
      var newException = new HandlerException("Problem while transforming xml product model. Cause: ${ex.Message}", ex)
      logAndThrowException(LOGGER, newException)
    }
    _nextHandler?.handleRequest(req)
  }

  private function validateRequest(req: Request) {
    if (req == null) {
      var ex = new IllegalArgumentException("Problem while transforming xml product model. Cause: [req] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
    if (req.XMLProductModel == null) {
      var ex = new IllegalArgumentException("Problem while transforming xml product model. Cause: [XMLProductModel] can't be null.")
      logAndThrowException(LOGGER, ex)
    }
  }

  private function transformXMLModelToProductLine(product: Product, packageName: String): ProductLine {
    var productLineBuilder = ProductLineBuilder.createBuilder()
    populateBaseModelInfo(product, productLineBuilder, packageName)
    productLineBuilder.withEntityName(product.Line.EntityName)
        .withLineCode(product.Line.Code)
        .withProductCode(product.Code)
        .withIncludeModifiers(product.Line.IncludeModifiers)
        .withIncludeConditions(product.Line.IncludeConditions)
        .withIncludeExclusions(product.Line.IncludeExclusions)
        .withDescription(product.DisplayName)
        .withAttachToBuilding(false)
    if (product.Line.AdditionalFields != null) {
      product.Line.AdditionalFields.Field.each(\field -> {
        productLineBuilder.withAdditionalField(transformLineField(field))
      })
    }
    transformOtherEntities(product, packageName, productLineBuilder)
    var productLine = productLineBuilder.build()
    transformCoverables(product, packageName, productLine)
    transformCosts(product, packageName, productLine)
    return productLine

  }

  private function transformOtherEntities(product: Product, packageName: String, productLineBuilder: ProductLineBuilder) {
    product?.OtherEntities?.Entity?.each(\entity -> {
      var entityBuilder = OtherEntityBuilder.createBuilder()
      populateBaseModelInfo(product, entityBuilder, packageName)
      entityBuilder.withEntityName(entity.Name)
          .withDescription(entity.Description)
      entity?.Fields?.Field.each(\field -> entityBuilder.withField(transformEntityField(field)))
      productLineBuilder.withOtherEntity(entityBuilder.build())
    })
  }

  private function transformCoverables(product: Product, packageName: String, productLine: ProductLine) {
    var coverablesMap: Map<String, Coverable> = new HashMap<String, Coverable>()
    coverablesMap.put(productLine.EntityName, productLine)
    product.Coverables.Coverable.each(\coverable -> {
      var coverableBuilder = CoverableBuilder.createBuilder()
      populateBaseModelInfo(product, coverableBuilder, packageName)
      coverableBuilder.withEntityName(coverable.EntityName)
          .withDescription(coverable.Description)
          .withReferredFrom(coverable.ReferredFrom)
          .withReferenceName(coverable.ReferenceName)
          .withIncludeModifiers(product.Line.IncludeModifiers)
          .withIncludeConditions(product.Line.IncludeConditions)
          .withIncludeExclusions(product.Line.IncludeExclusions)
          .withAttachToBuilding(coverable.AttachedToBuilding)
          .withAttachToLocation(coverable.AttachedToLocation)
          .withReferredFromCoverable(coverablesMap.get(coverable.ReferredFrom))
      if (coverable.AdditionalFields != null) {
        coverable.AdditionalFields.Field.each(\field -> {
          coverableBuilder.withAdditionalField(transformCoverableField(field))
        })
      }
      var transformedCoverable = coverableBuilder.build()
      coverablesMap.put(coverable.EntityName, transformedCoverable)
      productLine.Coverables.add(transformedCoverable)
    })
  }


  private function transformCosts(product: Product, packageName: String, productLine: ProductLine) {
    var costMap: Map<String, BaseCost> = new HashMap<String, BaseCost>()
    costMap.put(productLine.BaseCost.EntityName, productLine.BaseCost)
    product.Costs.Cost.each(\cost -> {
      var costBuilder = CostBuilder.createBuilder()
      populateBaseModelInfo(product, costBuilder, packageName)
      costBuilder.withEntityName(cost.EntityName)
          .withDescription(cost.Description)
          .withSuperEntityName(cost.SupertypeEntity)
          .withParentCost(costMap.get(cost.SupertypeEntity))

      if (cost.CoverableEntityName != null) {
        costBuilder.withCoverable(findCoverableInProductLine(cost.CoverableEntityName, productLine))
      }
      if (cost.CoverableEntityForCoverage != null) {
        costBuilder.withCoverage(findCoverableInProductLine(cost.CoverableEntityForCoverage, productLine).Coverage)
      }
      costBuilder.withReferenceName(cost.ReferenceName)
      if (cost.AdditionalFields != null) {
        cost.AdditionalFields.Field.each(\field -> {
          costBuilder.withAdditionalField(transformCostField(field))
        })
      }
      var newCost = costBuilder.build()
      costMap.put(newCost.EntityName, newCost)
      if (newCost.Coverable != null) {
        newCost.Coverable.Costs.add(newCost)
      } else {
        productLine.Costs.add(newCost)
      }
    })
  }

  private function findCoverableInProductLine(coverableEntityName: String, productLine: ProductLine): Coverable {
    if (productLine.EntityName == coverableEntityName) {
      return productLine
    }
    return productLine.Coverables.firstWhere(\cov -> cov.EntityName == coverableEntityName)
  }

  private function transformCostField(field: Cost_AdditionalFields_Field): gw.acc.npg.model.Field {
    var transformedField = FieldBuilder.createBuilder()
        .withColumnType(ColumnType.fromTypeName(field.getType().StringValue))
        .withName(field.Name)
        .withDescription(field.Desc)
        .withFkEntity(field.Fkentity)
        .withNullOk(field.Nullok)
        .withArrayEntity(field.Arrayentity)
        .withCascadeDelete(field.CascadeDelete)
        .withCostKeyField(field.Costkeyfield)
        .withOwner(field.Owner)
        .withSize(field.Size as Integer)
        .withPrecision(field.Precision as Integer)
        .withScale(field.Scale as Integer)
        .withTypelist(field.Typelist)
        .build()
    return transformedField
  }

  private function transformCoverableField(field: Coverable_AdditionalFields_Field): gw.acc.npg.model.Field {
    var transformedField = FieldBuilder.createBuilder()
        .withColumnType(ColumnType.fromTypeName(field.getType().StringValue))
        .withName(field.Name)
        .withDescription(field.Desc)
        .withFkEntity(field.Fkentity)
        .withNullOk(field.Nullok)
        .withArrayEntity(field.Arrayentity)
        .withCascadeDelete(field.CascadeDelete)
        .withOwner(field.Owner)
        .withSize(field.Size as Integer)
        .withPrecision(field.Precision as Integer)
        .withScale(field.Scale as Integer)
        .withTypelist(field.Typelist)
        .build()
    return transformedField
  }

  private function transformEntityField(field: Entity_Fields_Field): gw.acc.npg.model.Field {
    var transformedField = FieldBuilder.createBuilder()
        .withColumnType(ColumnType.fromTypeName(field.getType().StringValue))
        .withName(field.Name)
        .withDescription(field.Desc)
        .withFkEntity(field.Fkentity)
        .withNullOk(field.Nullok)
        .withArrayEntity(field.Arrayentity)
        .withCascadeDelete(field.CascadeDelete)
        .withOwner(field.Owner)
        .withSize(field.Size as Integer)
        .withPrecision(field.Precision as Integer)
        .withScale(field.Scale as Integer)
        .withTypelist(field.Typelist)
        .build()
    return transformedField
  }

  private function transformLineField(field: Line_AdditionalFields_Field): gw.acc.npg.model.Field {
    var transformedField = FieldBuilder.createBuilder()
        .withColumnType(ColumnType.fromTypeName(field.getType().StringValue))
        .withName(field.Name)
        .withDescription(field.Desc)
        .withFkEntity(field.Fkentity)
        .withNullOk(field.Nullok)
        .withArrayEntity(field.Arrayentity)
        .withCascadeDelete(field.CascadeDelete)
        .withOwner(field.Owner)
        .withSize(field.Size as Integer)
        .withPrecision(field.Precision as Integer)
        .withScale(field.Scale as Integer)
        .withTypelist(field.Typelist)
        .build()
    return transformedField
  }

  private function populateBaseModelInfo(product: Product, baseModelBuilder: BaseProductModelBuilder, packageName: String) {
    baseModelBuilder.withPackageName(packageName)
        .withSuffix(product.SuffixForEntity)
        .withAbbrevation(product.Abbreviation)
        .withLineDisplayName(product.DisplayName)
        .withLineEntityName(product.Line.EntityName)
  }
}