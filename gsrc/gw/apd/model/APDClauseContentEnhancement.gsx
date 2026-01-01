package gw.apd.model

uses entity.APDClause
uses gw.api.locale.DisplayKey
uses gw.api.util.LocaleUtil
uses gw.xml.XMLNode

/**
 * Agile Product Developer
 */
@Export
enhancement APDClauseContentEnhancement : APDClause {

  function allowToggle() : Boolean {
    return true
  }

  function buildTree() : XMLNode {
    var tree = new XMLNode()
    tree.setAttributeValue("Name", this.Name)
    if (this typeis APDCoverage) {
      tree.ElementName = "Coverage"
      tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.CoverageNode"))
      this.CostDefinitions.each(\cost ->
        tree.addChild(cost.buildTree())
      )
    } else if (this typeis APDCondition) {
      tree.ElementName = "Condition"
      tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.ConditionNode"))
    } else if (this typeis APDExclusion) {
      tree.ElementName = "Exclusion"
      tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.ExclusionNode"))
    }

    if (checkGenerationValidity(tree)) {
      tree.setAttributeValue("Valid", "true")
    } else {
      tree.setAttributeValue("Valid", "false")
    }

    if (this.ClauseCycle.Empty) {
      this.SubClauses.each(\subClause -> tree.addChild(subClause.buildTree()))
    }

    if (tree.Children.hasMatch(\node -> node.getAttributeValue("Valid") == "false")) {
      tree.setAttributeValue("Valid", "false")
    }

    return tree
  }

  function buildTreeForVisualization() : XMLNode {
    var tree = new XMLNode()
    tree.setAttributeValue("Name", this.Name)
    if (this typeis APDCoverage) {
      tree.ElementName = "Coverage"
      tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.CoverageNode"))
    } else if (this typeis APDCondition) {
      tree.ElementName = "Condition"
      tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.ConditionNode"))
    } else if (this typeis APDExclusion) {
      tree.ElementName = "Exclusion"
      tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.ExclusionNode"))
    }

    this.Terms
        .orderBy(\term -> term.Sequence)
        .each(\term -> tree.addChild(term.buildTreeForVisualization()))

    if (this.ClauseCycle.Empty) {
      this.SubClauses
          .orderBy(\subclause -> subclause.Sequence)
          .each(\subclause -> tree.addChild(subclause.buildTreeForVisualization()))
    }

    return tree
  }

  function checkGenerationValidity(cblNode : XMLNode) : Boolean {
    var valid = true
    var messages = new ArrayList<String>()

    // typename must be defined
    var codeIdentifierLabel = DisplayKey.get("Web.APDCoverableCV.CodeIdentifier", this.Coverable.LinePrefix)
    if (this.CodeIdentifier == null) {
      messages.add(DisplayKey.get("Web.APDValidation.Clause.MissingCodeIdentifier", codeIdentifierLabel))
    } else if (not CodegenValidator.isValidName(this.CodeIdentifier)) {
      messages.add(DisplayKey.get("Web.APDValidation.Clause.InvalidCodeIdentifier", codeIdentifierLabel))
    }
    // must ensure default language exists for text that goes into display keys
    var lang = LocaleUtil.getDefaultLanguageType()
    if (this["Name_" + lang.Code] == null) {
      messages.add(DisplayKey.get("Web.APDValidation.Clause.MissingName"))
    }
    if (this["Description_" + lang.Code] == null) {
      messages.add(DisplayKey.get("Web.APDValidation.Clause.MissingDescription"))
    }

    // terms must have unique names
    var duplicateTermCodeIds = CodegenValidator.findDuplicates(this.Terms*.Name)
    for (duplicateTermCodeId in duplicateTermCodeIds) {
      messages.add(DisplayKey.get("Web.APDValidation.Attribute.UniqueTermNames", duplicateTermCodeId))
    }

    validateParentSubClauseRelationship(messages)

    // check code identifier uniqueness across the line between clause categories and clauses
    var productLine = this.Coverable.ProductLine
    var duplicateBetweenCategoryAndClauseCodeIds = CodegenValidator.findDuplicates(productLine.AllClauseCategories*.CodeIdentifier.concat(productLine.AllClauses*.CodeIdentifier))
    if (duplicateBetweenCategoryAndClauseCodeIds.hasMatch(\duplicateId -> duplicateId.equalsIgnoreCase(this.CodeIdentifier))) {
      messages.add(DisplayKey.get("Web.APDValidation.ClauseAndClauseCategory.Children.UniqueCodes", this.CodeIdentifier))
    }

    if (messages.Count > 0) {
      valid = false
      messages.each(\msg -> {
        var errorTree = new XMLNode()
        errorTree.ElementName = "ERROR"
        errorTree.setAttributeValue("Name", msg)
        cblNode.addChild(errorTree)
      })
    }

    this.Terms.each(\fld -> {
      if (not fld.checkGenerationValidity(cblNode)) {
        valid = false
      }
    })

    return valid
  }

  private function validateParentSubClauseRelationship(messages : ArrayList<String>) {
    if (this.ParentClause == null) {
      return
    }
    if (this.ClauseCategory != this.ParentClause.ClauseCategory) {
      messages.add(DisplayKey.get("Web.APDValidation.Clause.SubClause.DifferentClauseCategory"))
    }
    if (this.Coverable != this.ParentClause.Coverable) {
      messages.add(DisplayKey.get("Web.APDValidation.Clause.SubClause.DifferentCoverable"))
    }
    if (typeof this != typeof this.ParentClause) {
      messages.add(DisplayKey.get("Web.APDValidation.Clause.SubClause.DifferentClauseType"))
    }
    validateClauseHierarchyCycle(messages)
  }

  private function validateClauseHierarchyCycle(messages : List<String>) {
    var clausesInCycle = this.ClauseCycle
    if (clausesInCycle.HasElements) {
      messages.add(this.getCyclicalValidationMessage(clausesInCycle))
    }
  }

  property get UIDetailsLabel() : String {
    return (this.Name != null) ?
        this.Name + " " + DisplayKey.get("Web.APDRiskClauseInputSet.Clause.Details") : DisplayKey.get("Web.APDRiskClauseInputSet.Clause.Details")
  }
}
