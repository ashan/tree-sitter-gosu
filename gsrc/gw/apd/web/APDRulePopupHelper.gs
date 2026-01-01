package gw.apd.web

uses gw.apd.APDPopupParentHelper
uses gw.api.locale.DisplayKey

@Export
class APDRulePopupHelper {

  static function getRuleDisplayDescription(rule : APDRule) : String {
    return getRuleDisplayDescription(rule, TC_FIXED)
  }

  static function getRuleDisplayDescription(rule : APDRule, valueType : APDRuleValueType) : String {
    if (rule.RuleType == null) {
      return ""
    }

    var fieldIdentifier = getParentReferenceString(rule)
    var displayValue : String
    var displayKeyName : String

    switch (rule.RuleType) {
      case APDRuleType.TC_DEFAULT:
      case APDRuleType.TC_MAX:
      case APDRuleType.TC_MIN:
        if (valueType == TC_CALCULATED) {
          displayKeyName = "Web.APDRule.${rule.RuleType.Code.capitalize()}.Calculated"
          displayValue = ""
        } else {
          displayKeyName = "Web.APDRule.${rule.RuleType.Code.capitalize()}"
          displayValue = getRuleDisplayValue(rule)
        }
        break

      case APDRuleType.TC_EXISTENCE:
        displayKeyName = "Web.APDRule.${rule.DefaultExistence.Code.capitalize()}"
        displayValue = getRuleDisplayValue(rule)
        break

      case APDRuleType.TC_TAG:
        displayKeyName = "Web.APDRule.Tag." + (rule.DefaultTagValue == APDTagApplicability.TC_APPLIES ? "Applies" : "DoesNotApply")
        displayValue = rule.TagType.DisplayName
        break

      default:
        throw new IllegalArgumentException("Unable to determine display value for rule. Unknown APDRuleType: " + rule.RuleType)
    }

    return DisplayKey.get(displayKeyName, fieldIdentifier, displayValue)
  }

  static function getRuleElementDisplayDescription(ruleElement : APDRuleElement) : String {
    return getRuleElementDisplayDescription(ruleElement, TC_FIXED)
  }

  static function getRuleElementDisplayDescription(ruleElement : APDRuleElement, valueType : APDRuleValueType) : String {
    if (ruleElement.Rule.RuleType == null) {
      return ""
    }

    var fieldIdentifier = getParentReferenceString(ruleElement.Rule)
    var displayValue : String = null
    var displayKeyName : String = null

    switch (ruleElement.Rule.RuleType) {
      case APDRuleType.TC_DEFAULT:
      case APDRuleType.TC_MAX:
      case APDRuleType.TC_MIN:
        if (valueType == TC_CALCULATED) {
          displayKeyName = "Web.APDRule.Variant.${ruleElement.Rule.RuleType.Code.capitalize()}.Calculated"
          displayValue = ""
        } else {
          displayKeyName = "Web.APDRule.Variant.${ruleElement.Rule.RuleType.Code.capitalize()}"
          displayValue = getRuleElementDisplayValue(ruleElement)
        }
        break

      case APDRuleType.TC_EXISTENCE:
        if (ruleElement.Existence != null) {
          displayKeyName = "Web.APDRule.Variant.${ruleElement.Existence.Code.capitalize()}"
          displayValue = getRuleElementDisplayValue(ruleElement)
        }
        break

      case APDRuleType.TC_TAG:
        displayKeyName = "Web.APDRule.Variant.Tag." + (ruleElement.DefaultTagValue == APDTagApplicability.TC_APPLIES ? "Applies" : "DoesNotApply")
        displayValue = ruleElement.Rule.TagType.DisplayName
        break

      default:
        throw new IllegalArgumentException("Unable to determine display value for rule element. Unknown APDRuleType: " + ruleElement.Rule.RuleType)
    }

    return displayKeyName != null ? DisplayKey.get(displayKeyName, fieldIdentifier, displayValue) : null
  }

  private static function getRuleDisplayValue(rule : APDRule) : String {
    var displayValue = getRuleDisplayValueInternal(rule)
    return displayValue ?: "empty"
  }

  private static function getRuleDisplayValueInternal(rule : APDRule) : String {
    switch (rule.RuleType) {
      case APDRuleType.TC_EXISTENCE:
        return rule.DefaultExistence.DisplayName
      case APDRuleType.TC_TAG:
        return rule.DefaultTagValue?.toString()
      default:
        if (rule typeis APDAttributeRule) {
          var fieldType = rule.Attribute.Type
          switch (fieldType) {
            case APDFieldType.TC_MONEY:
            case APDFieldType.TC_BIGDECIMAL:
              return rule.DefaultDecimalValue.DisplayValue
            case APDFieldType.TC_INTEGER:
              return rule.DefaultIntegerValue?.toString()
            case APDFieldType.TC_BOOLEAN:
              return rule.DefaultBitValue?.toString()
            case APDFieldType.TC_TYPEKEY:
              return rule.DefaultCodeValue.DisplayName
            case APDFieldType.TC_DATE:
              return rule.DefaultDateValue?.ShortFormat
            case APDFieldType.TC_VARCHAR:
              return rule.DefaultStringValue
            case APDFieldType.TC_LOCATION:
            case APDFieldType.TC_PARTY:
            case null:
              //default for location/party not currently supported
              return null
            default:
              throw new IllegalArgumentException("Unable to determine display value for rule. Unknown APDFieldType: " + fieldType)
          }
        }

        throw new IllegalArgumentException("Unable to determine display value for rule with ruletype " + rule.RuleType + " with underlying type " + (typeof rule).Name)
    }
  }

