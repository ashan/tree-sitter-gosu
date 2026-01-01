package gw.acc.npg.validators

uses gw.acc.npg.model.ColumnType
uses gw.acc.npg.model.Field
uses gw.acc.npg.model.OtherEntity
uses gw.acc.npg.model.ProductLine
uses gw.api.locale.DisplayKey

/**
 * Concrete implementation of {@link ModelValidator} for imposing validation field types.
 */

class FieldTypeConstraintValidator extends ModelValidator {

  private static final var HAS_AUTO_NUMBER_FIELD = \field: Field -> field.Type == ColumnType.AutoNumber

  override function visit(coverable: gw.acc.npg.model.Coverable) {
    if (coverable.AdditionalFields != null and coverable.AdditionalFields.countWhere(HAS_AUTO_NUMBER_FIELD) > 1) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.FieldTypeConstraintFail.InvalidAutoNumberingCount", coverable.EntityName))
    }
  }

  override function visit(line: ProductLine) {
    visit(line as gw.acc.npg.model.Coverable)
  }

  override function visit(cost: gw.acc.npg.model.Cost) {
    if (cost.AdditionalFields != null and cost.AdditionalFields.countWhere(HAS_AUTO_NUMBER_FIELD) > 0) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.FieldTypeConstraintFail.InvalidAutoNumberingEntity", cost.EntityName))
    }
  }

  override function visit(entity: OtherEntity) {
    if (entity.Fields != null and entity.Fields.countWhere(HAS_AUTO_NUMBER_FIELD) > 0) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.FieldTypeConstraintFail.InvalidAutoNumberingEntity", entity.EntityName))
    }
  }
}