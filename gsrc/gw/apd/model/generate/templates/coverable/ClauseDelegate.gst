<%
uses gw.apd.model.generate.ClauseEntityHelper
uses org.apache.commons.lang.StringEscapeUtils
%>
<%@ params(coverable:APDCoverable, helper:ClauseEntityHelper) %>
  <foreignkey
    desc="Owning Coverable: ${StringEscapeUtils.escapeXml(coverable.Name)}"
    fkentity="${coverable.LinePrefix}${coverable.TypeName}"
    name="${coverable.TypeName}"
    nullok="false"/>
<%if (helper.TermsUsed.get("Boolean") > 0)
    for (i in 1..helper.TermsUsed.get("Boolean")){%>
  <column
    name="BooleanTerm${i}"
    type="bit"
    desc="boolean cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="BooleanTerm${i}Avl"
    type="bit"
    desc="whether or not the BooleanTerm${i} field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
<%}%>
<%if (helper.TermsUsed.get("Choice") > 0)
    for (i in 1..helper.TermsUsed.get("Choice")){%>
  <column
    name="ChoiceTerm${i}"
    type="patterncode"
    desc="choice cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="ChoiceTerm${i}Avl"
    type="bit"
    desc="whether or not the ChoiceTerm${i} field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
<%}%>
<%if (helper.TermsUsed.get("Date") > 0)
    for (i in 1..helper.TermsUsed.get("Date")){%>
  <column
    name="DateTerm${i}"
    type="datetime"
    desc="datetime cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="DateTerm${i}Avl"
    type="bit"
    desc="whether or not the DateTerm${i} field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
<%}%>
<%if (helper.TermsUsed.get("Direct") > 0)
    for (i in 1..helper.TermsUsed.get("Direct")){%>
  <column
    name="DirectTerm${i}"
    type="decimal"
    desc="direct cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist">
    <columnParam
      name="scale"
      value="4"/>
    <columnParam
      name="precision"
      value="20"/>
  </column>
  <column
    name="DirectTerm${i}Avl"
    type="bit"
    desc="whether or not the DirectTerm${i} field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
<%}%>
<%if (helper.TermsUsed.get("String") > 0)
    for (i in 1..helper.TermsUsed.get("String")){%>
  <column
    desc="string cov term field"
    getterScriptability="doesNotExist"
    name="StringTerm${i}"
    nullok="true"
    setterScriptability="doesNotExist"
    type="shorttext"/>
  <column
    name="StringTerm${i}Avl"
    type="bit"
    desc="whether or not the StringTerm${i} field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
<%}%>
<%if (helper.CoverageTerms) {%>
   <array
     name="Costs"
     desc="Cost for the ${StringEscapeUtils.escapeXml(coverable.Name)} coverages"
     arrayentity="${coverable.LinePrefix}${coverable.TypeName}CovCost"
     cascadeDelete="true"/>
<%}%>