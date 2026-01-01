package gw.apd.model.generate

uses gw.xml.XmlElement

uses java.nio.file.Files
uses java.nio.file.LinkOption
uses java.nio.file.Path

uses entity.APDCoverable

@Export
class ClauseEntityHelper {
  private var _src : XmlElement
  private var _cbl : APDCoverable
  private var _clauseType : Type<APDClause>
  private var _termMap : HashMap<String, Integer> as readonly TermsUsed

  construct(cbl : APDCoverable, t : Type<APDClause>, file : Path) {
    _cbl = cbl
    _clauseType = t
    if (Files.exists(file, new LinkOption[0])) _src = XmlElement.parse(file)
  }

  function initialise() {
    _termMap = new HashMap<String, Integer>() {
      "Boolean" -> Integer.max(_cbl.getStandardBooleanTermsUsed(_clauseType), getXMLTermCount("Boolean")),
      "Choice" -> Integer.max(_cbl.getStandardChoiceTermsUsed(_clauseType), getXMLTermCount("Choice")),
      "Date" -> Integer.max(_cbl.getStandardDateTermsUsed(_clauseType), getXMLTermCount("Date")),
      "Direct" -> Integer.max(_cbl.getStandardDirectTermsUsed(_clauseType), getXMLTermCount("Direct")),
      "String" -> Integer.max(_cbl.getStandardStringTermsUsed(_clauseType), getXMLTermCount("String"))
    }
  }
  property get CoverageTerms() : Boolean {
    return _clauseType == APDCoverage
  }

  /**
   * Returns the maximum suffix used for a type of term in the current source
   * @param termType as defined as the field prefix
   * @return the highest suffix used on existing tem fields of hte given type
   */
  private function getXMLTermCount(termType : String) : Integer {
    if (_src != null) {
      var columns = _src.$Children.where(\elem -> elem.$QName.LocalPart == "column" and elem.getAttributeValue("name").startsWith(termType) and not elem.getAttributeValue("name").endsWith("Avl"))
      if (columns.Count > 0) return columns.map(\elem -> elem.getAttributeValue("name").substring(termType.length+4).toInt()).max()
    }
    return 0
  }

}