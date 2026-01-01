package gw.apd.model

uses gw.api.locale.DisplayKey
uses gw.xml.XMLNode

/**
 * Agile Product Developer
 */
@Export
enhancement APDFieldContentEnhancement : APDField {

  function buildTreeForVisualization() : XMLNode {
    var tree = new XMLNode(){
      :ElementName = "Field"
    }
    tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.FieldNode"))
    tree.setAttributeValue("Name", this.Label)
    return tree
  }
}
