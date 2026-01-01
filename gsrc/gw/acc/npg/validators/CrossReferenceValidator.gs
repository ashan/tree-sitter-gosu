package gw.acc.npg.validators

uses com.guidewire.commons.metadata.MetadataDependencies
uses gw.acc.npg.model.Field
uses gw.acc.npg.model.OtherEntity
uses gw.acc.npg.model.ProductLine
uses gw.api.locale.DisplayKey

/**
 * Concrete implementation of {@link gw.acc.npg.validators.ModelValidator} for imposing validation
 * on the entities referred with in {@link gw.acc.npg.model.ProductLine} model. All the entities
 * referred should be defined within model.
 */
class CrossReferenceValidator extends ModelValidator {

  private var _costsNames: List<String>
  private var _coverables: Map<String, gw.acc.npg.model.Coverable>
  private var _otherEntities: List<String>
  private var _allEntities: List<String>

  construct(productLine: ProductLine) {
    super()
    _coverables = new HashMap<String, gw.acc.npg.model.Coverable>()
    productLine.Coverables.each(\elt -> {
      _coverables.put(elt.EntityName, elt)
    })
    _coverables.put(productLine.EntityName, productLine)
    _costsNames = productLine.Costs.map(\elt -> elt.EntityName)
    _costsNames.add(productLine.BaseCost.EntityName)
    _otherEntities = productLine.OtherEntities.map(\elt -> elt.EntityName)
    _allEntities = new ArrayList<String>()
    _allEntities.addAll(_costsNames)
    _allEntities.addAll(_coverables.keySet())
    _allEntities.addAll(_otherEntities)
    _allEntities.add(productLine.Transaction.EntityName)
  }

  override function visit(productLine: ProductLine) {
    validateEntityNotAlreadyExists(productLine.EntityName, ProductLine)
    validateFieldNamesUniqueness(productLine.AdditionalFields, ProductLine, productLine.EntityName)
  }

  override function visit(cost: gw.acc.npg.model.Cost) {
    validateEntityNotAlreadyExists(cost.EntityName, Cost)
    if (cost.EntityName == cost.SuperEntity) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.Cost.SuperEntityNameClashes", cost.EntityName, cost.SuperEntity))
    }
    if (not _costsNames.contains(cost.SuperEntity)) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.Cost.SuperEntityNotExist", cost.EntityName, cost.SuperEntityName))
    }
    if (cost.CoverableEntityName != null and not _coverables.containsKey(cost.CoverableEntityName)) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.Cost.CoverableEntityNotExist", cost.EntityName, cost.CoverableEntityName))
    }
    if (cost.ReferenceName != null and isFieldWithRefNameAlreadyExists(cost.CoverableEntityName, cost.ReferenceName)) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.Cost.ReferenceNameClashes", cost.EntityName, cost.ReferenceName, cost.CoverableEntityName))
    }
    validateFieldNamesUniqueness(cost.AdditionalFields, Cost, cost.EntityName)
  }

  override function visit(coverable: gw.acc.npg.model.Coverable) {
    validateEntityNotAlreadyExists(coverable.EntityName, Coverable)
    if (coverable.EntityName == coverable.ReferredFrom) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.Coverable.ReferredFromEntityNameClashes", coverable.ReferredFrom, coverable.EntityName))
    }
    if (not _coverables.containsKey(coverable.ReferredFrom)) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.Coverable.ReferredFromEntityNotExist", coverable.ReferredFrom, coverable.EntityName))
    }
    if (coverable.ReferenceName != null and isFieldWithRefNameAlreadyExists(coverable.ReferredFrom, coverable.ReferenceName)) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.Coverable.ReferenceNameClashes", coverable.ReferenceName, coverable.EntityName, coverable.ReferredFrom))
    }
    validateFieldNamesUniqueness(coverable.AdditionalFields, Coverable, coverable.EntityName)
  }

  override function visit(field: Field) {
    switch (field.Type) {
      case Array:
        validateEntityExists(field.ArrayEntity, ArrayField, field.Name)
        break
      case Foreignkey:
        validateEntityExists(field.FkEntity, FkField, field.Name)
        break
      case Typekey:
        validateTypeListExists(field.Name, field.Typelist)
        break
    }
  }

  override function visit(otherEntity: OtherEntity) {
    validateEntityNotAlreadyExists(otherEntity.EntityName, OtherEntity)
    validateFieldNamesUniqueness(otherEntity.Fields, OtherEntity, otherEntity.EntityName)
  }

  private function validateEntityExists(referredEntityName: String, type: ProductModelProperty, fieldName: String) {
    if (not(_allEntities.contains(referredEntityName) or isEntityAlreadyExists(referredEntityName))) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.Field.ReferredEntityNotExist", type.Name, fieldName, referredEntityName))
    }
  }

  private function validateTypeListExists(fieldName: String, typeListName: String) {
    if (not(isTypeListAlreadyExists(typeListName))) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.Field.TypelistNotExist", fieldName, typeListName))
    }
  }

  private function validateFieldNamesUniqueness(fields: List<Field>, type: ProductModelProperty, typeName: String) {
    var fieldNames = new HashSet<String>()
    fields.each(\field -> {
      if (not fieldNames.add(field.Name)) {
        BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.Field.NotUnique", type.Name, typeName, field.Name))
      }
    })
  }

  private function validateEntityNotAlreadyExists(entityName: String, type: ProductModelProperty) {
    if (isEntityAlreadyExists(entityName)) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.EntityAlreadyExists", type.Name, entityName))
    }
  }

  private function isFieldWithRefNameAlreadyExists(coverableEntityName: String, referenceName: String): boolean {
    var cov = _coverables.get(coverableEntityName)
    if (cov != null) {
      return cov.AdditionalFields.map(\elt -> elt.Name).contains(referenceName)
    }
    return false
  }

  private function isEntityAlreadyExists(entityName: String): boolean {
    var intrinsicType = MetadataDependencies.getIntrinsicTypeFactory().getEntityIntrinsicType(entityName)
    return intrinsicType != null
  }

  private function isTypeListAlreadyExists(typeListName: String): boolean {
    var typeList = MetadataDependencies.getTypelistTypeFactory().getTypeListIntrinsicType(typeListName)
    return typeList != null
  }

}