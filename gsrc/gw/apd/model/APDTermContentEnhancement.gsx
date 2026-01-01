package gw.apd.model

uses gw.api.locale.DisplayKey
uses gw.xml.XMLNode

/**
 * Created by shathaway on 12/12/2017.
 */
@Export
enhancement APDTermContentEnhancement : APDTerm {

  function buildTreeForVisualization() : XMLNode {
    var tree = new XMLNode(){
      :ElementName = "Term"
    }
    var value = this.ScheduleItemAttribute ? DisplayKey.get("Web.APD.ProductTree.ScheduleTermNode") : DisplayKey.get("Web.APD.ProductTree.TermNode")
    tree.setAttributeValue("Type", value)
    tree.setAttributeValue("Name", this.Label)
    return tree
  }
}
