package gw.apd.model.export

uses gw.apd.model.CodegenValidator
uses gw.apd.model.export.xsd.apdproductimport.Import
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Attribute_OwningDropDown
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Attribute_Rules_APDAttributeRule
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Attribute_Rules_APDDropDownEntryRule
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Clause_Rules_APDClauseRule
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Clause_Terms_APDTerm
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Coverable_Clauses_APDCondition
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Coverable_Clauses_APDCoverage
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Coverable_Clauses_APDExclusion
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Coverable_CoreFields_APDCoreAttribute
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Coverable_Exposures_APDExposure
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Coverable_Exposures_APDExposure_Fields_APDExposureField
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Coverable_Fields_APDField
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Import_APDCoverable
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Import_APDProductLine
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Rule_DefaultCalculatedValue
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Rule_RuleElements_APDRuleElement
uses gw.apd.model.export.xsd.apdproductimport.anonymous.elements.Rule_RuleElements_APDRuleElement_RuleConditions_APDRuleCondition
uses gw.apd.util.APDLoggerCategory
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.productedition.APDCalculatedValuesConfig
uses gw.api.productedition.ProductEditionKey
uses gw.api.system.PCLoggerCategory
uses gw.api.util.CurrencyUtil
uses gw.api.util.DisplayableException

uses gw.api.web.WebFile
uses gw.pl.util.DateConverterUtil
uses gw.xml.XmlElement
uses org.apache.commons.lang.StringUtils

uses java.io.BufferedInputStream

@Export
class APDEditionsImportHelper implements EditionsImportHelper {
  private var _webXMLFile : WebFile as readonly XMLFile
  private var _import : Import
  // map of edition codes and their InstalledEdition. Used to lookup an InstalledEdition from a rules edition code
  var _lineEditions : HashMap<String, InstalledEdition>
  // map of all possible rule conditition targets (E.g. attributes and clauses). Can be looked up by publicID
  var _ruleTargets = new HashMap<String, RuleTarget>()
  // map of all entities that can be root entities for rules (E.g. line, coverable, exposure). Can be looked up by publicID
  var _ruleRootEntities = new HashMap<String, RuleRootEntity>()

  construct() {
  }

  override function validateXML() : String {
    if (_webXMLFile == null) return DisplayKey.get("Web.APDValidation.XML.MissingFileName")
    try {
      _import = Import.parse(new BufferedInputStream(_webXMLFile.InputStream))
    } catch (e : Exception) {
      PCLoggerCategory.SERVER.info("Error validating APD product template from \"${_webXMLFile.Name}\": ${e.Message}")
      return DisplayKey.get("Web.APDValidation.XML.InvalidFile", _webXMLFile.Name)
    }

    return null
  }

  override property set XMLFile(file : WebFile) {
    _webXMLFile = file
  }

  override function getInvalidRuleMessages(editions : Collection<InstalledEdition>) : String[] {
    var invalidRules = editions*.Rules.where(\r -> not r.Valid)

    var invalidRuleMessages : List<String> = {}
    if (invalidRules.HasElements) {
      for (rule in invalidRules.toSet().order()) {
        var message = DisplayKey.get("Web.APD.Import.Editions.InvalidRule.Message", rule.CodeIdentifier, rule.Issues)
        invalidRuleMessages.add(message)
      }
    }
    return invalidRuleMessages.toTypedArray()
  }

  public static function displayInvalidRules(editions : Collection<InstalledEdition>) {
    var validRules = editions*.Rules.where(\r -> r.Valid)
    var invalidRules = editions*.Rules.where(\r -> not r.Valid)

    if (invalidRules.HasElements) {
      var importResult = DisplayKey.get("Web.APD.Import.Editions.ImportedValidRules.Message", validRules.Count) + "\n"
      importResult += DisplayKey.get("Web.APD.Import.Editions.FoundInvalidRules.Message", invalidRules.Count) + "\n"

      importResult += DisplayKey.get("Web.APD.Import.Editions.InvalidRules.Message") + "\n"
      for (rule in invalidRules) {
        importResult += DisplayKey.get("Web.APD.Import.Editions.InvalidRule.Message", rule.CodeIdentifier, rule.Issues) + "\n"
      }
      throw new DisplayableException(importResult)
    }
  }

  override function buildInstalledEditions(product : gw.api.productmodel.Product) : Collection<InstalledEdition> {
    validateImportMatchesInstalledProduct(product)

    for (linePattern in product.LinePatterns) {
      removeExistingPreLoadedEditions(linePattern.CodeIdentifier)
    }

    return buildInstalledEditions()
  }

  internal function buildInstalledEditions() : Collection<InstalledEdition> {
    var preloadedEditions = new ArrayList<InstalledEdition>()
    _import.APDProductLine.each(\pl -> {
      preprocessLine(pl)
      _lineEditions = new HashMap<String, InstalledEdition>()

      // The xml template does not include a base edition, so add one for rules that do not explicitly point to an edition
      createAndAddEdition(null, pl.CodeIdentifier, null)
      pl.Edition.each(\edition -> {
        createAndAddEdition(edition.EditionCode, pl.CodeIdentifier, edition.EffectiveDate.toCalendar().Time)
      })

      var lineRoot = new RuleRootEntity(pl)

      pl.Fields.APDField.each(\fld -> {
        buildInstalledRulesForCoverableField(fld, lineRoot)
      })
      pl.Clauses.APDCoverage.each(\cvg -> {
        buildInstalledRulesForCoverage(cvg, lineRoot)
        buildInstalledClauseHierarchyForCoverage(cvg, lineRoot)
      })
      pl.Clauses.APDExclusion.each(\exc -> {
        buildInstalledRulesForExclusion(exc, lineRoot)
        buildInstalledClauseHierarchyForExclusion(exc, lineRoot)
      })
      pl.Clauses.APDCondition.each(\con -> {
        buildInstalledRulesForCondition(con, lineRoot)
        buildInstalledClauseHierarchyForCondition(con, lineRoot)
      })

      pl.Exposures.APDExposure.each(\exp -> {
        var exposureRoot = new RuleRootEntity(exp, pl.LinePrefix)
        exp.Fields.APDExposureField.each(\expfld -> {
          buildInstalledRulesForExposureField(expfld, exposureRoot)
        })
      })

      _import.APDCoverable.each(\cbl -> {
        var coverableRoot = new RuleRootEntity(cbl, pl.LinePrefix)
        cbl.Fields.APDField.each(\fld -> {
          buildInstalledRulesForCoverableField(fld, coverableRoot)
        })
        cbl.Clauses.APDCoverage.each(\cvg -> {
          buildInstalledRulesForCoverage(cvg, coverableRoot)
          buildInstalledClauseHierarchyForCoverage(cvg, coverableRoot)
        })
        cbl.Clauses.APDExclusion.each(\exc -> {
          buildInstalledRulesForExclusion(exc, coverableRoot)
          buildInstalledClauseHierarchyForExclusion(exc, coverableRoot)
        })
        cbl.Clauses.APDCondition.each(\con -> {
          buildInstalledRulesForCondition(con, coverableRoot)
          buildInstalledClauseHierarchyForCondition(con, coverableRoot)
        })

        cbl.Exposures.APDExposure.each(\exp -> {
          var exposureRoot = new RuleRootEntity(exp, pl.LinePrefix)
          exp.Fields.APDExposureField.each(\expfld -> {
            buildInstalledRulesForExposureField(expfld, exposureRoot)
          })
        })
      })
      preloadedEditions.addAll(_lineEditions.Values)
    })

    return preloadedEditions
  }

  private function createAndAddEdition(editionCode : String, lineCode : String, effectiveDate : Date) {
    var installedEdition = new InstalledEdition()
    installedEdition.EditionCode = editionCode
    installedEdition.LineCode = lineCode
    installedEdition.EffectiveDate = effectiveDate
    installedEdition.EditionStatus = EditionStatus.TC_PRELOADED
    _lineEditions.put(editionCode, installedEdition)
  }

