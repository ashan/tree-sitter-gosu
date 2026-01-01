package gw.apd

uses gw.api.locale.DisplayKey
uses gw.api.productmodel.PolicyLinePattern
uses gw.api.productmodel.Product
uses gw.api.tree.RowTreeRootNode
uses gw.xml.XMLNode

@Export
class APDInstalledEditionTreeHelper {
  private static final var DEFAULT_EXPANDCOLLAPSE_DEPTH = 0
  private static final var INSTALLED_EDITION_TREE_TYPE = "installedEditionTree"
  private static final var INSTALLED_RULE_TREE_TYPE = "installedRuleTree"
  private var currentProductPreloaded : Product
  private var currentProductActivated : Product
  private var currentInstalledEditionTreePreloaded : RowTreeRootNode
  private var currentInstalledRuleTreePreloaded : RowTreeRootNode
  private var currentInstalledEditionTreeActivated : RowTreeRootNode
  private var currentInstalledRuleTreeActivated : RowTreeRootNode

  property get InstalledEditionTreePreloaded() : RowTreeRootNode {
    return currentInstalledEditionTreePreloaded
  }

  property get InstalledRuleTreePreloaded() : RowTreeRootNode {
    return currentInstalledRuleTreePreloaded
  }

  property get InstalledEditionTreeActivated() : RowTreeRootNode {
    return currentInstalledEditionTreeActivated
  }

  property get InstalledRuleTreeActivated() : RowTreeRootNode {
    return currentInstalledRuleTreeActivated
  }

  property get InstalledRuleTreePreloadedContainsInvalidRules() : Boolean {
    for (lineNode in currentInstalledRuleTreePreloaded.Children) {
      if (lineNode.Children.HasElements) {
        return true
      }
    }
    return false
  }

  property get InstalledRuleTreeActivatedContainsInvalidRules() : Boolean {
    for (lineNode in currentInstalledRuleTreeActivated.Children) {
      if (lineNode.Children.HasElements) {
        return true
      }
    }
    return false
  }

  public function createPreloadedInstalledEditionAndInstalledRuleTree(product : Product, refresh : Boolean) : void {
    if (product != null && (currentProductPreloaded != product || refresh)) {
      currentProductPreloaded = product
      var editionTreeRoot = buildProductLevelTree(product, EditionStatus.TC_PRELOADED, INSTALLED_EDITION_TREE_TYPE)
      var ruleTreeRoot = buildProductLevelTree(product, EditionStatus.TC_PRELOADED, INSTALLED_RULE_TREE_TYPE)
      currentInstalledEditionTreePreloaded = new RowTreeRootNode(editionTreeRoot, (\node -> (node as XMLNode).Children), DEFAULT_EXPANDCOLLAPSE_DEPTH)
      currentInstalledRuleTreePreloaded = new RowTreeRootNode(ruleTreeRoot, (\node -> (node as XMLNode).Children), DEFAULT_EXPANDCOLLAPSE_DEPTH)
    }
  }

  public function createActivatedInstalledEditionAndInstalledRuleTree(product : Product, refresh : Boolean) : void {
    if (product != null && (currentProductActivated != product || refresh)) {
      currentProductActivated = product
      var editionTreeRoot = buildProductLevelTree(product, EditionStatus.TC_ACTIVE, INSTALLED_EDITION_TREE_TYPE)
      var ruleTreeRoot = buildProductLevelTree(product, EditionStatus.TC_ACTIVE, INSTALLED_RULE_TREE_TYPE)
      currentInstalledEditionTreeActivated = new RowTreeRootNode(editionTreeRoot, (\node -> (node as XMLNode).Children), DEFAULT_EXPANDCOLLAPSE_DEPTH)
      currentInstalledRuleTreeActivated = new RowTreeRootNode(ruleTreeRoot, (\node -> (node as XMLNode).Children), DEFAULT_EXPANDCOLLAPSE_DEPTH)
    }
  }

  private function buildProductLevelTree(product : Product, editionStatus : EditionStatus, treeType : String) : ArrayList<XMLNode> {
    final var treeRoot = new ArrayList<XMLNode>()
    for (linePattern in product.LinePatterns) {
      var lineLevelTree = buildLineLevelTree(linePattern, editionStatus, treeType)
      if (lineLevelTree != null) {
        treeRoot.add(lineLevelTree)
      }
    }
    return treeRoot
  }
  

  private function buildLineLevelTree(linePattern : PolicyLinePattern, editionStatus : EditionStatus, treeType : String) : XMLNode {
    var tree = new XMLNode() {
      :ElementName = "ProductLine"
    }

    tree.setAttributeValue("Name", linePattern.Name)

    var installedEditions = gw.apd.model.InstalledEditionHelper.getInstalledEditionsFromLine(linePattern.CodeIdentifier, editionStatus)

    for (installedEdition in installedEditions) {
      switch (treeType) {
        case INSTALLED_EDITION_TREE_TYPE:
          tree.addChild(buildEditionLevelTree(installedEdition))
          break
        case INSTALLED_RULE_TREE_TYPE:
          for (installedRule in installedEdition.Rules.where(\r -> not r.Valid)) {
            tree.addChild(buildRuleLevelTree(installedRule, installedEdition.EditionCode))
          }
          break 
      }
    }

    return tree.Children.HasElements ? tree : null
  }

  private function buildEditionLevelTree(installedEdition : InstalledEdition) : XMLNode {
    var tree = new XMLNode() {
      :ElementName = "InstalledEdition"
    }

    setInstalledEditionTreeAttributes(installedEdition, tree)

    return tree
  }

  private function buildRuleLevelTree(installedRule : InstalledRule, editionCode : String) : XMLNode {
    var tree = new XMLNode() {
      :ElementName = "InstalledRule"
    }

    setInstalledRuleTreeAttributes(installedRule, editionCode, tree)

    return tree
  }

  private function setInstalledEditionTreeAttributes(installedEdition : InstalledEdition, tree : XMLNode) {
    if (installedEdition.EditionCode == null) {
      tree.setAttributeValue("Name", DisplayKey.get("Web.APDProductManagementPage.InvalidRulesLV.EditionName.Base"))
      tree.setAttributeValue("EffectiveDate", "")
    } else {
      tree.setAttributeValue("Name", installedEdition.EditionCode)
      tree.setAttributeValue("EffectiveDate", installedEdition.EffectiveDate.format("MM/dd/yyyy"))
    }
    tree.setAttributeValue("Changes", installedEdition.Rules.Count as String)
  }

  private function setInstalledRuleTreeAttributes(installedRule : InstalledRule, editionCode : String, tree : XMLNode) {
    if (editionCode == null) {
      tree.setAttributeValue("Name", DisplayKey.get("Web.APDProductManagementPage.InvalidRulesLV.EditionName.Base"))
    } else {
      tree.setAttributeValue("Name", editionCode)
    }
    tree.setAttributeValue("Element", installedRule.CodeIdentifier)
    tree.setAttributeValue("RuleType", installedRule.Type.toString())
    tree.setAttributeValue("Issue", installedRule.Issues)
  }
}