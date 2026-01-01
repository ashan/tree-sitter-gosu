package gw.apd.model

/**
 * Agile Product Developer
 */
@Export
enhancement APDProductLineContentEnhancement : APDProductLine {

  property get LookupLineStartTag() : String {
    return "<!--#GEN_TAG:" + this.LinePrefix + "#Start~(do not delete)-->"
  }

  property get LookupLineEndTag() : String {
    return "<!--#GEN_TAG:" + this.LinePrefix + "#End~(do not delete)-->"
  }
}