  private function buildInstalledClauseHierarchyForCoverage(coverage : Coverable_Clauses_APDCoverage, rootEntity : RuleRootEntity) {
    if (coverage.ParentClause?.PublicId.NotBlank) {
      var parentCoverage = rootEntity.findCoverage(coverage.ParentClause.PublicId)
      if (parentCoverage == null) {
        throw new DisplayableException(DisplayKey.get("Web.APDValidation.XML.SubClause.DifferentCoverable.ByPublicId", coverage.CodeIdentifier, coverage.ParentClause.PublicId))
      }
      if (coverage.ClauseCategory.PublicId != parentCoverage.ClauseCategory.PublicId) {
        throw new DisplayableException(DisplayKey.get("Web.APDValidation.XML.SubClause.DifferentClauseCategory.ByPublicId", coverage.CodeIdentifier, coverage.ParentClause.PublicId))
      }
      var parentCodeIdentifer = parentCoverage.CodeIdentifier
      var installedClauseHierarchy = new InstalledClauseHierarchy()
      installedClauseHierarchy.CodeIdentifier = rootEntity.LinePrefix + coverage.CodeIdentifier
      installedClauseHierarchy.ParentCodeIdentifier = rootEntity.LinePrefix + parentCodeIdentifer
      installedClauseHierarchy.InstalledEdition = _lineEditions.get(null)
    }
  }

  private function buildInstalledClauseHierarchyForCondition(condition : Coverable_Clauses_APDCondition, rootEntity : RuleRootEntity) {
    if (condition.ParentClause?.PublicId.NotBlank) {
      var parentCondition = rootEntity.findCondition(condition.ParentClause.PublicId)
      if (parentCondition == null) {
        throw new DisplayableException(DisplayKey.get("Web.APDValidation.XML.SubClause.DifferentCoverable.ByPublicId", condition.CodeIdentifier, condition.ParentClause.PublicId))
      }
      if (condition.ClauseCategory.PublicId != parentCondition.ClauseCategory.PublicId) {
        throw new DisplayableException(DisplayKey.get("Web.APDValidation.XML.SubClause.DifferentClauseCategory.ByPublicId", condition.CodeIdentifier, condition.ParentClause.PublicId))
      }
      var parentCodeIdentifer = parentCondition.CodeIdentifier
      var installedClauseHierarchy = new InstalledClauseHierarchy()
      installedClauseHierarchy.CodeIdentifier = rootEntity.LinePrefix + condition.CodeIdentifier
      installedClauseHierarchy.ParentCodeIdentifier = rootEntity.LinePrefix + parentCodeIdentifer
      installedClauseHierarchy.InstalledEdition = _lineEditions.get(null)
    }
  }

  private function buildInstalledClauseHierarchyForExclusion(exclusion : Coverable_Clauses_APDExclusion, rootEntity : RuleRootEntity) {
    if (exclusion.ParentClause?.PublicId.NotBlank) {
      var parentExclusion = rootEntity.findExclusion(exclusion.ParentClause.PublicId)
      if (parentExclusion == null) {
        throw new DisplayableException(DisplayKey.get("Web.APDValidation.XML.SubClause.DifferentCoverable.ByPublicId", exclusion.CodeIdentifier, exclusion.ParentClause.PublicId))
      }
      if (exclusion.ClauseCategory.PublicId != parentExclusion.ClauseCategory.PublicId) {
        throw new DisplayableException(DisplayKey.get("Web.APDValidation.XML.SubClause.DifferentClauseCategory.ByPublicId", exclusion.CodeIdentifier, exclusion.ParentClause.PublicId))
      }
      var parentCodeIdentifer = parentExclusion.CodeIdentifier
      var installedClauseHierarchy = new InstalledClauseHierarchy()
      installedClauseHierarchy.CodeIdentifier = rootEntity.LinePrefix + exclusion.CodeIdentifier
      installedClauseHierarchy.ParentCodeIdentifier = rootEntity.LinePrefix + parentCodeIdentifer
      installedClauseHierarchy.InstalledEdition = _lineEditions.get(null)
    }
  }

  private function buildInstalledRulesForCoverableField(fld : Coverable_Fields_APDField, rootEntity : RuleRootEntity) {
    fld.Rules.APDDropDownEntryRule.each(\dder -> {
      var dropdownRuleIdentifier = ProductEditionKey.makeCompoundKey({rootEntity.QualifiedTypeName, fld.Name, dder.DropDownEntry.Code})
      buildInstalledDropDownEntryRule(dder, dropdownRuleIdentifier, rootEntity, InstalledRuleOwnerType.TC_RISKOBJECTTYPEKEY)
    })

    fld.Rules.APDAttributeRule.each(\ar -> {
      buildInstalledFieldRule(ar, ProductEditionKey.makeCompoundKey({rootEntity.QualifiedTypeName, fld.Name}), fld.Type, getTypelistToUse(fld), rootEntity)
    })
  }

  private function buildInstalledRulesForExposureField(expfld : Coverable_Exposures_APDExposure_Fields_APDExposureField, expRoot : RuleRootEntity) {
    expfld.Rules.APDDropDownEntryRule.each(\dder -> {
      var dropdownRuleIdentifier = ProductEditionKey.makeCompoundKey({expRoot.QualifiedTypeName, expfld.Name, dder.DropDownEntry.Code})
      buildInstalledDropDownEntryRule(dder, dropdownRuleIdentifier, expRoot, InstalledRuleOwnerType.TC_RISKOBJECTTYPEKEY)
    })

    expfld.Rules.APDAttributeRule.each(\ar -> {
      buildInstalledFieldRule(ar, ProductEditionKey.makeCompoundKey({expRoot.QualifiedTypeName, expfld.Name}), expfld.Type, getTypelistToUse(expfld), expRoot)
    })
  }

  private function buildInstalledRulesForCoverage(cvg : Coverable_Clauses_APDCoverage, rootEntity : RuleRootEntity) {
    var clauseCodeIdentifier = rootEntity.LinePrefix + cvg.CodeIdentifier

    cvg.Rules.APDClauseRule.each(\r -> {
      buildInstalledClauseRule(r, clauseCodeIdentifier, rootEntity)
    })

    cvg.Terms.APDTerm.each(\t -> {
      var termCodeIdentifier = clauseCodeIdentifier + t.Name
      t.Rules.APDDropDownEntryRule.each(\dder -> {
        var dropdownRuleIdentifier = getTermDropDownEntryRuleIdentifier(dder, t, termCodeIdentifier)
        var ownerType = getInstalledRuleOwnerType(t)
        buildInstalledDropDownEntryRule(dder, dropdownRuleIdentifier, rootEntity, ownerType)
      })

      t.Rules.APDAttributeRule.each(\ar -> {
        buildInstalledTermRule(ar, termCodeIdentifier, t, rootEntity)
      })
    })
  }

  private function buildInstalledRulesForExclusion(exc : Coverable_Clauses_APDExclusion, rootEntity : RuleRootEntity) {
    var clauseCodeIdentifier = rootEntity.LinePrefix + exc.CodeIdentifier

    exc.Rules.APDClauseRule.each(\r -> {
      buildInstalledClauseRule(r, clauseCodeIdentifier, rootEntity)
    })

    exc.Terms.APDTerm.each(\t -> {
      var termCodeIdentifier = clauseCodeIdentifier + t.Name
      t.Rules.APDDropDownEntryRule.each(\dder -> {
        var dropdownRuleIdentifier = getTermDropDownEntryRuleIdentifier(dder, t, termCodeIdentifier)
        var ownerType = getInstalledRuleOwnerType(t)
        buildInstalledDropDownEntryRule(dder, dropdownRuleIdentifier, rootEntity, ownerType)
      })

      t.Rules.APDAttributeRule.each(\ar -> {
        buildInstalledTermRule(ar, termCodeIdentifier, t, rootEntity)
      })
    })
  }

