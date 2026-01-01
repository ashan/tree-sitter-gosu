<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(productLine:APDProductLine) %>
<%
uses gw.apd.APDConstants
uses gw.apd.model.generate.APDGosuReferencesHelper

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}"
var extPackage = productLine.LOBPackageName
var lineHasSchedule = productLine.AllClauses.hasMatch(\clause -> clause.HasSchedule)
%>
package ${basePackage}

uses java.util.ArrayList
uses java.util.HashSet
uses java.util.Map
uses java.util.Set
uses java.math.BigDecimal
uses java.lang.Iterable

uses entity.windowed.${productLine.LinePrefix}CostVersionList
<%if(lineHasSchedule){%>
uses gw.api.domain.Schedule
<%}%>
uses gw.api.policy.AbstractPolicyLineMethodsImpl
uses gw.api.productmodel.CoveragePattern
uses gw.api.tree.RowTreeRootNode
uses gw.pl.persistence.core.Key
uses gw.rating.worksheet.treenode.WorksheetTreeNodeContainer
uses gw.rating.worksheet.treenode.WorksheetTreeNodeUtil
uses ${extPackage}.${APDConstants.FINANCIALS}.${productLine.LinePrefix}QuoteDisplayUtil

@Export
abstract class ${productLine.LinePrefix}PolicyLineMethodsBase extends AbstractPolicyLineMethodsImpl {

  var _line : entity.${productLine.QualifiedName} as readonly Line

  construct(line : entity.${productLine.QualifiedName}) {
    super(line)
    _line = line
  }

  override property get CoveredStates() : Jurisdiction[] {
    // note that this method is a misnoma as it actually returns jurisdiction (which may not be states)
    var states = new HashSet<Jurisdiction>()
    if (_line.Branch.BaseState != null) {
      states.add(_line.Branch.BaseState)
    }<%for(var coverable in productLine.AllChildCoverables.where(\c -> c.RiskLocation != APDRiskLocationType.TC_USEPARENT).sort(TemplateComparators.CoverableOrdering)){%>
    for (cbl in _line.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(coverable)}) {
      states.add(gw.api.util.JurisdictionMappingUtil.getJurisdiction(cbl.${coverable.LocationField}))
    }<%} for(var exposure in productLine.AllExposures.where(\c -> c.RiskLocation != APDRiskLocationType.TC_USEPARENT).sort(TemplateComparators.ExposureOrdering)){%>
    for (exp in _line.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(exposure)}) {
      states.add(gw.api.util.JurisdictionMappingUtil.getJurisdiction(exp.${exposure.LocationField}))
    }<%}%>
    return states.toTypedArray()
  }

  override property get AllCoverables() : Coverable[] {
    var list = new ArrayList<Coverable>()
<%if(productLine.IsACoverable){%>
    list.add(_line)
<%}%>
<%for(var coverable in productLine.AllChildCoverables.where(\cc -> cc.IsACoverable).sort(TemplateComparators.CoverableOrdering)){%>
    list.addAll(_line.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(coverable)}.toList())
<%}%>
<%if(lineHasSchedule){%>
    list.addAll(AllSchedules*.ScheduledItems.whereTypeIs(Coverable).toList())
<%}%>
    return list.toTypedArray()
  }

  override property get AllCoverages() : Coverage[] {
    var list = new ArrayList<Coverage>()
    for (cb in AllCoverables) {
      list.addAll(cb.CoveragesFromCoverable.toList())
    }
    return list?.toTypedArray()
  }

  override property get AllExclusions() : Exclusion[] {
    var list = new ArrayList<Exclusion>()
    for (cb in AllCoverables) {
      list.addAll(cb.ExclusionsFromCoverable.toList())
    }
    return list.toTypedArray()
  }

  override property get AllConditions() : PolicyCondition[] {
    var list = new ArrayList<PolicyCondition>()
    for (cb in AllCoverables) {
      list.addAll(cb.ConditionsFromCoverable.toList())
    }
    return list.toTypedArray()
  }

  override property get AllModifiables() : Modifiable[] {
    var list = new ArrayList<Modifiable>()
<%if(productLine.HasModifiers){%>
    list.add(_line)
<%}%>
<%for(var coverable in productLine.AllChildCoverables.sort(TemplateComparators.CoverableOrdering)){%>
<%if(coverable.HasModifiers){%>
    list.addAll(_line.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(coverable)}.toList())
<%}%>
<%}%>
    return list.toTypedArray()
  }

