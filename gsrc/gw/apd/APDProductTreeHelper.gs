package gw.apd

uses gw.api.tree.RowTreeRootNode
uses gw.api.tree.TreeNode
uses gw.xml.XMLNode

@Export
class APDProductTreeHelper {
  private static final var DEFAULT_EXPANDCOLLAPSE_DEPTH = 0
  private var currentProduct : APDProduct
  private var currentProductTree : RowTreeRootNode

  function createProductTree(product : APDProduct, refreshOnUpdate : Boolean) : RowTreeRootNode {
    if (product != null && (product != currentProduct || refreshOnUpdate)) {
      currentProduct = product
      final var root = new ArrayList()
      root.add(product.buildTreeForVisualization())
      currentProductTree = new RowTreeRootNode(root, (\node -> (node as XMLNode).Children), DEFAULT_EXPANDCOLLAPSE_DEPTH)
    }
    return currentProductTree
  }

  function expandAll(productTree : RowTreeRootNode) {
    toggleRecursively(productTree, true)
  }

  function collapseAll(productTree : RowTreeRootNode) {
    toggleRecursively(productTree, false)
  }

  private static function toggleRecursively(node : TreeNode, expand : boolean) {
    if (node.Expanded != expand && !node.isLeaf()) {
      node.toggle()
    }
    node.Children.each(\c -> toggleRecursively(c, expand))
  }
}