  private function buildInstalledRulesForCondition(con : Coverable_Clauses_APDCondition, rootEntity : RuleRootEntity) {
    var clauseCodeIdentifier = rootEntity.LinePrefix + con.CodeIdentifier

    con.Rules.APDClauseRule.each(\r -> {
      buildInstalledClauseRule(r, clauseCodeIdentifier, rootEntity)
    })

    con.Terms.APDTerm.each(\t -> {
      var termCodeIdentifier = clauseCodeIdentifier + t.Name
      t.Rules.APDDropDownEntryRule.each(\dder -> {
        var dropdownRuleIdentifier = getTermDropDownEntryRuleIdentifier(dder, t, termCodeIdentifier)
        var ownerType = getInstalledRuleOwnerType(t)
        buildInstalledDropDownEntryRule(dder, dropdownRuleIdentifier, rootEntity, ownerType)
      })

      t.Rules.APDAttributeRule.each(\ar -> {
        buildInstalledTermRule(ar, termCodeIdentifier, t, rootEntity)
      })
    })
  }

  /**
   * Convert a APDDropDownType on a term into an InstalledRuleOwnerType for a term
   */
  private function getInstalledRuleOwnerType(term : Clause_Terms_APDTerm) : InstalledRuleOwnerType {
    var dropDownType = term.DropDownType
    switch (dropDownType) {
      case APDDropDownType.TC_TYPELIST.Code:
        return InstalledRuleOwnerType.TC_TERMTYPEKEY
      case APDDropDownType.TC_OPTION.Code:
        return InstalledRuleOwnerType.TC_TERMOPTIONCHOICE
      case APDDropDownType.TC_PACKAGE.Code:
        return InstalledRuleOwnerType.TC_TERMPACKAGECHOICE
      default:
        throw new UnsupportedOperationException("There is no owner type for dropdown type '${dropDownType}'")
    }
  }

  /**
   * Returns the identifier for a rule on a term dropdown entry.
   * <ul>
   * <li> For a typekey value in a covterm, the identifier has the form "CovTermCodeIdentifier.TypekeyCode"
   * <li> For option or package values, the identifier should be the same as the value's CodeIdentifier in the product
   * model. APD generates the code identifiers by concatenating the covterm's CodeIdentifier with the dropdown
   * entry's code. For monetary values, the dropdown entry's currency is also appended to the identifier.
   * </ul>
   */
  private static function getTermDropDownEntryRuleIdentifier(dropdownRule : Attribute_Rules_APDDropDownEntryRule, term : Clause_Terms_APDTerm, termCodeIdentifier : String) : String {
    // for rules on typekey values
    if (term.DropDownType == APDDropDownType.TC_TYPELIST.Code) {
      return ProductEditionKey.makeCompoundKey({termCodeIdentifier, dropdownRule.DropDownEntry.Code})
    }

    // for rules on option or package values
    var choiceCode = getCovTermChoiceCode(term, dropdownRule.DropDownEntry.Code, dropdownRule.DropDownEntry.Name)
    return termCodeIdentifier + choiceCode
  }

  /**
   * Returns the code for the dropdown entry on "term" with the given "entryCode" and "entryName". For monetary
   * option or package terms, the returned code will include the currency from the dropdown entry if there is one,
   * or the system default currency otherwise. This corresponds to the optionCode and packageCode attributes on
   * CovTermOpt and CovTermPack elements in the PC product model.
   */
  private static function getCovTermChoiceCode(term : Clause_Terms_APDTerm, entryCode : String, entryName : String) : String {
    if (term.DropdownColumns.APDDropdownColumn.hasMatch(\dropdownColumn -> dropdownColumn.ValueType == CovTermModelVal.TC_MONEY.Code)) {
      var dropdownEntry = term.Codes.APDDropDownEntry.singleWhere(\entry -> entry.Code == entryCode and entry.Name == entryName)
      var currency = dropdownEntry.Currency ?: CurrencyUtil.DefaultCurrency.Code
      return entryCode + currency
    }
    return entryCode
  }

  private function buildInstalledClauseRule(r : Clause_Rules_APDClauseRule, codeIdentifier : String, rootEntity : RuleRootEntity) {
    var installedRule = new InstalledRule()
    installedRule.InstalledEdition = _lineEditions.get(r.Edition)
    installedRule.CodeIdentifier = codeIdentifier
    installedRule.Type = APDRuleType.get(r.RuleType)
    installedRule.DefaultExistence = APDDataExistenceType.get(r.DefaultExistence)

    r.RuleElements.APDRuleElement.each(\re -> {
      buildInstalledRuleElements(re, installedRule, rootEntity)
    })

    installedRule.OwnerType = InstalledRuleOwnerType.TC_CLAUSE
    installedRule.RootEntity = "entity." + rootEntity.QualifiedTypeName
    installedRule.validate()
  }

  /**
   * Creates an InstalledRule for a coverable or exposure field. Although fields and terms are similar in APD,
   * default rules must be created differently for them.
   */
  private function buildInstalledFieldRule(r : Attribute_Rules_APDAttributeRule, codeIdentifier : String, fieldType : String, typelistName : String, rootEntity : RuleRootEntity) {
    if (r.RuleType == APDRuleType.TC_EXISTENCE.Code) {
      buildInstalledAttributeExistenceRule(r, codeIdentifier, rootEntity, InstalledRuleOwnerType.TC_RISKOBJECTPROPERTY)
    } else if (r.RuleType == APDRuleType.TC_DEFAULT.Code or r.RuleType == APDRuleType.TC_MIN.Code or r.RuleType == APDRuleType.TC_MAX.Code) {
      buildInstalledFieldDefaultRule(r, codeIdentifier, fieldType, typelistName, rootEntity)
    } else {
      APDLoggerCategory.IMPORT.info("Rule type " + r.RuleType + " on " + codeIdentifier + " not handled yet")
    }
  }

  /**
   * Creates an InstalledRule for a term. Although fields and terms are similar in APD, default rules must be
   * created differently for them.
   */
  private function buildInstalledTermRule(r : Attribute_Rules_APDAttributeRule, codeIdentifier : String, term : Clause_Terms_APDTerm, rootEntity : RuleRootEntity) {
    if (r.RuleType == APDRuleType.TC_EXISTENCE.Code) {
      buildInstalledAttributeExistenceRule(r, codeIdentifier, rootEntity, InstalledRuleOwnerType.TC_CLAUSETERM)
    } else if (r.RuleType == APDRuleType.TC_DEFAULT.Code or r.RuleType == APDRuleType.TC_MIN.Code or r.RuleType == APDRuleType.TC_MAX.Code) {
      buildInstalledTermDefaultRule(r, codeIdentifier, term, rootEntity)
    } else {
      APDLoggerCategory.IMPORT.info("Rule type " + r.RuleType + " on " + codeIdentifier + " not handled yet")
    }
  }

  /**
   * Creates an existence InstalledRule for either a field or a covterm.
   */
  private function buildInstalledAttributeExistenceRule(r : Attribute_Rules_APDAttributeRule, codeIdentifier : String, rootEntity : RuleRootEntity, ownerType : InstalledRuleOwnerType) {
    var installedRule = new InstalledRule()
    installedRule.InstalledEdition = _lineEditions.get(r.Edition)
    installedRule.CodeIdentifier = codeIdentifier
    installedRule.Type = APDRuleType.get(r.RuleType)
    installedRule.DefaultExistence = APDDataExistenceType.get(r.DefaultExistence)

    r.RuleElements.APDRuleElement.each(\re -> {
      buildInstalledRuleElements(re, installedRule, rootEntity)
    })

    installedRule.OwnerType = ownerType
    installedRule.RootEntity = "entity." + rootEntity.QualifiedTypeName
    installedRule.validate()
  }

