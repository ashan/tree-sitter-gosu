package gw.acc.npg.validators

uses gw.acc.npg.model.*
uses gw.api.locale.DisplayKey

/**
 * Concrete implementation of {@link gw.acc.npg.validators.ModelValidator} for imposing not
 * validation on different fields in {@link gw.acc.npg.model.ProductLine} model.
 */
class NullConstraintValidator extends ModelValidator {

  var hasCoverableAndCostValidator = new HasCostValidator()

  override function visit(field: Field) {
    validateNotNull(field.Name, Field, field.Name, FieldName)
    validateNotNull(field.Type, Field, field.Name, Type)
    validateNotNull(field.Description, Field, field.Name, Description)

    switch (field.Type) {
      case Array:
        validateNotNull(field.CascadeDelete, Field, field.Name, CascadeDelete)
        validateNotNull(field.ArrayEntity, Field, field.Name, ArrayEntity)
        validateNotNull(field.Owner, Field, field.Name, Owner)
        break
      case Foreignkey:
        validateNotNull(field.FkEntity, Field, field.Name, FkEntity)
        break
      case Varchar:
        validateNotNull(field.Size, Field, field.Name, Size)
        break
      case Decimal:
        validateNotNull(field.Precision, Field, field.Name, Precision)
        validateNotNull(field.Scale, Field, field.Name, Scale)
        break
      case Typekey:
        validateNotNull(field.Typelist, Field, field.Name, Typelist)
        break
    }
    validateNotNull(field.NullOk, Field, field.Name, NullOk)
  }

  override function visit(entity: OtherEntity) {
    validateNotNull(entity.EntityName, OtherEntity, entity.EntityName, EntityName)
    validateNotNull(entity.Description, OtherEntity, entity.EntityName, Description)
  }

  override function visit(line: ProductLine) {
    validateNotNull(line.LineCode, ProductLine, line.EntityName, LineCode)
    validateNotNull(line.EntityName, ProductLine, line.EntityName, EntityName)
    validateNotNull(line.Description, ProductLine, line.EntityName, Description)
    validateNotNull(line.Suffix, ProductLine, line.EntityName, Suffix)
    validateNotNull(line.Abbrevation, ProductLine, line.EntityName, Abbrevation)
    validateNotNull(line.ProductCode, ProductLine, line.EntityName, ProductCode)
    BrokenRules.addAll(hasCoverableAndCostValidator.validateHasCosts(line))
  }

  override function visit(cost: gw.acc.npg.model.Cost) {
    validateNotNull(cost.SuperEntityName, Cost, cost.EntityName, SuperEntity)
  }


  private function validateNotNull(value: Object, type: ProductModelProperty, typeName: String, valueType: ProductModelProperty) {
    if (value == null) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.NullConstraintFail", type.Name, typeName, valueType.Name))
    }
  }
}