<%if(lineHasSchedule){%>
  override property get AllSchedules() : Schedule[] {
    var list = new ArrayList<Schedule>()
<%if(productLine.IsACoverable){%>
    list.addAll(_line.CoveragesConditionsAndExclusionsFromCoverable.whereTypeIs(Schedule).toList())
<%}%>
<%for(var coverable in productLine.AllChildCoverables.where(\cc -> cc.IsACoverable).sort(TemplateComparators.CoverableOrdering)){%>
    list.addAll(_line.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(coverable)}*.CoveragesConditionsAndExclusionsFromCoverable.whereTypeIs(Schedule).toList())
<%}%>
    return list.toTypedArray()
  }

<%}%>
  /**
   * All costs across the term, in window mode.
   */
  override property get CostVLs() : Iterable<${productLine.LinePrefix}CostVersionList> {
    return _line.VersionList.${productLine.LinePrefix}Costs
  }

  override property get Transactions() : Set<Transaction> {
    var branch = _line.Branch
    return branch.getSlice(branch.PeriodStart).${productLine.LinePrefix}Transactions.toSet()
  }

  override property get SupportsRatingOverrides() : boolean {
    return false
  }

  override function getAllCostsForCoverage(covered : Coverable, coveragePattern : CoveragePattern) : List<Cost> {
    return _line.Branch.AllCosts.where(\cost -> {
      return cost typeis entity.${productLine.LinePrefix}Cost and
          cost.Coverage != null and
          cost.Coverage.Pattern == coveragePattern and
          cost.Coverage.OwningCoverable == covered
    })
  }

  override function initialize() {
    _line.initializeDefaultValuesAndSync()
<%if(productLine.Clauses.Count > 0) {%>
    _line.createCoveragesConditionsAndExclusions()
<%}%>
<%if(productLine.HasModifiers) {%>
    _line.syncModifiers()
<%}%>
<%for(var coverable in productLine.ChildCoverables.where(\cbl -> cbl.AutoNumber).sort(TemplateComparators.CoverableOrdering)){%>
    _line.initialize${productLine.LinePrefix}${coverable.TypeName}AutoNumberSequence()
<%}%>
<%for(var exposure in productLine.Exposures.where(\exp -> exp.IsAutoNumbered).sort(TemplateComparators.ExposureOrdering)){%>
    _line.${productLine.LinePrefix}${exposure.TypeName}AutoNumberSeq = new AutoNumberSequence(_line.Bundle)
<%}%>
  }

  override function resetAutoNumberSequences() {
<%for(var coverable in productLine.AllChildCoverables.sort(TemplateComparators.CoverableOrdering)){%>
<%if(coverable.AutoNumber) {%>
<%if(coverable.Parent == productLine) {%>
  _line.reset${coverable.LinePrefix+coverable.TypeName}AutoNumberSequences()
<%} else {%>
  _line.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(coverable.Parent)}*.reset${coverable.LinePrefix+coverable.TypeName}AutoNumberSequences()
<%}%>
<%}%>
<%}%>
<%for(var exposure in productLine.AllExposures.where(\exp -> exp.IsAutoNumbered).sort(TemplateComparators.ExposureOrdering)){%>
  _line.${productLine.LinePrefix}${exposure.TypeName}AutoNumberSeq.reset()
<%}%>
<%if(productLine.AllExposures.where(\exp -> exp.IsAutoNumbered).HasElements) {%>
  renumberAllExpAutoSequences()
<%}%>
  }

  override function cloneAutoNumberSequences() {
<%for(var coverable in productLine.AllChildCoverables.sort(TemplateComparators.CoverableOrdering)){%>
<%if(coverable.AutoNumber) {%>
<%if(coverable.Parent == productLine) {%>
    _line.clone${coverable.LinePrefix+coverable.TypeName}AutoNumberSequences(_line.Bundle)
<%} else {%>
    _line.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(coverable.Parent)}*.clone${coverable.LinePrefix+coverable.TypeName}AutoNumberSequences(_line.Bundle)
<%}%>
<%}%>
<%}%>
<%for(var exposure in productLine.AllExposures.where(\exp -> exp.IsAutoNumbered).sort(TemplateComparators.ExposureOrdering)){%>
    _line.${productLine.LinePrefix}${exposure.TypeName}AutoNumberSeq.clone(_line.Bundle)
<%}%>
  }

  override function bindAutoNumberSequences() {
<%for(var coverable in productLine.AllChildCoverables.sort(TemplateComparators.CoverableOrdering)){%>
<%if(coverable.AutoNumber) {%>
<%if(coverable.Parent == productLine) {%>
    _line.bind${coverable.LinePrefix+coverable.TypeName}AutoNumberSequences()
<%} else {%>
    _line.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(coverable.Parent)}*.bind${coverable.LinePrefix+coverable.TypeName}AutoNumberSequences()
<%}%>
<%}%>
<%}%>
<%if(productLine.AllExposures.where(\exp -> exp.IsAutoNumbered).HasElements) {%>
    renumberAllExpAutoSequences()
<%}%>
<%for(var exposure in productLine.AllExposures.where(\exp -> exp.IsAutoNumbered).sort(TemplateComparators.ExposureOrdering)){%>
    _line.${productLine.LinePrefix}${exposure.TypeName}AutoNumberSeq.bind(_line.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(exposure)}, ${productLine.LinePrefix}${exposure.TypeName}.Type.TypeInfo.getProperty("${productLine.LinePrefix}${exposure.TypeName}AutoNumberSeq"))