  /**
   * Creates an InstalledRule for a coverable or exposure field default. The ValueType and DefaultXXXValue fields in
   * the InstalledRule are set based on the type of the field, so later the DatabaseProductEdition can create RuleSets
   * that return the right types.
   */
  private function buildInstalledFieldDefaultRule(r : Attribute_Rules_APDAttributeRule, codeIdentifier : String, fieldType : String, typelistName : String, rootEntity : RuleRootEntity) {
    var installedRule = new InstalledRule()
    installedRule.Type = APDRuleType.get(r.RuleType)
    installedRule.InstalledEdition = _lineEditions.get(r.Edition)
    installedRule.CodeIdentifier = codeIdentifier

    switch (APDFieldType.get(fieldType)) {
      case APDFieldType.TC_BIGDECIMAL:
      case APDFieldType.TC_MONEY:
        installedRule.ValueType = InstalledRuleValueType.TC_DECIMAL
        installedRule.DefaultDecimalValue = r.DefaultDecimalValue
        break
      case APDFieldType.TC_BOOLEAN:
        installedRule.ValueType = InstalledRuleValueType.TC_BOOLEAN
        installedRule.DefaultBooleanValue = r.DefaultBitValue
        break
      case APDFieldType.TC_DATE:
        installedRule.ValueType = InstalledRuleValueType.TC_DATE
        installedRule.DefaultDateValue = r.DefaultDateValue?.toCalendar().Time
        break
      case APDFieldType.TC_INTEGER:
        installedRule.ValueType = InstalledRuleValueType.TC_INTEGER
        installedRule.DefaultIntegerValue = r.DefaultIntegerValue
        break
      case APDFieldType.TC_TYPEKEY:
        installedRule.ValueType = InstalledRuleValueType.TC_TYPEKEY
        installedRule.DefaultTypekeyValue = r.DefaultCodeValue.Code
        installedRule.DefaultTypelist = typelistName
        break
      case APDFieldType.TC_VARCHAR:
        installedRule.ValueType = InstalledRuleValueType.TC_STRING
        installedRule.DefaultStringValue = r.DefaultStringValue
        break
      default:
        // This includes location and party fields, for which we don't support default rules
        throw new DisplayableException(DisplayKey.get("Web.APD.Import.Editions.Rules.InvalidFieldType", installedRule.CodeIdentifier))
    }

    r.RuleElements.APDRuleElement.each(\re -> {
      buildInstalledFieldDefaultRuleElement(installedRule, re, fieldType, rootEntity)
    })

    installedRule.OwnerType = InstalledRuleOwnerType.TC_RISKOBJECTPROPERTY
    installedRule.RootEntity = "entity." + rootEntity.QualifiedTypeName
    installedRule.validate()
  }

  /**
   * Creates an InstalledRuleElement for a coverable or exposure field default. The DefaultXXXValue field in the
   * InstalledRuleElement is set based on the type of the field.
   */
  private function buildInstalledFieldDefaultRuleElement(installedRule : InstalledRule, re : Rule_RuleElements_APDRuleElement, fieldType : String, rootEntity : RuleRootEntity) {
    var installedRuleElement = new InstalledRuleElement()
    installedRuleElement.InstalledRule = installedRule
    var conditionString = buildRuleConditions(re, rootEntity).join(" and ")
    installedRuleElement.Condition = conditionString
    installedRuleElement.Sequence = re.Sequence

    switch (APDFieldType.get(fieldType)) {
      case APDFieldType.TC_BIGDECIMAL:
      case APDFieldType.TC_MONEY:
        installedRuleElement.DefaultDecimalValue = re.DefaultDecimalValue
        break
      case APDFieldType.TC_BOOLEAN:
        installedRuleElement.DefaultBooleanValue = re.DefaultBitValue
        break
      case APDFieldType.TC_DATE:
        installedRuleElement.DefaultDateValue = re.DefaultDateValue.toCalendar().Time
        break
      case APDFieldType.TC_INTEGER:
        installedRuleElement.DefaultIntegerValue = re.DefaultIntegerValue
        break
      case APDFieldType.TC_TYPEKEY:
        installedRuleElement.DefaultTypekeyValue = re.DefaultCodeValue.Code
        break
      case APDFieldType.TC_VARCHAR:
        installedRuleElement.DefaultStringValue = re.DefaultStringValue
        break
      default:
        // This includes location and party fields, for which we don't support default rules
        throw new DisplayableException(DisplayKey.get("Web.APD.Import.Editions.Rules.InvalidFieldType", installedRule.CodeIdentifier))
    }
  }

  /**
   * Creates an InstalledRule for an APD covterm default. The ValueType and DefaultXXXValue fields in the
   * InstalledRule are set based on the type of the covterm, so later the DatabaseProductEdition can create RuleSets
   * that return the right types. Although covterms in APD can have any type in APDFieldType, the default values must
   * be mapped to a decimal or a string for use on installed lines, to match the way defaulting works in existing PC
   * product model code.
   */
  private function buildInstalledTermDefaultRule(r : Attribute_Rules_APDAttributeRule, codeIdentifier : String, term : Clause_Terms_APDTerm, rootEntity : RuleRootEntity) {
    var installedRule = new InstalledRule()
    installedRule.Type = APDRuleType.get(r.RuleType)
    installedRule.InstalledEdition = _lineEditions.get(r.Edition)
    installedRule.CodeIdentifier = codeIdentifier

    switch (APDFieldType.get(term.Type)) {
      case APDFieldType.TC_BIGDECIMAL:
      case APDFieldType.TC_MONEY:
        installedRule.ValueType = InstalledRuleValueType.TC_DECIMAL
        installedRule.DefaultDecimalValue = r.DefaultDecimalValue
        break
      case APDFieldType.TC_BOOLEAN:
        // boolean covterms in APD map to generic covterms in PC, which need a string for the default value
        installedRule.ValueType = InstalledRuleValueType.TC_STRING
        installedRule.DefaultStringValue = r.DefaultBitValue == null ? null : Boolean.toString(r.DefaultBitValue)
        break
      case APDFieldType.TC_DATE:
        // date covterms in APD map to generic covterms in PC, which need a string for the default value
        installedRule.ValueType = InstalledRuleValueType.TC_STRING
        installedRule.DefaultStringValue = r.DefaultDateValue == null ?
            null : r.DefaultDateValue.toCalendar().Time.format(DateConverterUtil.DATE_TO_STRING)
        break
      case APDFieldType.TC_INTEGER:
        // integer covterms in APD map to direct covterms in PC, which need a decimal for the default value
        installedRule.ValueType = InstalledRuleValueType.TC_DECIMAL
        installedRule.DefaultDecimalValue = r.DefaultIntegerValue
        break
      case APDFieldType.TC_TYPEKEY:
        if (r.DefaultCalculatedValue != null) {
          // For the supported SUM, MIN and MAX functions, they are returning Decimal for now
          installedRule.ValueType = InstalledRuleValueType.TC_DECIMAL
        } else {
          // typekey covterms in APD map to typekey, option and package covterms in PC, which need a string for the default value
          installedRule.ValueType = InstalledRuleValueType.TC_STRING
          if (term.DropDownType == APDDropDownType.TC_TYPELIST.Code) {
            installedRule.DefaultStringValue = r.DefaultCodeValue.Code
          } else {
            installedRule.DefaultStringValue = (r.DefaultCodeValue.Code == null) ? null : getCovTermChoiceCode(term, r.DefaultCodeValue.Code, r.DefaultCodeValue.Name)
          }
        }
        break
      case APDFieldType.TC_VARCHAR:
        installedRule.ValueType = InstalledRuleValueType.TC_STRING
        installedRule.DefaultStringValue = r.DefaultStringValue
        break
      default:
        // This includes location and party fields, for which we don't support default rules
        throw new DisplayableException(DisplayKey.get("Web.APD.Import.Editions.Rules.InvalidTermType", installedRule.CodeIdentifier))
    }

    if (r.DefaultCalculatedValue != null) {
      installedRule.DefaultValueScript = buildRuleCalculatedDefaultScript(r.DefaultCalculatedValue, rootEntity)
    }

    r.RuleElements.APDRuleElement.each(\re -> {
      buildInstalledTermDefaultRuleElement(installedRule, re, term, rootEntity)
    })

    installedRule.OwnerType = InstalledRuleOwnerType.TC_CLAUSETERM
    installedRule.RootEntity = "entity." + rootEntity.QualifiedTypeName
    installedRule.validate()
  }

