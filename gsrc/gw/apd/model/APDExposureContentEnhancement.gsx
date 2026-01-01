package gw.apd.model

uses gw.api.locale.DisplayKey
uses gw.xml.XMLNode

/**
 * Agile Product Developer
 */
@Export
enhancement APDExposureContentEnhancement : APDExposure {

  //********************************** Config Generation *****************************************************************/

   function buildTree() : XMLNode {
    var tree = new XMLNode(){
      :ElementName = "Exposure"
    }
    tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.ExposureNode"))
    tree.setAttributeValue("Name", this.Name)
    if (checkGenerationValidity(tree)) {
      tree.setAttributeValue("Valid", "true")
    } else {
      tree.setAttributeValue("Valid", "false")
    }
    return tree
  }

  function buildTreeForVisualization() : XMLNode {
    var tree = new XMLNode(){
      :ElementName = "Exposure"
    }
    tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.ExposureNode"))
    tree.setAttributeValue("Name", this.Name)
    this.Fields.each(\expfld ->
        tree.addChild(expfld.buildTreeForVisualization())
    )
    return tree
  }

  function checkGenerationValidity(cblNode : XMLNode) : Boolean {
    var valid = true
    var messages = new ArrayList<String>()

    // typename must be defined
    if (this.TypeName == null) {
      messages.add(DisplayKey.get("Web.APDValidation.Exposure.MissingTypeName"))
    } else if (not CodegenValidator.isValidName(this.TypeName)) {
      messages.add(DisplayKey.get("Web.APDValidation.Exposure.InvalidTypeName"))
    }
    if (this.Description == null) {
      messages.add(DisplayKey.get("Web.APDValidation.Exposure.MissingDescription"))
    }
    if (this.MenuLabel == null) {
      messages.add(DisplayKey.get("Web.APDValidation.Exposure.MissingMenuLabel"))
    }
    if (this.ExposureType == APDExposureType.TC_CONTACT && this.ContactRole == null) {
      messages.add(DisplayKey.get("Web.APDValidation.Exposure.MissingContactRole"))
    }
    if (CodegenValidator.areDuplicates(this.TypeName, this.Coverable.TypeName)) {
      messages.add(DisplayKey.get("Web.APDValidation.Exposure.UniqueEntityName"))
    }
    var duplicateFieldNames = CodegenValidator.findDuplicates(this.Fields*.Name)
    for (duplicateFieldName in duplicateFieldNames) {
      messages.add(DisplayKey.get("Web.APDValidation.Exposure.Children.UniqueAPDExposureFieldNames", duplicateFieldName))
    }

    // check when RiskLocation has location refernece, there should only be one location exposure field set as Jurisdiction
    if (this.RiskLocation == APDRiskLocationType.TC_REFLOCATION) {
      if (this.Fields.countWhere(\field -> field.IsLocationAndJurisdiction) > 1) {
        messages.add(DisplayKey.get("Web.APDValidation.Exposure.MultipleJurisdictions"))
      }
    }

    // check typename uniqueness across the line between coverables and exposures
    var productLine = this.Coverable.ProductLine
    var duplicateCoverableAndExposureNames = CodegenValidator.findDuplicates(productLine.AllRiskObjects*.TypeName.concat(productLine.AllExposures*.TypeName))
    duplicateCoverableAndExposureNames.each(\duplicateCoverableAndExposureName -> {
      if (duplicateCoverableAndExposureName.equalsIgnoreCase(this.TypeName)) {
        messages.add(DisplayKey.get("Web.APDValidation.Coverable.Children.UniqueCoverableAndExposureEntityNames", this.TypeName))
      }
    })


    if (messages.Count > 0) {
      valid = false
      messages.each(\msg -> {
        var errorTree = new XMLNode()
        errorTree.ElementName = "ERROR"
        errorTree.setAttributeValue("Name", msg)
        cblNode.addChild(errorTree)
      })
    }

    this.Fields.each(\fld -> {
      if (not fld.checkGenerationValidity(cblNode)) {
        valid = false
      }
    })

    return valid
  }

  property get LocationField() : String {
    return this.Fields.firstWhere(\f -> f.Jurisdiction).Name
  }

  property get ReferenceToJurisdiction() : String {
    if (this.RiskLocation == APDRiskLocationType.TC_USEPARENT) return "." + this.Coverable.TypeName + this.Coverable.ReferenceToJurisdiction

    return "." + this.LocationField
  }
}
