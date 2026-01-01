package gw.apd.web

uses gw.api.util.DisplayableException

@Export
class APDClauseHierarchyUIHelper {

  static function unassignParent(clauses : APDClause[]) {
    var errors : List<String> = {}
    clauses?.each(\clause -> {
      try {
        clause?.unassignParent()
      } catch(ex : DisplayableException) {
        errors.add(ex.Message)
      }
    })
    if (errors.HasElements) {
      throw new DisplayableException(errors.join("\n\n"))
    }
  }

}