  /**
   * Creates an InstalledRuleElement for a covterm default. The DefaultXXXValue field in the InstalledRuleElement
   * is set based on the type of the field.
   */
  private function buildInstalledTermDefaultRuleElement(installedRule : InstalledRule, re : Rule_RuleElements_APDRuleElement, term : Clause_Terms_APDTerm, rootEntity : RuleRootEntity) {
    var installedRuleElement = new InstalledRuleElement()
    installedRuleElement.InstalledRule = installedRule
    var conditionString = buildRuleConditions(re, rootEntity).join(" and ")
    installedRuleElement.Condition = conditionString
    installedRuleElement.Sequence = re.Sequence

    switch (APDFieldType.get(term.Type)) {
      case APDFieldType.TC_BIGDECIMAL:
      case APDFieldType.TC_MONEY:
        installedRuleElement.DefaultDecimalValue = re.DefaultDecimalValue
        break
      case APDFieldType.TC_BOOLEAN:
        // boolean covterms in APD map to generic covterms in PC, which need a string for the default value
        installedRuleElement.DefaultStringValue = Boolean.toString(re.DefaultBitValue)
        break
      case APDFieldType.TC_DATE:
        // date covterms in APD map to generic covterms in PC, which need a string for the default value
        installedRuleElement.DefaultStringValue = re.DefaultDateValue.toCalendar().Time.format(DateConverterUtil.DATE_TO_STRING)
        break
      case APDFieldType.TC_INTEGER:
        // integer covterms in APD map to direct covterms in PC, which need a decimal for the default value
        installedRuleElement.DefaultDecimalValue = re.DefaultIntegerValue
        break
      case APDFieldType.TC_TYPEKEY:
        // typekey covterms in APD map to typekey, option and package covterms in PC, which need a string for the default value
        if (term.DropDownType == APDDropDownType.TC_TYPELIST.Code) {
          installedRuleElement.DefaultStringValue = re.DefaultCodeValue.Code
        } else {
          installedRuleElement.DefaultStringValue = getCovTermChoiceCode(term, re.DefaultCodeValue.Code, re.DefaultCodeValue.Name)
        }
        break
      case APDFieldType.TC_VARCHAR:
        installedRuleElement.DefaultStringValue = re.DefaultStringValue
        break
      default:
        // This includes location and party fields, for which we don't support default rules
        throw new DisplayableException(DisplayKey.get("Web.APD.Import.Editions.Rules.InvalidTermType", installedRule.CodeIdentifier))
    }
  }

  private function buildInstalledDropDownEntryRule(r : Attribute_Rules_APDDropDownEntryRule, codeIdentifier : String, rootEntity : RuleRootEntity, ownerType : InstalledRuleOwnerType) {
    var installedRule = new InstalledRule()
    installedRule.InstalledEdition = _lineEditions.get(r.Edition)
    installedRule.CodeIdentifier = codeIdentifier
    installedRule.Type = APDRuleType.get(r.RuleType)
    installedRule.DefaultExistence = APDDataExistenceType.get(r.DefaultExistence)

    r.RuleElements.APDRuleElement.each(\re -> {
      buildInstalledRuleElements(re, installedRule, rootEntity)
    })

    installedRule.OwnerType = ownerType
    installedRule.RootEntity = "entity." + rootEntity.QualifiedTypeName
    installedRule.validate()
  }

  private function getTypelistToUse(expfld : Coverable_Exposures_APDExposure_Fields_APDExposureField) : String {
    return getTypelistToUse(expfld.Type, expfld.Typelist, expfld.OwningDropDown, expfld.Name)
  }

  private function getTypelistToUse(fld : Coverable_Fields_APDField) : String {
    return getTypelistToUse(fld.Type, fld.Typelist, fld.OwningDropDown, fld.Name)
  }

  /**
   * Typekey fields can own the typelist they use or point to another typelist. This extracts the name of the typelist
   * this field uses given the Type, OwningDropdown, TypeList, and Name values for a field. See {@link gw.apd.model.APDAttributeEnhancement#getTypelistToUse()}
   *
   * @return the name of the typelist this typekey fields uses. null if the field is not a typekey.
   */
  private function getTypelistToUse(fieldType : String, typelist : String, owningDropdown : Attribute_OwningDropDown, name : String) : String {
    // typelists are only associated with typekey fields
    if (fieldType != APDFieldType.TC_TYPEKEY.Code) {
      return null
    }

    // this field owns the typelist
    if (typelist != null and owningDropdown.PublicId == null) {
      return typelist
    }

    // this field points to a shared typelist
    if (typelist == null and owningDropdown.PublicId != null) {
      var owningAttribute = _ruleTargets.get(owningDropdown.PublicId)
      if (owningAttribute typeis FieldTarget) {
        return owningAttribute.TypeList
      } else {
        throw new IllegalStateException("Could not find owning typelist for field with name '${name}'")
      }
    }

    throw new IllegalStateException("Typekey field with name '${name}' is invalid."
        + " A typekey field must have a non-null Typelist property or a non-null OwningDropDown property")
  }

