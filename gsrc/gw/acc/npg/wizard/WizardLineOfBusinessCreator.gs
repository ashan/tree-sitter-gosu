package gw.acc.npg.wizard

uses gw.acc.npg.builders.BaseProductModelBuilder
uses gw.acc.npg.builders.CostBuilder
uses gw.acc.npg.builders.CoverableBuilder
uses gw.acc.npg.builders.FieldBuilder
uses gw.acc.npg.builders.OtherEntityBuilder
uses gw.acc.npg.builders.ProductLineBuilder
uses gw.acc.npg.model.BaseCost
uses gw.acc.npg.model.Coverable
uses gw.acc.npg.model.ProductLine

/**
 * Holds the data of the steps of the {@link ProductLine} creator wizard
 * to create a ProductLine from them
 */
class WizardLineOfBusinessCreator {

  private var _productInfoStepDTO: ProductInfoStepDTO
  private var _coverableStepDTOs: Set<CoverableStepDTO>
  private var _costsStepDTOs: Set<CostStepDTO>
  private var _otherEntitiesStepDTOs: Set<OtherEntityStepDTO>

  public construct(productInfoStepDTO: ProductInfoStepDTO, coverableStepDTOs: Set<CoverableStepDTO>,
                   costsStepDTOs: Set<CostStepDTO>, otherEntitiesStepDTOs: Set<OtherEntityStepDTO>) {
    _productInfoStepDTO = productInfoStepDTO
    _otherEntitiesStepDTOs = otherEntitiesStepDTOs
    _coverableStepDTOs = coverableStepDTOs
    _costsStepDTOs = costsStepDTOs
  }

  /**
   * Creates a ProductLine from the data of the steps of the wizard
   */
  public function createProductLine(): ProductLine {
    var productLineBuilder = ProductLineBuilder.createBuilder()
    populateBaseModelInfo(productLineBuilder)
    productLineBuilder.withEntityName(_productInfoStepDTO.LineEntityName)
        .withLineCode(_productInfoStepDTO.LineCode)
        .withProductCode(_productInfoStepDTO.ProductCode)
        .withIncludeModifiers(_productInfoStepDTO.LineIncludeModifiers)
        .withIncludeConditions(_productInfoStepDTO.LineIncludeConditions)
        .withIncludeExclusions(_productInfoStepDTO.LineIncludeExclusions)
        .withDescription(_productInfoStepDTO.ProductDisplayName)
        .withAttachToBuilding(false)
    _productInfoStepDTO.Fields.each(\field -> {
      productLineBuilder.withAdditionalField(transformField(field))
    })
    transformOtherEntities(productLineBuilder)
    var productLine = productLineBuilder.build()
    createCoverables(productLine)
    createCosts(productLine)
    return productLine
  }

  private function populateBaseModelInfo(baseModelBuilder: BaseProductModelBuilder) {
    baseModelBuilder.withPackageName(_productInfoStepDTO.PackageName)
        .withSuffix(_productInfoStepDTO.ProductEntitySuffix)
        .withAbbrevation(_productInfoStepDTO.ProductAbbreviation)
        .withLineDisplayName(_productInfoStepDTO.ProductDisplayName)
        .withLineEntityName(_productInfoStepDTO.LineEntityName)
  }

  private function transformField(field: WizardFieldDTO): gw.acc.npg.model.Field {
    var transformedField = FieldBuilder.createBuilder()
        .withColumnType(field.ColumnType)
        .withName(field.Name)
        .withDescription(field.Desc)
        .withFkEntity(field.Fkentity)
        .withNullOk(field.Nullok)
        .withArrayEntity(field.Arrayentity)
        .withCascadeDelete(field.CascadeDelete)
        .withOwner(field.Owner)
        .withSize(field.Size)
        .withScale(field.Scale)
        .withPrecision(field.Precision)
        .withTypelist(field.Typelist)
        .build()
    return transformedField
  }

