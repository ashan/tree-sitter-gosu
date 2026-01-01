package gw.apd.model

uses gw.api.locale.DisplayKey
uses gw.xml.XMLNode

/**
 * Created by shathaway on 30/11/2017.
 */
enhancement APDClauseCategoryEnhancement: APDClauseCategory {

  function buildTree() : XMLNode {
    var tree = new XMLNode(){
      :ElementName = "ClauseCategory"
    }
    tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.ClauseCategoryNode"))
    tree.setAttributeValue("Name", this.Name)
    if (checkGenerationValidity(tree)) {
      tree.setAttributeValue("Valid", "true")
    } else {
      tree.setAttributeValue("Valid", "false")
    }
    return tree
  }

  function buildTreeForVisualization(coverable : APDCoverable) : XMLNode {
    // Returns a category tree node which will be a child of the coverable's tree node, and will include clauses
    // for that coverable only
    var tree = new XMLNode(){
      :ElementName = "ClauseCategory"
    }
    tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.ClauseCategoryNode"))
    tree.setAttributeValue("Name", this.Name)

    addClausesToTree(coverable.TopLevelCoverages, tree)
    addClausesToTree(coverable.TopLevelConditions, tree)
    addClausesToTree(coverable.TopLevelExclusions, tree)

    return tree
  }

  private function addClausesToTree(clauses : APDClause[], node : XMLNode) {
    clauses
        .where(\clause -> clause.ClauseCategory == this)
        .orderBy(\clause -> clause.Sequence)
        .each(\clause -> node.addChild(clause.buildTreeForVisualization()))
  }

  function checkGenerationValidity(cblNode : XMLNode) : Boolean {
    var valid = true
    var messages = new ArrayList<String>()

    // name must be defined
    if (this.Name == null) {
      messages.add(DisplayKey.get("Web.APDValidation.ClauseCategory.MissingName"))
    }
    if (this.CodeIdentifier == null) {
      messages.add(DisplayKey.get("Web.APDValidation.ClauseCategory.MissingCodeIdentifier"))
    } else if (not CodegenValidator.isValidName(this.CodeIdentifier)) {
      messages.add(DisplayKey.get("Web.APDValidation.ClauseCategory.InvalidCodeIdentifier"))
    }
    if (this.Description == null) {
      messages.add(DisplayKey.get("Web.APDValidation.ClauseCategory.MissingDescription"))
    }

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

    return valid
  }

  /**
   * Return a list of the clauses that this Category is used on.
   * @return list os APD Clauses
   */
  property get ClausesUsingThisCategory() : List< APDClause > {
    return this.Coverable.Clauses.where( \ c -> c.ClauseCategory == this).toList()
  }

  /**
   * Return a string listing the clauses that the category is used on. If it is not used on any then indicate that it
   * can be removed by the user.
   * @return String
   */
  property get UsedOnClausesText() : String {
    var sb = new StringBuffer()
    this.ClausesUsingThisCategory.eachWithIndex(\clause, index -> {
      if (index > 0) sb.append(", ")
      sb.append(clause.Name)
    })

    return sb.toString()
  }

  /**
   * Return whether the category is used on any clauses.
   * @return boolean
   */
  property get IsCategoryUsedOnClauses() : boolean {
    return this.ClausesUsingThisCategory.HasElements
  }

}
