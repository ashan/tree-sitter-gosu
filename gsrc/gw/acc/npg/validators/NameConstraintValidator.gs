package gw.acc.npg.validators

uses gw.acc.npg.model.BaseCost
uses gw.acc.npg.model.Condition
uses gw.acc.npg.model.Field
uses gw.acc.npg.model.OtherEntity
uses gw.acc.npg.model.ProductLine
uses gw.api.locale.DisplayKey

uses java.util.regex.Pattern

/**
 * Concrete implementation of {@link gw.acc.npg.validators.ModelValidator} for imposing validation on the entities name, field names etc.
 */
class NameConstraintValidator extends ModelValidator {

  /**
   * Compiled regex patterns for imposing the validations on the names used in model
   */
  public enum RegexExpression {

    ENTITY_NAME(Pattern.compile("[a-zA-Z_][a-zA-Z0-9_]{0,24}"), DisplayKey.get("Accelerator.NPG.Validation.NameConstraintFail.EntityName")),
    LINE_ABBREVIATION(Pattern.compile("[A-Z]{2,3}"), DisplayKey.get("Accelerator.NPG.Validation.NameConstraintFail.Abbreviation")),
    FIELD_NAME(Pattern.compile("[a-zA-Z_][a-zA-Z0-9_]{0,29}"), DisplayKey.get("Accelerator.NPG.Validation.NameConstraintFail.FieldName")),
    SUFFIX(Pattern.compile("[a-zA-Z0-9_]{0,5}"), DisplayKey.get("Accelerator.NPG.Validation.NameConstraintFail.Suffix")),
    CODE(Pattern.compile("[a-zA-Z_][a-zA-Z0-9_]{0,31}"), DisplayKey.get("Accelerator.NPG.Validation.NameConstraintFail.Code"))

    var _message: String as Message
    var _pattern: Pattern as Pattern

    private construct(pattern: Pattern, message: String) {
      _message = message
      _pattern = pattern
    }

    /**
     * @param text String that need to be validated against this {@link java.util.regex.Pattern}
     * @return true if provided {@literal text} match this {@link java.util.regex.Pattern}
     */
    function matches(text: String): boolean {
      if (text == null) {
        return false
      }
      return _pattern.matcher(text).matches()
    }
  }


  override function visit(cost: gw.acc.npg.model.Cost) {
    validateRegex(Cost, cost.EntityName, cost.EntityName, EntityName, RegexExpression.ENTITY_NAME)
    validateRegex(Cost, cost.EntityName, cost.SuperEntity, ProductModelProperty.SuperEntity, RegexExpression.ENTITY_NAME)
    if (cost.CoverableEntityName != null) {
      validateRegex(Cost, cost.EntityName, cost.CoverableEntityName, CoverableEntityName, RegexExpression.ENTITY_NAME)
      validateRegex(Cost, cost.EntityName, cost.ReferenceName, ReferenceName, RegexExpression.FIELD_NAME)
    }
  }

  override function visit(coverable: gw.acc.npg.model.Coverable) {
    validateRegex(Coverable, coverable.EntityName, coverable.EntityName, EntityName, RegexExpression.ENTITY_NAME)
    validateRegex(Coverable, coverable.EntityName, coverable.ReferredFrom, ReferredFrom, RegexExpression.ENTITY_NAME)
    validateRegex(Coverable, coverable.EntityName, coverable.ReferenceName, ReferenceName, RegexExpression.FIELD_NAME)
  }

  override function visit(field: Field) {
    validateRegex(Field, field.Name, field.Name, FieldName, RegexExpression.FIELD_NAME)
  }

  override function visit(entity: OtherEntity) {
    validateRegex(OtherEntity, entity.EntityName, entity.EntityName, EntityName, RegexExpression.ENTITY_NAME)
  }

  override function visit(line: ProductLine) {
    validateRegex(ProductLine, line.EntityName, line.EntityName, EntityName, RegexExpression.ENTITY_NAME)
    validateRegex(ProductLine, line.EntityName, line.Abbrevation, Abbrevation, RegexExpression.LINE_ABBREVIATION)
    validateRegex(ProductLine, line.EntityName, line.Suffix, Suffix, RegexExpression.SUFFIX)
    validateRegex(ProductLine, line.EntityName, line.ProductCode, ProductCode, RegexExpression.CODE)
    validateRegex(ProductLine, line.EntityName, line.LineCode, LineCode, RegexExpression.CODE)
  }

  override function visit(condition: Condition) {
    validateRegex(Condition, condition.EntityName, condition.EntityName, EntityName, RegexExpression.ENTITY_NAME)
  }

  override function visit(coverage: gw.acc.npg.model.Coverage) {
    validateRegex(Coverage, coverage.EntityName, coverage.EntityName, EntityName, RegexExpression.ENTITY_NAME)
  }

  override function visit(exclusion: gw.acc.npg.model.Exclusion) {
    validateRegex(Exclusion, exclusion.EntityName, exclusion.EntityName, EntityName, RegexExpression.ENTITY_NAME)
  }

  override function visit(modifier: gw.acc.npg.model.Modifier) {
    validateRegex(Modifier, modifier.EntityName, modifier.EntityName, EntityName, RegexExpression.ENTITY_NAME)
  }

  override function visit(rateFactor: gw.acc.npg.model.RateFactor) {
    validateRegex(RateFactor, rateFactor.EntityName, rateFactor.EntityName, EntityName, RegexExpression.ENTITY_NAME)
  }

  override function visit(basCost: BaseCost) {
    validateRegex(BaseCost, basCost.EntityName, basCost.EntityName, EntityName, RegexExpression.ENTITY_NAME)
  }

  override function visit(transaction: gw.acc.npg.model.Transaction) {
    validateRegex(Transaction, transaction.EntityName, transaction.EntityName, EntityName, RegexExpression.ENTITY_NAME)
  }

  /**
   * Validate <code>value</code> against <code>regularExp</code>. If validation fails then it
   * adds text message to <code>BrokenRules</code> explaining validation failed on <code>displayName</code>
   *
   * @param value       String to be validated
   * @param displayName name to be displayed with fail validation message
   * @param regularExp  {@link RegexExpression} used to validate <code>value</code>
   */
  private function validateRegex(type: ProductModelProperty, typeName: String, value: String, valueType: ProductModelProperty, regularExp: RegexExpression) {
    if (not regularExp.matches(value)) {
      BrokenRules.add(DisplayKey.get("Accelerator.NPG.Validation.NameConstraintFail", type.Name, typeName, valueType.Name, regularExp.Message))
    }
  }

}