  public static function getParentReferenceString(rule : APDRule) : String {
    switch (typeof rule) {
      case APDAttributeRule:
        return APDPopupParentHelper.getParentReference(rule.Attribute)
      case APDClauseRule:
        return APDPopupParentHelper.getParentReference(rule.Clause)
      case APDDropdownEntryRule:
        return APDPopupParentHelper.getParentReference(rule.DropdownEntry)
    }
    return ""
  }

  private static function getRuleElementDisplayValue(ruleElement : APDRuleElement) : String {
    var displayValue = getRuleElementDisplayValueInternal(ruleElement)
    return displayValue ?: "empty"
  }

  private static function getRuleElementDisplayValueInternal(ruleElement : APDRuleElement) : String {
    switch (ruleElement.Rule.RuleType) {
      case APDRuleType.TC_EXISTENCE:
        return ruleElement.Existence.DisplayName
      case APDRuleType.TC_TAG:
        return ruleElement.DefaultTagValue?.toString()
      default:
        if (ruleElement.Rule typeis APDAttributeRule) {
          var fieldType = (ruleElement.Rule as APDAttributeRule).Attribute.Type
          switch (fieldType) {
            case APDFieldType.TC_MONEY:
            case APDFieldType.TC_BIGDECIMAL:
              return ruleElement.DefaultDecimalValue.DisplayValue
            case APDFieldType.TC_INTEGER:
              return ruleElement.DefaultIntegerValue?.toString()
            case APDFieldType.TC_BOOLEAN:
              return ruleElement.DefaultBitValue?.toString()
            case APDFieldType.TC_TYPEKEY:
              return ruleElement.DefaultCodeValue.DisplayName
            case APDFieldType.TC_DATE:
              return ruleElement.DefaultDateValue?.ShortFormat
            case APDFieldType.TC_VARCHAR:
              return ruleElement.DefaultStringValue
            case APDFieldType.TC_LOCATION:
            case APDFieldType.TC_PARTY:
              //default for location/party not currently supported
              return null
            default:
              throw new IllegalArgumentException("Unable to determine display value for rule. Unknown APDFieldType: " + fieldType)
          }
        }

        throw new IllegalArgumentException("Unable to determine display value for rule element with ruletype " + ruleElement.Rule.RuleType + " with underlying type " + (typeof ruleElement).Name)
    }
  }

  public static function getRuleTypeString(rule : APDRule) : String {
    return getRuleTypeString(rule.RuleType, rule.Subtype)
  }

  public static function getRuleTypeString(ruleType : APDRuleType, ruleSubtype : typekey.APDRule) : String {
    if (ruleType == APDRuleType.TC_EXISTENCE) {
      switch (ruleSubtype) {
        case typekey.APDRule.TC_APDATTRIBUTERULE:
          return DisplayKey.get("Web.APDRule.Existence.Attribute")
        case typekey.APDRule.TC_APDCLAUSERULE:
          return DisplayKey.get("Web.APDRule.Existence.Clause")
        case typekey.APDRule.TC_APDDROPDOWNENTRYRULE:
          return DisplayKey.get("Web.APDRule.Existence.DropdownEntry")
        default:
          throw new IllegalStateException("Unknown rule subtype \"${ruleSubtype}\"")
      }
    }

    return ruleType.toString()
  }

  public static function getDefaultValueLabel(rule : APDRule) : String {
    switch (rule.RuleType) {
      case APDRuleType.TC_DEFAULT:
        return DisplayKey.get("Web.APDAttributeRule.Default")
      case APDRuleType.TC_MIN:
        return DisplayKey.get("Web.APDAttributeRule.Minimum")
      case APDRuleType.TC_MAX:
        return DisplayKey.get("Web.APDAttributeRule.Maximum")
      case APDRuleType.TC_EXISTENCE:
        switch (rule.Subtype) {
          case typekey.APDRule.TC_APDATTRIBUTERULE:
            return DisplayKey.get("Web.APDAttributeRule.Existence.Usage")
          case typekey.APDRule.TC_APDCLAUSERULE:
          case typekey.APDRule.TC_APDDROPDOWNENTRYRULE:
            return DisplayKey.get("Web.APDAttributeRule.Existence.Availability")
          default:
            throw new IllegalStateException("Unknown rule subtype \"${rule.Subtype}\"")
        }
      case APDRuleType.TC_TAG:
        return DisplayKey.get("Web.APDTagPopup.TagDefaultValue")
      default:
        throw new IllegalStateException("Unknown rule type \"${rule.RuleType}\"")
    }
  }

  public static function getRulePopupTitle(rule : APDRule) : String {
    return getRulePopupTitle(rule.RuleType, rule.Subtype)
  }

  public static function getRulePopupTitle(ruleType : APDRuleType, ruleSubtype : typekey.APDRule) : String {
    return DisplayKey.get("Web.APDRulePopup.Title", getRuleTypeString(ruleType, ruleSubtype))
  }

  public static function getResultingLabel(rule : APDRule) : String {
    return DisplayKey.get("Web.APDAttributeRule.APDRuleElement.ResultingValue", getRuleTypeString(rule))
  }

  static function getRuleConditionTargetLabel(target : KeyableBean) : String {
    if (target typeis APDAttribute) {
      return target.QualifiedLabel
    } else if (target typeis APDClause) {
      return target.QualifiedLabel
    }
    return ""
  }
}