  private function transformOtherEntities(productLineBuilder: ProductLineBuilder) {
    _otherEntitiesStepDTOs.each(\entity -> {
      var entityBuilder = OtherEntityBuilder.createBuilder()
      populateBaseModelInfo(entityBuilder)
      entityBuilder.withEntityName(entity.EntityName)
          .withDescription(entity.Description)
      if (entity.Fields != null) {
        entity.Fields.each(\field -> {
          entityBuilder.withField(transformField(field))
        })

      }
      productLineBuilder.withOtherEntity(entityBuilder.build())
    })
  }

  private function createCoverables(productLine: ProductLine) {
    _coverableStepDTOs.each(\coverable -> {
      var coverableBuilder = CoverableBuilder.createBuilder()
      populateBaseModelInfo(coverableBuilder)
      coverableBuilder.withEntityName(coverable.EntityName)
          .withDescription(coverable.Description)
          .withReferredFrom(coverable.ReferredFrom)
          .withReferenceName(coverable.ReferenceName)
          .withIncludeModifiers(_productInfoStepDTO.LineIncludeModifiers)
          .withIncludeConditions(_productInfoStepDTO.LineIncludeConditions)
          .withIncludeExclusions(_productInfoStepDTO.LineIncludeExclusions)
          .withAttachToBuilding(coverable.AttachedToBuilding)
          .withAttachToLocation(coverable.AttachedToLocation)
      coverable.Fields.each(\field -> {
        coverableBuilder.withAdditionalField(transformField(field))
      })
      var transformedCoverable = coverableBuilder.build()
      productLine.Coverables.add(transformedCoverable)
    })
    setCoverableReferences(productLine)
  }

  private function setCoverableReferences(productLine: ProductLine) {
    var coverablesMap: Map<String, gw.acc.npg.model.Coverable> = new HashMap<String, gw.acc.npg.model.Coverable>()
    coverablesMap.put(productLine.EntityName, productLine)
    productLine.Coverables.each(\coverable -> {
      coverablesMap.put(coverable.EntityName, coverable)
    })
    productLine.Coverables.each(\coverable -> {
      coverable.ReferredFromCoverable = coverablesMap.get(coverable.ReferredFrom)
    })
  }

  private function findCoverableInProductLine(coverableEntityName: String, productLine: ProductLine): Coverable {
    if (productLine.EntityName == coverableEntityName) {
      return productLine
    }
    return productLine.Coverables.firstWhere(\cov -> cov.EntityName == coverableEntityName)
  }

  private function createCosts(productLine: ProductLine) {
    var costMap: Map<String, BaseCost> = new HashMap<String, BaseCost>()
    costMap.put(productLine.BaseCost.EntityName, productLine.BaseCost)
    _costsStepDTOs.each(\cost -> {
      var costBuilder = CostBuilder.createBuilder()
      populateBaseModelInfo(costBuilder)
      costBuilder.withEntityName(cost.EntityName)
          .withDescription(cost.Description)
      if (cost.CoverableName != null) {
        costBuilder.withCoverable(findCoverableInProductLine(cost.CoverableName, productLine))
      }
      if (cost.CoverageName != null) {
        costBuilder.withCoverage(findCoverableInProductLine(cost.CoverageName, productLine).Coverage)
      }
      costBuilder.withReferenceName(cost.ReferenceName)
          .withSuperEntityName(cost.ParentCost)
      cost.Fields.each(\field -> {
        var costField = transformField(field)
        costField.CostKeyField = field.CostKeyField
        costBuilder.withAdditionalField(costField)
      })
      var newCost = costBuilder.build()
      if (newCost.Coverable != null) {
        newCost.Coverable.Costs.add(newCost)
      } else {
        productLine.Costs.add(newCost)
      }
      costMap.put(cost.EntityName, newCost)
    })
    setCostReferences(costMap)
  }

  private function setCostReferences(costMap: Map<String, BaseCost>) {
    _costsStepDTOs.each(\cost -> {
      (costMap.get(cost.EntityName) as gw.acc.npg.model.Cost).ParentCost = costMap.get(cost.ParentCost)
    })
  }

}