package gw.apd.model

uses gw.api.locale.DisplayKey
uses gw.xml.XMLNode

/**
 * Agile Product Developer
 */
@Export
enhancement APDExposureFieldContentEnhancement : APDExposureField {

  function buildTreeForVisualization() : XMLNode {
    var tree = new XMLNode(){
      :ElementName = "ExposureField"
    }
    tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.ExposureFieldNode"))
    tree.setAttributeValue("Name", this.Label)
    return tree
  }
}