<%}%>
  }

  override function renumberAutoNumberSequences() {
<%for(var coverable in productLine.AllChildCoverables.sort(TemplateComparators.CoverableOrdering)){%>
<%if(coverable.AutoNumber) {%>
<%if(coverable.Parent == productLine) {%>
    _line.renumber${coverable.LinePrefix+coverable.TypeName}AutoNumberSequences()
<%} else {%>
    _line.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(coverable.Parent)}*.renumber${coverable.LinePrefix+coverable.TypeName}AutoNumberSequences()
<%}%>
<%}%>
<%}%>
<%for(var exposure in productLine.AllExposures.where(\exp -> exp.IsAutoNumbered).sort(TemplateComparators.ExposureOrdering)){%>
    _line.${productLine.LinePrefix}${exposure.TypeName}AutoNumberSeq.renumberNewBeans(_line.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(exposure)}, ${productLine.LinePrefix}${exposure.TypeName}.Type.TypeInfo.getProperty("${productLine.LinePrefix}${exposure.TypeName}AutoNumberSeq"))
<%}%>
  }

<%if(productLine.AllExposures.where(\exp -> exp.IsAutoNumbered).HasElements) {%>
  private function renumberAllExpAutoSequences() {
<%for(var exposure in productLine.AllExposures.where(\exp -> exp.IsAutoNumbered).sort(TemplateComparators.ExposureOrdering)){%>
    _line.${productLine.LinePrefix}${exposure.TypeName}AutoNumberSeq.renumber(_line.${APDGosuReferencesHelper.getEfficientArrayReferenceFromLine(exposure)}, ${productLine.LinePrefix}${exposure.TypeName}.Type.TypeInfo.getProperty("${productLine.LinePrefix}${exposure.TypeName}AutoNumberSeq"))
<%}%>
  }

<%}%>
  override function getWorksheetRootNode(showConditionals : boolean) : RowTreeRootNode {
    var treeNodes : List<WorksheetTreeNodeContainer> = {}
    var util = new ${productLine.LinePrefix}QuoteDisplayUtil(_line, true)
    var cblsByType = util.getCoverablesWithCostsByType()
    var costsByCbl = util.getCostsByCoverable()
    var lineLevelCosts = costsByCbl.get(_line)

<%// TODO: Rewite to support actual cost definition in model %>
    // All but the line-level costs
    for (ctype in cblsByType.Keys.where(\t -> t != typeof(_line))) {
      var ctypeContainer = new WorksheetTreeNodeContainer(ctype.toString())
      ctypeContainer.ExpandByDefault = true
      treeNodes.add(ctypeContainer)
      for (cbl in cblsByType.get(ctype)) {
        var cblContainer = new WorksheetTreeNodeContainer(${productLine.LinePrefix}QuoteDisplayUtil.CoverableDisplayName(cbl))
        cblContainer.ExpandByDefault = true
        ctypeContainer.addChild(cblContainer)
        for (c in costsByCbl.get(cbl)) {
          var costContainer = new WorksheetTreeNodeContainer(${productLine.LinePrefix}QuoteDisplayUtil.CostDisplayName(c))
          cblContainer.addChild(costContainer)
          costContainer.addChildren(WorksheetTreeNodeUtil.buildTreeNodes(c, showConditionals))
        }
      }
    }

    // Line-level costs
    var lineContainer = new WorksheetTreeNodeContainer("Line-level")
    lineContainer.ExpandByDefault = true
    treeNodes.add(lineContainer)
    for (c in lineLevelCosts) {
      var costContainer = new WorksheetTreeNodeContainer(${productLine.LinePrefix}QuoteDisplayUtil.CostDisplayName(c))
      lineContainer.addChild(costContainer)
      costContainer.addChildren(WorksheetTreeNodeUtil.buildTreeNodes(c, showConditionals))
    }

    return WorksheetTreeNodeUtil.buildRootNode(treeNodes)
  }

  /***
   * This function decides whether to allow a location to be removed in the UI.
   * This default implementation is provided simply as a reminder that you are likely to want to override default behavior here, too.
   */
  override function canSafelyDeleteLocation(location : PolicyLocation) : String {
    var notSafeReason = super.canSafelyDeleteLocation(location)

    if (notSafeReason.equalsIgnoreCase("")) {
      // Put line-specific reasons why a location cannot safely be deleted here.
    }

    return notSafeReason
  }

  override function doGetTIVForCoverage(cov : Coverage) : BigDecimal {
    switch (cov.FixedId.Type) {
      // Enter case statements for each type of coverage here
    }
    return BigDecimal.ZERO
  }

  override property get BaseStateRequired() : boolean {
    // override the default based on the definition if this is always required
    return ${productLine.BaseStateRequired}
  }

  override property get UnusedLocationCleanupEnabled() : boolean {
    return false
  }

  override property get LocationsInUseOnOrAfterSliceDate() : Set<Key> {
    var policyLocationsInUseNowOrInFuture = new HashSet<Key>()
<% if (productLine.Fields.hasMatch(\f -> f.Type == APDFieldType.TC_LOCATION)) for (fld in productLine.Fields.where(\f -> f.Type == APDFieldType.TC_LOCATION).sort(TemplateComparators.AttributeOrdering)){%>
    policyLocationsInUseNowOrInFuture.addAll(_line.VersionList.AllVersions
        .where(\loc -> loc.ExpirationDate > _line.SliceDate and loc.${fld.Name} != null)*.${fld.Name}*.FixedId.toList())
<%} var locationParents = new ArrayList<APDCoverable>()
   locationParents.addAll(productLine.AllChildCoverables.where(\cbl -> cbl.Fields.hasMatch(\f -> f.Type == APDFieldType.TC_LOCATION)).toList())
   locationParents.sort(TemplateComparators.CoverableOrdering)
   for (cbl in locationParents) for (fld in cbl.Fields.where(\f -> f.Type == APDFieldType.TC_LOCATION).sort(TemplateComparators.AttributeOrdering)){%>
    policyLocationsInUseNowOrInFuture.addAll(_line.VersionList.${APDGosuReferencesHelper.getSimpleReferenceFromLine(cbl)}
        .toList().collapse(entity.windowed.${cbl.QualifiedName}VersionList)
        .allVersionsFlat<entity.${cbl.QualifiedName}>()
        .where(\loc -> loc.ExpirationDate > _line.SliceDate and loc.${fld.Name} != null)*.${fld.Name}*.FixedId.toList())
<%} var locationExposures = new ArrayList<APDExposure>()
   locationExposures.addAll(productLine.AllExposures.where(\exp -> exp.Fields.hasMatch(\f -> f.Type == APDFieldType.TC_LOCATION)).toList())
   locationExposures.sort(TemplateComparators.ExposureOrdering)
   for (exp in locationExposures) for (fld in exp.Fields.where(\f -> f.Type == APDFieldType.TC_LOCATION).sort(TemplateComparators.AttributeOrdering)){%>
    policyLocationsInUseNowOrInFuture.addAll(_line.VersionList.${APDGosuReferencesHelper.getSimpleReferenceFromLine(exp)}
        .toList().collapse(entity.windowed.${exp.QualifiedName}VersionList)
        .allVersionsFlat<entity.${exp.QualifiedName}>()
        .where(\loc -> loc.ExpirationDate > _line.SliceDate and loc.${fld.Name} != null)*.${fld.Name}*.FixedId.toList())
<%}%>
    return policyLocationsInUseNowOrInFuture.union({_line.Branch.PrimaryLocation.FixedId})
  }

  override function usesAllOOSSliceDates() : boolean {
<%if (productLine.ContainsSplittableAttribute) {%>
    return false
<%} else {%>
    return true
<%}%>
  }

  override property get APDLine() : boolean {
    return true
  }

}