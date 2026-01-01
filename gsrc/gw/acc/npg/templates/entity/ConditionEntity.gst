<% uses gw.acc.npg.model.Condition %>
<%@ params( condition: Condition ) %>
<?xml version="1.0"?>
<entity
  xmlns="http://guidewire.com/datamodel"
  entity="${condition.EntityName}"
  type="effdated"
  desc="${condition.Description}"
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  final="false"
  platform="false"
  loadable="false"
  table="${condition.TableName}">
  <implementsEntity
    name="PolicyCondition"/>
  <implementsInterface
    iface="gw.api.domain.PolicyConditionAdapter"
    impl="${condition.LOBPackageName}.${condition.ConditionAdapterImplName}"/>
  <implementsInterface
    iface="gw.api.logicalmatch.EffDatedLogicalMatcher"
    impl="${condition.LOBPackageName}.${condition.ConditionMatcherImplName}"/>
${EntityColumn.renderToString(condition.FkFieldToCoverable)}
  <column
    name="BooleanTerm1"
    type="bit"
    desc="boolean cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="BooleanTerm1Avl"
    type="bit"
    desc="whether or not the BooleanTerm1 field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="BooleanTerm2"
    type="bit"
    desc="boolean cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="BooleanTerm2Avl"
    type="bit"
    desc="whether or not the BooleanTerm2 field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="BooleanTerm3"
    type="bit"
    desc="boolean cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="BooleanTerm3Avl"
    type="bit"
    desc="whether or not the BooleanTerm3 field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="ChoiceTerm1"
    type="patterncode"
    desc="choice cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="ChoiceTerm1Avl"
    type="bit"
    desc="whether or not the ChoiceTerm1 field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="ChoiceTerm2"
    type="patterncode"
    desc="choice cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="ChoiceTerm2Avl"
    type="bit"
    desc="whether or not the ChoiceTerm2 field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="ChoiceTerm3"
    type="patterncode"
    desc="choice cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="ChoiceTerm3Avl"
    type="bit"
    desc="whether or not the ChoiceTerm3 field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="ChoiceTerm4"
    type="patterncode"
    desc="choice cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="ChoiceTerm4Avl"
    type="bit"
    desc="whether or not the ChoiceTerm4 field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="ChoiceTerm5"
    type="patterncode"
    desc="choice cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="ChoiceTerm5Avl"
    type="bit"
    desc="whether or not the ChoiceTerm5 field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="DateTerm1"
    type="datetime"
    desc="datetime cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="DateTerm1Avl"
    type="bit"
    desc="whether or not the DateTerm1 field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="DateTerm2"
    type="datetime"
    desc="datetime cov term field"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="DateTerm2Avl"
    type="bit"
    desc="whether or not the DateTerm2 field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="DirectTerm1"
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
    name="DirectTerm1Avl"
    type="bit"
    desc="whether or not the DirectTerm1 field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="DirectTerm2"
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
    name="DirectTerm2Avl"
    type="bit"
    desc="whether or not the DirectTerm2 field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
  <column
    name="DirectTerm3"
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
    name="DirectTerm3Avl"
    type="bit"
    desc="whether or not the DirectTerm3 field was available the last time availability was checked"
    nullok="true"
    getterScriptability="doesNotExist"
    setterScriptability="doesNotExist"/>
</entity>
