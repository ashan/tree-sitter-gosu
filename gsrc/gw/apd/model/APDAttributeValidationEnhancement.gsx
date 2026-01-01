package gw.apd.model

uses entity.APDAttribute
uses gw.api.locale.DisplayKey
uses gw.api.util.LocaleUtil
uses gw.lang.reflect.IType
uses gw.xml.XMLNode

/**
 * Agile Product Developer
 */
enhancement APDAttributeValidationEnhancement : APDAttribute {

  function checkGenerationValidity(cblNode : XMLNode) : Boolean {
    var valid = true
    var messages = new ArrayList<String>()
    var warnings = new ArrayList<String>()
    // must ensure default language exists for text that goes into display keys
    var lang = LocaleUtil.getDefaultLanguageType()

    // name must be defined and valid
    if (this.Name == null) {
      messages.add(DisplayKey.get("Web.APDValidation.Attribute.MissingName"))
    } else if (not CodegenValidator.isValidName(this.Name)) {
      messages.add(DisplayKey.get("Web.APDValidation.Attribute.InvalidName"))
    } else if (this.ShortNameHasConflict) {
      warnings.add(DisplayKey.get("Web.APDValidation.Field.ReservedName", this.Name))
    }

    if (this["Label_" + lang.Code] == null) {
      messages.add(DisplayKey.get("Web.APDValidation.Attribute.MissingLabel"))
    }
    if (this["Description_" + lang.Code] == null) {
      messages.add(DisplayKey.get("Web.APDValidation.Attribute.MissingDescription"))
    }

    // validate dropdowns
    if (this.Type == APDFieldType.TC_TYPEKEY) {
      if((this.DropDownType == APDDropDownType.TC_TYPELIST and this.OwningDropDown == null)
          or (this.DropDownType == APDDropDownType.TC_OPTION or this.DropDownType == APDDropDownType.TC_PACKAGE)) {
        // check dropdown entries have unique codes
        var duplicateEntryCodes = CodegenValidator.findDuplicates(this.Codes*.Code)
        for (duplicateEntryCode in duplicateEntryCodes) {
          messages.add(DisplayKey.get("Web.APDValidation.Attribute.Dropdown.UniqueCodes", duplicateEntryCode))
        }

        this.Codes.each(\code -> {
          if (code.Code == null) {
            messages.add(DisplayKey.get("Web.APDValidation.Attribute.Dropdown.MissingCode", code.Name))
          } else if (not CodegenValidator.isValidCode(code.Code)) {
            messages.add(DisplayKey.get("Web.APDValidation.Attribute.Dropdown.InvalidCode", code.Name))
          }
          if (code["Name_" + lang.Code] == null) {
            messages.add(DisplayKey.get("Web.APDValidation.Attribute.Dropdown.MissingName", code.Name))
          }
          if (code["Description_" + lang.Code] == null) {
            messages.add(DisplayKey.get("Web.APDValidation.Attribute.Dropdown.MissingDescription", code.Name))
          }
          if (this typeis APDTerm) {
            switch(this.DropDownType) {
              case APDDropDownType.TC_PACKAGE:
                if (code.Values.IsEmpty or not code.Values.hasMatch(\v -> v.HasValuePopulated)) {
                  messages.add(DisplayKey.get("Web.APDValidation.Attribute.Dropdown.MissingValueForPackage", code.Name))
                }
                break
              case APDDropDownType.TC_OPTION:
                if (code.Values.IsEmpty) {
                  messages.add(DisplayKey.get("Web.APDValidation.Attribute.Dropdown.MissingValue", code.Name, this.DropdownColumns.first().Name))
                }
                code.Values.each(\v -> {
                  if (not v.HasValuePopulated) {
                    messages.add(DisplayKey.get("Web.APDValidation.Attribute.Dropdown.MissingValue", v.Dropdown.Name, v.DropdownColumn.Name))
                  }
                })
            }
          }
        })
      }

      if (this.DropDownType == APDDropDownType.TC_TYPELIST and this.OwningDropDown == null) {
        // typelists must have a typelist name
        if (this.Typelist == null){
          messages.add(DisplayKey.get("Web.APDValidation.Attribute.MissingTypelist"))
        } else if (not CodegenValidator.isValidName(this.Typelist)) {
          messages.add(DisplayKey.get("Web.APDValidation.Attribute.InvalidTypelistName"))
        }
      } else { // option and package terms
        if (this typeis APDTerm) {
          if (this.DropDownType == APDDropDownType.TC_OPTION and this.DropdownColumns.Count != 1) {
            messages.add(DisplayKey.get("Web.APDValidation.Attribute.DropdownColumn.NoColumns"))
          }
          if (this.DropDownType == APDDropDownType.TC_PACKAGE and this.DropdownColumns.Count < 2) {
            messages.add(DisplayKey.get("Web.APDValidation.Attribute.DropdownColumn.MissingPackageColumns"))
          }
          // check dropdown column definitions
          if (this.DropdownColumns.hasMatch(\dc -> dc.Name == null)) {
            messages.add(DisplayKey.get("Web.APDValidation.Attribute.DropdownColumn.MissingName"))
          }
          if (this.DropdownColumns.hasMatch(\dc -> dc.ValueType == null)) {
            messages.add(DisplayKey.get("Web.APDValidation.Attribute.DropdownColumn.MissingValueType"))
          }
        }
      }
    }

    // validate Location and InvolvedParty are not generated as clause terms
    if (this typeis APDTerm) {
      if (this.Type == APDFieldType.TC_LOCATION and this.GenerateAsClauseTerm) {
        messages.add(DisplayKey.get("Web.APDValidation.Attribute.LocationCanNotGenerateAsClauseTerm"))
      } else if (this.Type == APDFieldType.TC_PARTY and this.GenerateAsClauseTerm) {
        messages.add(DisplayKey.get("Web.APDValidation.Attribute.InvolvedPartyCanNotGenerateAsClauseTerm"))
      }
    }

    // validate when Scalable is set to true
    if (this.Scalable and not this.CanScale) {
      messages.add(DisplayKey.get("Web.APDValidation.Attribute.InvalidScalable"))
    }

    // check term should not be set as jurisdiction
    if (this typeis APDTerm && this.Jurisdiction) {
      messages.add(DisplayKey.get("Web.APDValidation.Attribute.InvalidJurisdiction"))
    }

    // validate that 'GenerateAsClauseTerm' is always set to 'true' for schedule terms that are invalid schedule property types
    if (this typeis APDTerm && this.ScheduleItemAttribute && this.CanOnlyBeAClauseTermBasedOnType && not this.GenerateAsClauseTerm) {
      messages.add(DisplayKey.get("Web.APDValidation.Attribute.InvalidGenerateAsClauseTerm"))
    }

    // validate the argument term of the calculated value
    if (this typeis APDTerm) {
      var ancestorClauses = this.Clause.Ancestors
      var invalidRuleLabels = this.DependentCalculatedValueRules
          .where(\rule ->
              (rule typeis APDAttributeRule) and
                  (rule.Attribute typeis APDTerm) and
                  not(ancestorClauses.contains(rule.Attribute.Clause))
          )
          .map(\rule -> DisplayKey.get("Web.APDRule.DisplayInfo", rule.RuleType.DisplayName, rule.OwnerDisplayName))
      if (invalidRuleLabels.HasElements) {
        messages.add(
            DisplayKey.get("Web.APDValidation.Attribute.InvalidCovTermArgument") +
                invalidRuleLabels.map(\label -> "\n- " + label).sort().join("")
        )
      }
    }

    if (messages.Count > 0 or warnings.Count > 0) {
      valid = (messages.Count == 0)
      var fieldTree = new XMLNode()
      fieldTree.setAttributeValue("Valid", Boolean.toString(valid))
      if (this typeis APDField or this typeis APDExposureField) {
        fieldTree.ElementName = "Field"
        fieldTree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.FieldNode"))
      } else {
        fieldTree.ElementName = "ClauseTerm"
        var value = (this as APDTerm).ScheduleItemAttribute ? DisplayKey.get("Web.APD.ProductTree.ScheduleTermNode") : DisplayKey.get("Web.APD.ProductTree.TermNode")
        fieldTree.setAttributeValue("Type", value)
      }
      fieldTree.setAttributeValue("Name", this.Label)
      messages.each(\msg -> {
        var errorTree = new XMLNode()
        errorTree.ElementName = "ERROR"
        errorTree.setAttributeValue("Name", msg)
        fieldTree.addChild(errorTree)
      })
      warnings.each(\warning -> {
        var warningTree = new XMLNode()
        warningTree.ElementName = "WARNING"
        warningTree.setAttributeValue("Name", warning)
        fieldTree.addChild(warningTree)
      })
      cblNode.addChild(fieldTree)
    }

    return valid
  }

  /**
   * Returns true if the short name of this field would conflict with an existing PolicyCenter property after code
   * generation. Conflicts are determined based on the type of entity that owns this attribute. For example, short
   * names that are valid for exposures may lead to conflicts on coverables.
   */
  property get ShortNameHasConflict() : boolean {
    // short names cannot duplicate properties on eff-dated entities in PC
    if (isEffDatedPropertyName(this.Name)) {
      return true
    }

    if (this typeis APDField) {
      // for coverables with clauses, short names cannot duplicate properties on PC's Coverable or CoverableAdapter
      if (this.Coverable.IsACoverable and isCoverablePropertyName(this.Name)) {
        return true
      }
      // short names cannot duplicate properties on SyncableAdapter
      if (isSyncableAdapterPropertyName(this.Name)) {
        return true
      }
      // for policy lines, short names cannot duplicate properties on PC's PolicyLine entity
      if ((this.Coverable typeis APDProductLine) and isPolicyLinePropertyName(this.Name)) {
        return true
      }
    }

    // short names for exposure fields cannot duplicate properties on SyncableAdapter
    if (this typeis APDExposureField and isSyncableAdapterPropertyName(this.Name)) {
      return true
    }

    return false
  }

  private static function isEffDatedPropertyName(name : String) : boolean {
    return isUsedInType(entity.EffDated, name)
  }

  private static function isCoverablePropertyName(name : String) : boolean {
    return isUsedInType(entity.Coverable, name) or isUsedInType(gw.api.domain.CoverableAdapter, name)
  }

  private static function isSyncableAdapterPropertyName(name : String) : boolean {
    return isUsedInType(gw.api.domain.rules.SyncableAdapter, name)
  }

  private static function isPolicyLinePropertyName(name : String) : boolean {
    return isUsedInType(entity.PolicyLine, name)
  }

  private static function isUsedInType(type : IType, name : String) : boolean {
    if (name != null) {
      return type.TypeInfo.Properties*.Name.map(\propName -> propName.toUpperCase()).contains(name.toUpperCase())
    }
    return false
  }
}