  private function removeExistingPreLoadedEditions(lineCode : String) {
    var existingPreLoadedEditions = Query.make(InstalledEdition)
        .compare(InstalledEdition#LineCode, Relop.Equals, lineCode)
        .compare(InstalledEdition#EditionStatus, Relop.Equals, EditionStatus.TC_PRELOADED)
        .select()

    var bundle = gw.transaction.Transaction.getCurrent()
    existingPreLoadedEditions.each(\ed -> {
      ed = bundle.add(ed)
      ed.remove()
    })
  }

  /**
   * Generate a map of all entities that can be pointed to by rule conditions.
   * Generate a map of all entities that can be root types for rule condition gosu expressions.
   */
  private function preprocessLine(line : Import_APDProductLine) {
    // build rule targets and root entities for product line
    _ruleRootEntities.put(line.PublicId, new RuleRootEntity(line))

    // line, exposure, and core fields
    line.CoreFields.APDCoreAttribute.each(\attr ->
        _ruleTargets.put(attr.PublicId, new CoreFieldTarget(attr)))

    line.Fields.APDField.each(\fld ->
        _ruleTargets.put(fld.PublicId, new FieldTarget(fld)))

    line.Exposures.APDExposure.each(\exp ->
        exp.Fields.APDExposureField.each(\fld ->
            _ruleTargets.put(fld.PublicId, new FieldTarget(fld))
        )
    )

    // line coverages, exclusions, and conditions and their terms
    line.Clauses.APDCoverage.each(\cvg -> {
      _ruleTargets.put(cvg.PublicId, new ClauseTarget(cvg))
      cvg.Terms.APDTerm.each(\term ->
          _ruleTargets.put(term.PublicId, new TermTarget(term, line.LinePrefix)))
    })

    line.Clauses.APDExclusion.each(\cond -> {
      _ruleTargets.put(cond.PublicId, new ClauseTarget(cond))
      cond.Terms.APDTerm.each(\term ->
          _ruleTargets.put(term.PublicId, new TermTarget(term, line.LinePrefix)))
    })

    line.Clauses.APDCondition.each(\excl -> {
      _ruleTargets.put(excl.PublicId, new ClauseTarget(excl))
      excl.Terms.APDTerm.each(\term ->
          _ruleTargets.put(term.PublicId, new TermTarget(term, line.LinePrefix)))
    })


    // build rule targets and root entities for all coverables on the line
    _import.APDCoverable.each(\cbl -> {
      _ruleRootEntities.put(cbl.PublicId, new RuleRootEntity(cbl, line.LinePrefix))

      // coverable, exposure, and core fields
      cbl.CoreFields.APDCoreAttribute.each(\attr ->
          _ruleTargets.put(attr.PublicId, new CoreFieldTarget(attr)))

      cbl.Fields.APDField.each(\fld ->
          _ruleTargets.put(fld.PublicId, new FieldTarget(fld)))

      cbl.Exposures.APDExposure.each(\exp ->
          exp.Fields.APDExposureField.each(\fld ->
              _ruleTargets.put(fld.PublicId, new FieldTarget(fld))
          )
      )

      // coverable coverages, exclusions, and conditions and their terms
      cbl.Clauses.APDCoverage.each(\cvg -> {
        _ruleTargets.put(cvg.PublicId, new ClauseTarget(cvg))
        cvg.Terms.APDTerm.each(\term ->
            _ruleTargets.put(term.PublicId, new TermTarget(term, line.LinePrefix)))
      })

      cbl.Clauses.APDExclusion.each(\excl -> {
        _ruleTargets.put(excl.PublicId, new ClauseTarget(excl))

        excl.Terms.APDTerm.each(\term ->
            _ruleTargets.put(term.PublicId, new TermTarget(term, line.LinePrefix)))
      })

      cbl.Clauses.APDCondition.each(\cond -> {
        _ruleTargets.put(cond.PublicId, new ClauseTarget(cond))

        cond.Terms.APDTerm.each(\term ->
            _ruleTargets.put(term.PublicId, new TermTarget(term, line.LinePrefix)))
      })
    })
  }

  private function buildRuleConditions(ruleElement : Rule_RuleElements_APDRuleElement, rootEntity : RuleRootEntity) : List<String> {
    return ruleElement.RuleConditions.APDRuleCondition.map(\c -> buildRuleConditionGosuExpression(c, rootEntity))
  }

  private function buildRuleConditionTargets(ruleElement : Rule_RuleElements_APDRuleElement, rootEntity : RuleRootEntity) : List<String> {
    return ruleElement.RuleConditions.APDRuleCondition.where(\c -> !(getTarget(c) typeis CoreFieldTarget))
        .map(\c -> getTargetIdentifier(rootEntity, getTarget(c)))
  }

  private function buildInstalledRuleElements(re : Rule_RuleElements_APDRuleElement, installedRule : InstalledRule, rootEntity : RuleRootEntity) {
    var installedRuleElement = new InstalledRuleElement()
    installedRuleElement.InstalledRule = installedRule
    var conditionString = buildRuleConditions(re, rootEntity).join(" and ")
    installedRuleElement.Condition = conditionString
    installedRuleElement.Existence = APDDataExistenceType.get(re.Existence)
    installedRuleElement.Sequence = re.Sequence
    if (installedRule.Type == APDRuleType.TC_EXISTENCE) {
      var conditionTargetsString = buildRuleConditionTargets(re, rootEntity).join(",")
      installedRuleElement.ConditionTargets = conditionTargetsString
    }
  }

  private function buildRuleCalculatedDefaultScript(defaultCalculatedValue : Rule_DefaultCalculatedValue, rootEntity : RuleRootEntity) : String {
    var resolvedArgumentReferences = defaultCalculatedValue.Arguments.Argument
        .map(\argument -> {
          var termTarget = getRuleTarget(argument.PublicId)
          if ((termTarget typeis TermTarget) and termTarget.IsOptionTerm) {
            return getOptionTargetExpression(termTarget, rootEntity)
          }
          return getTargetExpression(termTarget, rootEntity)
        })

    return APDCalculatedValuesConfig.createGosuExpression(APDFunctionType.get(defaultCalculatedValue.Function), resolvedArgumentReferences)
  }

  /**
   * Returns a Gosu expression for this rule condition, which can be evaluated on an installed line.
   * <p/>
   * This method is meant to be called on a template for an installed line after generation-time validations have passed,
   * so this rule condition should be valid and fields required for generation should be non-null.
   */
  private function buildRuleConditionGosuExpression(condition : Rule_RuleElements_APDRuleElement_RuleConditions_APDRuleCondition, rootEntity : RuleRootEntity) : String {
    var ruleTarget = getTarget(condition)
    var targetExpression = getTargetExpression(ruleTarget, rootEntity)
    var operatorExpression = getOperatorExpression(condition.Operator)
    var valueExpression = getValueExpression(condition)

    return "${targetExpression} ${operatorExpression} ${valueExpression}"
  }

  private function getTargetExpression(target : RuleTarget, rootEntity : RuleRootEntity) : String {
    var rootExpression = rootEntity.QualifiedTypeName
    var path = rootExpression + "." + getPathToTarget(rootEntity, target)

    // Clause targets can only be tested for existence
    if (target typeis ClauseTarget) {
      return path + "Exists"
    }

    // Get the actual value for comparison from the attribute's path
    return getValueExpression(path, target)
  }

  private function getOptionTargetExpression(target : FieldTarget, rootEntity : RuleRootEntity) : String {
    return {rootEntity.QualifiedTypeName, getPathToTarget(rootEntity, target), "Value"}.join(".")
  }

  /**
   * Given a Gosu expression to access the target of a rule on an installed line, return a Gosu expression that provides
   * an actual value for a comparison operation. For example, typekey codes are used in comparisons on typekey fields,
   * option codes are used for option terms, and policy locations need to be mapped to their jurisdictions.
   */
  private function getValueExpression(path : String, target : RuleTarget) : String {
    if (target typeis TermTarget) {
      // Test against the value of a direct term
      if (target.Type != APDFieldType.TC_TYPEKEY.Code) {
        return path + ".Value"
      }

      // Test against the code of a typelist, or code identifier of an option or package term
      switch (target.DropDownType) {
        case APDDropDownType.TC_TYPELIST.Code:
          return path + ".Value.Code"
        case APDDropDownType.TC_OPTION.Code:
          return path + ".OptionValue.OptionCode"
        case APDDropDownType.TC_PACKAGE.Code:
          return path + ".PackageValue.PackageCode"
        default:
          throw new DisplayableException(DisplayKey.get("Web.APD.Import.Editions.Rules.InvalidDropDownType", target.Name))
      }
    }

    // The Product core field is special-cased since it is marked as a typelist attribute but is not a real typelist
    if (target typeis CoreFieldTarget and target.FieldType == APDCoreFieldType.TC_APDPRODUCT.Code) {
      return path + ".CodeIdentifier"
    }

    // For coverable, exposure, and core fields
    if (target typeis FieldTarget) {
      switch (target.Type) {
        case APDFieldType.TC_INTEGER.Code:
        case APDFieldType.TC_BIGDECIMAL.Code:
        case APDFieldType.TC_BOOLEAN.Code:
        case APDFieldType.TC_VARCHAR.Code:
        case APDFieldType.TC_DATE.Code:
        case APDFieldType.TC_MONEY.Code:
          // Use the path directly for comparisons
          return path

        case APDFieldType.TC_TYPEKEY.Code:
          // Use the code from the path (which leads to a typekey) for comparison
          return path + ".Code"

        case APDFieldType.TC_LOCATION.Code:
          // Use the jurisdiction code from the path (which leads to a PolicyLocation)
          return "gw.api.util.JurisdictionMappingUtil.getJurisdiction(${path}).Code"

        default:
          // This includes TC_PARTY, which isn't allowed in rule conditions
          throw new DisplayableException(DisplayKey.get("Web.APD.Import.Editions.Rules.IncompatibleAttributeType", target.Name, target.Type))
      }
    }

    throw new IllegalStateException("Unable to find value expression for rule target of type '${typeof target}'")
  }

  /**
   * Given a condition which can point to either an attribute or a clause, return the definitive target the condition.
   */
  private function getTarget(condition : Rule_RuleElements_APDRuleElement_RuleConditions_APDRuleCondition) : RuleTarget {
    if ((condition.Attribute == null and condition.Clause == null) or
        (condition.Attribute != null and condition.Clause != null)) {
      throw new IllegalStateException("Condition must point to either an attribute or a clause")
    }

    if (condition.Attribute != null) {
      return getRuleTarget(condition.Attribute.PublicId)
    } else {
      return getRuleTarget(condition.Clause.PublicId)
    }
  }

  /**
   * Returns a Gosu expression to access a rule condition target in an installed line.
   */
  private function getPathToTarget(rootEntity : RuleRootEntity, target : RuleTarget) : String {
    // Core attributes can be accessed without traversing any additional entities
    if (target typeis CoreFieldTarget) {
      return getPathToCoreField(target)
    }

    // Build a path from the root entity in the installed line to the target within the line
    return getPathToLineTarget(rootEntity, target)
  }

  private function getPathToCoreField(coreField : CoreFieldTarget) : String {
    // Start with a path to the PolicyPeriod
    var path = "Branch."

    // Extend the path to the Policy, if needed for the core field
    var fieldType = coreField.FieldType
    var entityType = APDCoreFieldType.getTypeKey(fieldType).Categories.whereTypeIs(APDCoreEntityType).single()
    if (entityType == APDCoreEntityType.TC_POLICY) {
      path = path + "Policy."
    } else if (entityType != APDCoreEntityType.TC_POLICYPERIOD) {
      throw new DisplayableException(DisplayKey.get("Web.APD.Import.Editions.Rules.UnknownCoreEntityType", entityType))
    }

    // Add the name of the core field to the path
    path += coreField.FieldType
    return path
  }

  /**
   * Returns a Gosu expression to access a rule target in an installed line.
   */
  private function getPathToLineTarget(entity : RuleRootEntity, target : RuleTarget) : String {
    // If the target is a field on this entity, return the field name
    if (target typeis FieldTarget and entity.ownsTarget(target)) {
      return target.Name
    }

    // If the target is a clause on this entity, return the clause accessor
    if ((target typeis ClauseTarget) and entity.ownsTarget(target)) {
      return entity.LinePrefix + target.CodeIdentifier
    }

    // If the target is a term on this entity, return the term accessor
    if (target typeis TermTarget) {
      var clause = getRuleTarget(target.ClauseId)
      if (entity.ownsTarget(clause)) {
        var pathToClause = entity.LinePrefix + (clause as ClauseTarget).CodeIdentifier
        return pathToClause + "." + target.CodeIdentifier + "Term"
      }
    }

    var parent = _ruleRootEntities.get(entity.ParentId)
    if (parent != null) {
      // If the target is not in this entity, build a path through the parent entity
      return parent.TypeName + "." + getPathToLineTarget(parent, target)
    }

    // Throw if the target is not found and there is no parent entity
    throw new DisplayableException(DisplayKey.get("Web.APD.Import.Editions.Rules.NoPathToRuleTarget", target))
  }

  private function getTargetIdentifier(entity : RuleRootEntity, target : RuleTarget) : String {
    if (target typeis FieldTarget and entity.ownsTarget(target)) {
      return entity.QualifiedTypeName + "." + target.Name
    }

    if ((target typeis ClauseTarget) and entity.ownsTarget(target)) {
      return entity.LinePrefix + target.CodeIdentifier
    }

    if (target typeis TermTarget) {
      var clause = getRuleTarget(target.ClauseId)
      if (entity.ownsTarget(clause)) {
        return target.CodeIdentifier
      }
    }

    var parent = _ruleRootEntities.get(entity.ParentId)
    if (parent != null) {
      return getTargetIdentifier(parent, target)
    }

    throw new DisplayableException(DisplayKey.get("Web.APD.Import.Editions.Rules.NoPathToRuleTarget", target))
  }

  /**
   * Returns a Gosu expression for the value of this rule condition.
   */
  private function getValueExpression(condition : Rule_RuleElements_APDRuleElement_RuleConditions_APDRuleCondition) : String {
    // Clauses can only be tested for existence
    if (condition.Clause != null) {
      return "true"
    }

    var attribute = getRuleTarget(condition.Attribute.PublicId) as FieldTarget

    switch (attribute.Type) {
      case APDFieldType.TC_INTEGER.Code:
      case APDFieldType.TC_BIGDECIMAL.Code:
      case APDFieldType.TC_BOOLEAN.Code:
      case APDFieldType.TC_MONEY.Code:
        // Treat ConditionValue string as a numeric or boolean literal
        return condition.ConditionValue

      case APDFieldType.TC_VARCHAR.Code:
        // Create a string literal from ConditionValue
        return "\"${condition.ConditionValue}\""

      case APDFieldType.TC_DATE.Code:
        // Create a Gosu date from the timestamp in the ConditionValue
        return "new Date(Long.valueOf(${condition.ConditionValue}))"

      case APDFieldType.TC_TYPEKEY.Code:
        // Create a string literal from the dropdown entry code
        return "\"${condition.CodeValue.Code}\""

      case APDFieldType.TC_LOCATION.Code:
        // Treat ConditionValue as a string containing a Jurisdiction code
        return "\"${condition.ConditionValue}\""

      default:
        // This includes TC_PARTY, which isn't allowed in rule conditions
        throw new DisplayableException(DisplayKey.get("Web.APD.Import.Editions.Rules.IncompatibleAttributeType", attribute.Name, attribute.Type))
    }
  }

  private function getRuleTarget(publicId : String) : RuleTarget {
    var ruleTarget = _ruleTargets.get(publicId)
    if (ruleTarget == null) {
      throw new DisplayableException(DisplayKey.get("Web.APD.Import.Editions.Rules.RuleTarget.InvalidPublicIdReferenced", publicId))
    }
    return ruleTarget
  }

  /**
   * Returns the Gosu operator for this rule condition.
   * <p>
   * TC_SELECTED and TC_NOTSELECTED are mapped to "==" and "!=" for a boolean comparison expression.
   * <p>
   * Assumes that this rule condition has an operator.
   */
  private function getOperatorExpression(operator : String) : String {
    switch (operator) {
      case APDRuleConditionOperator.TC_EQUALS.Code:
        return "=="
      case APDRuleConditionOperator.TC_NOTEQUALS.Code:
        return "!="
      case APDRuleConditionOperator.TC_LESSTHAN.Code:
        return "<"
      case APDRuleConditionOperator.TC_LESSTHANOREQUAL.Code:
        return "<="
      case APDRuleConditionOperator.TC_GREATERTHAN.Code:
        return ">"
      case APDRuleConditionOperator.TC_GREATERTHANOREQUAL.Code:
        return ">="
      case APDRuleConditionOperator.TC_SELECTED.Code:
        return "=="
      case APDRuleConditionOperator.TC_NOTSELECTED.Code:
        return "!="
      default:
        throw new DisplayableException(DisplayKey.get("Web.APD.Import.Editions.Rules.RuleElementCondition.InvalidOperator", operator))
    }
  }

  /**
   * Wraps XmlElements that can be used as root entities for rules (E.g. line, coverage, exposure) and provides
   * a set of methods that can be used for building editions, rules, and rule condition gosu expressions.
   */
  private class RuleRootEntity {
    private var _xmlElement : XmlElement
    private var _publicId : String
    private var _parentId : String
    private var _typeName : String
    private var _linePrefix : String

    construct(line : Import_APDProductLine) {
      _xmlElement = line
      _publicId = line.PublicId
      _parentId = line.Parent.PublicId
      _typeName = line.TypeName
      _linePrefix = line.LinePrefix

      validateName(this.LinePrefix, this.PublicId)
      validateName(this.TypeName, this.PublicId)
    }

    construct(coverable : Import_APDCoverable, linePrefix : String) {
      _xmlElement = coverable
      _publicId = coverable.PublicId
      _parentId = coverable.Parent.PublicId
      _typeName = coverable.TypeName
      _linePrefix = linePrefix

      validateName(this.TypeName, this.PublicId)
    }

    construct(exposure : Coverable_Exposures_APDExposure, linePrefix : String) {
      _xmlElement = exposure
      _publicId = exposure.PublicId
      _parentId = exposure.Coverable.PublicId
      _typeName = exposure.TypeName
      _linePrefix = linePrefix

      validateName(this.TypeName, this.PublicId)
    }

    property get PublicId() : String {
      return _publicId
    }

    property get ParentId() : String {
      return _parentId
    }

    property get TypeName() : String {
      return _typeName
    }

    property get LinePrefix() : String {
      return _linePrefix
    }

    property get QualifiedTypeName() : String {
      return LinePrefix + TypeName
    }

    function ownsTarget(target : RuleTarget) : boolean {
      if (target typeis FieldTarget) {
        if (_xmlElement typeis Import_APDProductLine) {
          return _xmlElement.Fields.APDField*.PublicId.contains(target.PublicId)
        } else if (_xmlElement typeis Import_APDCoverable) {
          return _xmlElement.Fields.APDField*.PublicId.contains(target.PublicId)
        } else if (_xmlElement typeis Coverable_Exposures_APDExposure) {
          return _xmlElement.Fields.APDExposureField*.PublicId.contains(target.PublicId)
        } else {
          throw new IllegalStateException("XmlElement of type '${typeof _xmlElement}}' is not supported.")

        }
      }

      if (target typeis ClauseTarget) {
        if (_xmlElement typeis Import_APDProductLine) {
          return _xmlElement.Clauses.APDCoverage*.PublicId.contains(target.PublicId)
              or _xmlElement.Clauses.APDCondition*.PublicId.contains(target.PublicId)
              or _xmlElement.Clauses.APDExclusion*.PublicId.contains(target.PublicId)
        } else if (_xmlElement typeis Import_APDCoverable) {
          return _xmlElement.Clauses.APDCoverage*.PublicId.contains(target.PublicId)
              or _xmlElement.Clauses.APDCondition*.PublicId.contains(target.PublicId)
              or _xmlElement.Clauses.APDExclusion*.PublicId.contains(target.PublicId)
        } else {
          throw new IllegalStateException("XmlElement of type '${typeof _xmlElement}}' is not supported.")
        }
      }
      throw new IllegalStateException("Rule target of type '${typeof target}}' is not supported.")
    }

    function findCoverage(publicId : String) : Coverable_Clauses_APDCoverage {
      if (_xmlElement typeis Import_APDProductLine) {
        return _xmlElement.Clauses.APDCoverage.firstWhere(\clause -> clause.PublicId == publicId)
      } else if (_xmlElement typeis Import_APDCoverable) {
        return _xmlElement.Clauses.APDCoverage.firstWhere(\clause -> clause.PublicId == publicId)
      }

      return null
    }

    function findCondition(publicId : String) : Coverable_Clauses_APDCondition {
      if (_xmlElement typeis Import_APDProductLine) {
        return _xmlElement.Clauses.APDCondition.firstWhere(\clause -> clause.PublicId == publicId)
      } else if (_xmlElement typeis Import_APDCoverable) {
        return _xmlElement.Clauses.APDCondition.firstWhere(\clause -> clause.PublicId == publicId)
      }

      return null
    }

    function findExclusion(publicId : String) : Coverable_Clauses_APDExclusion {
      if (_xmlElement typeis Import_APDProductLine) {
        return _xmlElement.Clauses.APDExclusion.firstWhere(\clause -> clause.PublicId == publicId)
      } else if (_xmlElement typeis Import_APDCoverable) {
        return _xmlElement.Clauses.APDExclusion.firstWhere(\clause -> clause.PublicId == publicId)
      }

      return null
    }
  }

  /**
   * RuleTarget and it subtypes represent the different APD entity types that can be pointed to by APDRuleConditions. Used to
   * generate gosu expressions for conditions when importing editions.
   */
  private abstract class RuleTarget {
    private var _publicId : String

    construct(publicId : String) {
      _publicId = publicId
    }

    property get PublicId() : String {
      return _publicId
    }
  }

  private class FieldTarget extends RuleTarget {
    private var _name : String
    private var _type : String
    private var _typelist : String

    construct(publicId : String, name : String, type : String, typelist : String) {
      super(publicId)
      _name = name
      _type = type
      _typelist = typelist
      validateAttributeName()
    }

    protected function validateAttributeName() {
      validateName(this.Name, this.PublicId)
    }

    construct(field : Coverable_Fields_APDField) {
      this(field.PublicId, field.Name, field.Type, field.Typelist)
    }

    construct(field : Coverable_Exposures_APDExposure_Fields_APDExposureField) {
      this(field.PublicId, field.Name, field.Type, field.Typelist)
    }

    property get Name() : String {
      return _name
    }

    property get Type() : String {
      return _type
    }

    property get TypeList() : String {
      return _typelist
    }
  }

  private class CoreFieldTarget extends FieldTarget {
    var _coreField : Coverable_CoreFields_APDCoreAttribute

    construct(coreField : Coverable_CoreFields_APDCoreAttribute) {
      super(coreField.PublicId, coreField.Name, coreField.Type, coreField.Typelist)
      _coreField = coreField
      validateName(this.FieldType, this.PublicId)
    }

    override protected function validateAttributeName() {
      // Core fields are created without names, so no validation is needed
    }

    property get FieldType() : String {
      return _coreField.FieldType
    }
  }

  private class TermTarget extends FieldTarget {
    private var _term : Clause_Terms_APDTerm
    private var _linePrefix : String

    construct(term : Clause_Terms_APDTerm, linePrefix : String) {
      super(term.PublicId, term.Name, term.Type, term.Typelist)
      _term = term
      _linePrefix = linePrefix
    }

    property get ClauseId() : String {
      return _term.Clause.PublicId
    }

    property get CodeIdentifier() : String {
      var clause = (getRuleTarget(ClauseId)) as ClauseTarget
      var clauseCodeIdentifier = clause.CodeIdentifier
      return _linePrefix + clauseCodeIdentifier + _name
    }

    property get DropDownType() : String {
      return _term.DropDownType
    }

    property get IsOptionTerm() : boolean {
      return Type == APDFieldType.TC_TYPEKEY.Code and DropDownType == APDDropDownType.TC_OPTION.Code
    }
  }

  private class ClauseTarget extends RuleTarget {
    private var _codeIdentifier : String

    construct(coverage : Coverable_Clauses_APDCoverage) {
      super(coverage.PublicId)
      _codeIdentifier = coverage.CodeIdentifier
      validateName(this.CodeIdentifier, this.PublicId)
    }

    construct(exclusion : Coverable_Clauses_APDExclusion) {
      super(exclusion.PublicId)
      _codeIdentifier = exclusion.CodeIdentifier
      validateName(this.CodeIdentifier, this.PublicId)
    }

    construct(condition : Coverable_Clauses_APDCondition) {
      super(condition.PublicId)
      _codeIdentifier = condition.CodeIdentifier
      validateName(this.CodeIdentifier, this.PublicId)
    }

    property get CodeIdentifier() : String {
      return _codeIdentifier
    }
  }

  /**
   * Throws an exception if the string "name" is an invalid APD name. The exception message will also include the
   * public id of the template element which contains the invalid string.
   */
  private static function validateName(name : String, publicId : String) {
    if (not CodegenValidator.isValidName(name)) {
      throw new DisplayableException(DisplayKey.get("Web.APD.Import.Editions.InvalidName.Message", publicId, name))
    }
  }

  private function validateImportMatchesInstalledProduct(product : gw.api.productmodel.Product) {
    // validate import template matches selected installed product
    if (product.CodeIdentifier != _import.APDProduct.CodeIdentifier) {
      throw new DisplayableException(DisplayKey.get("Web.APD.BuildInstalledEditionsFailure", _import.APDProduct.CodeIdentifier))
    }

    // validate import template only contains product lines in the selected installed product
    var installedProductLineCodeIdentifiers = product.LinePatterns*.CodeIdentifier
    for (productLine in _import.APDProductLine) {
      if (!installedProductLineCodeIdentifiers.contains(productLine.CodeIdentifier)) {
        throw new DisplayableException(DisplayKey.get("Web.APD.BuildInstalledEditionsFailureForProductLine", productLine.Name))
      }
    }
  }
}