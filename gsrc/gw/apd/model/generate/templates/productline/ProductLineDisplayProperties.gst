<%
uses gw.apd.model.generate.templates.TemplateComparators
uses gw.api.locale.DisplayKey
%>
<%@ params(productLine: APDProductLine, lang : LanguageType) %>
<%if(productLine["Name_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.Name = ${productLine["Name_" + lang.Code]}
<%}%>
<%if(productLine["Description_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.Description = ${productLine["Description_" + lang.Code]}
<%}%>
<%for (category in productLine.AllClauseCategories.sort(TemplateComparators.ClauseCategoryOrdering)) {%>
<%if(category["Name_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.CoverageCategory_${productLine.LinePrefix}${category.CodeIdentifier}.Name = ${category["Name_" + lang.Code]}
<%}%>
<%if(category["Description_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.CoverageCategory_${productLine.LinePrefix}${category.CodeIdentifier}.Description = ${category["Description_" + lang.Code]}
<%}%>
<%}%>
<%for (coverage in productLine.AllCoverages.sort(TemplateComparators.ClauseOrdering)) { %>
<%if(coverage["Name_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}.Name = ${coverage["Name_" + lang.Code]}
<%}%>
<%if(coverage["Description_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}.Description = ${coverage["Description_" + lang.Code]}
<%}%>
<%for (term in coverage.StandardTerms.sort(TemplateComparators.AttributeOrdering)) { %>
<%if(term["Label_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${coverage.CodeIdentifier}${term.Name}.Name = ${term["Label_" + lang.Code]}
<%}%>
<%if(term["Description_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${coverage.CodeIdentifier}${term.Name}.Description = ${term["Description_" + lang.Code]}
<%}%>
<%if (term.Type == APDFieldType.TC_TYPEKEY and term.DropDownType != APDDropDownType.TC_TYPELIST) {%>
<%for (code in term.Codes) for (ccy in code.Currencies.sort(TemplateComparators.TypekeyOrdering)) {%>
<%if (term.DropDownType == APDDropDownType.TC_OPTION) {%>
<%if(code["Name_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${coverage.CodeIdentifier}${term.Name}.CovTermOpt_${productLine.LinePrefix}${coverage.CodeIdentifier}${term.Name}${code.Code}${ccy.Code?:""}.Description = ${code["Name_" + lang.Code]}
<%}%>
<%} else { //package%>
<%if(code["Name_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${coverage.CodeIdentifier}${term.Name}.CovTermPack_${productLine.LinePrefix}${coverage.CodeIdentifier}${term.Name}${code.Code}${ccy.Code?:""}.Description = ${code["Name_" + lang.Code]}
<%}%>
<%for (val in code.Values.sort(TemplateComparators.DropdownValueOrdering) index i) {%>
<%if(val.DropdownColumn["Name_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${coverage.CodeIdentifier}${term.Name}.CovTermPack_${productLine.LinePrefix}${coverage.CodeIdentifier}${term.Name}${code.Code}${ccy.Code?:""}.PackageTerm_${productLine.LinePrefix}${coverage.CodeIdentifier}${term.Name}${code.Code}${ccy.Code?:""}${i}.Name = ${val.DropdownColumn["Name_" + lang.Code]}
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%if (coverage.ScheduleItemProperties.HasElements or coverage.ScheduleLinkedClauseTerms.HasElements) { // Generate display keys for scheduled item properties %>
<%for (field in coverage.ScheduleItemProperties.sort(TemplateComparators.AttributeOrdering)) {%>
<%if (field["Label_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}.ClauseSchedulePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}Schedule.ScheduledItemPropertyPattern_${productLine.LinePrefix}${coverage.CodeIdentifier}${field.Name}.Name = ${field["Label_" + lang.Code]}
PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}.ClauseSchedulePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}Schedule.ScheduledItemPropertyPattern_${productLine.LinePrefix}${coverage.CodeIdentifier}${field.Name}.Description = ${field["Description_" + lang.Code]?:field["Label_" + lang.Code]}
<%}%>
<%}%>
<%if (coverage.ScheduleLinkedClauseTerms.HasElements) {%>
<%if (coverage["Name_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov.Name = ${DisplayKey.get("Web.APD.Codegen.LinkedClause.Name", coverage["Name_" + lang.Code])}
PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov.Description = ${DisplayKey.get("Web.APD.Codegen.LinkedClause.Description", coverage["Description_" + lang.Code]?:coverage["Name_" + lang.Code])}
<%}%>
<%for (term in coverage.ScheduleLinkedClauseTerms.sort(TemplateComparators.AttributeOrdering)) { %>
<%if (term["Label_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov.CovTerm_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov${term.Name}.Name = ${term["Label_" + lang.Code]}
PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov.CovTerm_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov${term.Name}.Description = ${term["Description_" + lang.Code]?:term["Label_" + lang.Code]}
<%}%>
<%if (term.Type == APDFieldType.TC_TYPEKEY and term.DropDownType != APDDropDownType.TC_TYPELIST) {%>
<%for (code in term.Codes) for (ccy in code.Currencies.sort(TemplateComparators.TypekeyOrdering)){%>
<%if (term.DropDownType == APDDropDownType.TC_OPTION) {%>
<%if (code["Name_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov.CovTerm_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov${term.Name}.CovTermOpt_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov${term.Name}${code.Code}${ccy.Code?:""}.Description = ${code["Name_" + lang.Code]}
<%}%>
<%} else { //package%>
<%if (code["Name_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov.CovTerm_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov${term.Name}.CovTermPack_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov${term.Name}${code.Code}${ccy.Code?:""}.Description = ${code["Name_" + lang.Code]}
<%}%>
<%for (val in code.Values.sort(TemplateComparators.DropdownValueOrdering) index i) {%>
<%if (val.DropdownColumn["Name_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.CoveragePattern_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov.CovTerm_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov${term.Name}.CovTermPack_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov${term.Name}${code.Code}${ccy.Code?:""}.PackageTerm_${productLine.LinePrefix}${coverage.CodeIdentifier}ItemCov${term.Name}${code.Code}${ccy.Code?:""}${i}.Name = ${val.DropdownColumn["Name_" + lang.Code]}
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%for (condition in productLine.AllConditions.sort(TemplateComparators.ClauseOrdering)) { %>
<%if(condition["Name_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}.Name = ${condition["Name_" + lang.Code]}
<%}%>
<%if(condition["Description_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}.Description = ${condition["Description_" + lang.Code]}
<%}%>
<%for (term in condition.Terms.sort(TemplateComparators.AttributeOrdering)) { %>
<%if(term["Label_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${condition.CodeIdentifier}${term.Name}.Name = ${term["Label_" + lang.Code]}
<%}%>
<%if(term["Description_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${condition.CodeIdentifier}${term.Name}.Description = ${term["Description_" + lang.Code]}
<%}%>
<%if (term.Type == APDFieldType.TC_TYPEKEY and term.DropDownType != APDDropDownType.TC_TYPELIST) {%>
<%for (code in term.Codes) for (ccy in code.Currencies.sort(TemplateComparators.TypekeyOrdering)) {%>
<%if (term.DropDownType == APDDropDownType.TC_OPTION) {%>
<%if(code["Name_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${condition.CodeIdentifier}${term.Name}.CovTermOpt_${productLine.LinePrefix}${condition.CodeIdentifier}${term.Name}${code.Code}${ccy.Code?:""}.Description = ${code["Name_" + lang.Code]}
<%}%>
<%} else { //package%>
<%if(code["Name_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${condition.CodeIdentifier}${term.Name}.CovTermPack_${productLine.LinePrefix}${condition.CodeIdentifier}${term.Name}${code.Code}${ccy.Code?:""}.Description = ${code["Name_" + lang.Code]}
<%}%>
<%for (val in code.Values.sort(TemplateComparators.DropdownValueOrdering) index i) {%>
<%if(val.DropdownColumn["Name_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${condition.CodeIdentifier}${term.Name}.CovTermPack_${productLine.LinePrefix}${condition.CodeIdentifier}${term.Name}${code.Code}${ccy.Code?:""}.PackageTerm_${productLine.LinePrefix}${condition.CodeIdentifier}${term.Name}${code.Code}${ccy.Code?:""}${i}.Name = ${val.DropdownColumn["Name_" + lang.Code]}
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%if (condition.ScheduleItemProperties.HasElements or condition.ScheduleLinkedClauseTerms.HasElements) { // Generate display keys for scheduled item properties %>
<%for (field in condition.ScheduleItemProperties.sort(TemplateComparators.AttributeOrdering)) {%>
<%if (field["Label_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}.ClauseSchedulePattern_${productLine.LinePrefix}${condition.CodeIdentifier}Schedule.ScheduledItemPropertyPattern_${productLine.LinePrefix}${condition.CodeIdentifier}${field.Name}.Name = ${field["Label_" + lang.Code]}
PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}.ClauseSchedulePattern_${productLine.LinePrefix}${condition.CodeIdentifier}Schedule.ScheduledItemPropertyPattern_${productLine.LinePrefix}${condition.CodeIdentifier}${field.Name}.Description = ${field["Description_" + lang.Code]?:field["Label_" + lang.Code]}
<%}%>
<%}%>
<%if (condition.ScheduleLinkedClauseTerms.HasElements) {%>
<%if (condition["Name_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond.Name = ${DisplayKey.get("Web.APD.Codegen.LinkedClause.Name", condition["Name_" + lang.Code])}
PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond.Description = ${DisplayKey.get("Web.APD.Codegen.LinkedClause.Description", condition["Description_" + lang.Code]?:condition["Name_" + lang.Code])}
<%}%>
<%for (term in condition.ScheduleLinkedClauseTerms.sort(TemplateComparators.AttributeOrdering)) { %>
<%if (term["Label_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond.CovTerm_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond${term.Name}.Name = ${term["Label_" + lang.Code]}
PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond.CovTerm_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond${term.Name}.Description = ${term["Description_" + lang.Code]?:term["Label_" + lang.Code]}
<%}%>
<%if (term.Type == APDFieldType.TC_TYPEKEY and term.DropDownType != APDDropDownType.TC_TYPELIST) {%>
<%for (code in term.Codes) for (ccy in code.Currencies.sort(TemplateComparators.TypekeyOrdering)){%>
<%if (term.DropDownType == APDDropDownType.TC_OPTION) {%>
<%if (code["Name_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond.CovTerm_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond${term.Name}.CovTermOpt_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond${term.Name}${code.Code}${ccy.Code?:""}.Description = ${code["Name_" + lang.Code]}
<%}%>
<%} else { //package%>
<%if (code["Name_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond.CovTerm_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond${term.Name}.CovTermPack_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond${term.Name}${code.Code}${ccy.Code?:""}.Description = ${code["Name_" + lang.Code]}
<%}%>
<%for (val in code.Values.sort(TemplateComparators.DropdownValueOrdering) index i) {%>
<%if (val.DropdownColumn["Name_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.ConditionPattern_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond.CovTerm_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond${term.Name}.CovTermPack_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond${term.Name}${code.Code}${ccy.Code?:""}.PackageTerm_${productLine.LinePrefix}${condition.CodeIdentifier}ItemCond${term.Name}${code.Code}${ccy.Code?:""}${i}.Name = ${val.DropdownColumn["Name_" + lang.Code]}
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%for (exclusion in productLine.AllExclusions.sort(TemplateComparators.ClauseOrdering)) { %>
<%if(exclusion["Name_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}.Name = ${exclusion["Name_" + lang.Code]}
<%}%>
<%if(exclusion["Description_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}.Description = ${exclusion["Description_" + lang.Code]}
<%}%>
<%for (term in exclusion.Terms.sort(TemplateComparators.AttributeOrdering)) { %>
<%if(term["Label_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${exclusion.CodeIdentifier}${term.Name}.Name = ${term["Label_" + lang.Code]}
<%}%>
<%if(term["Description_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${exclusion.CodeIdentifier}${term.Name}.Description = ${term["Description_" + lang.Code]}
<%}%>
<%if (term.Type == APDFieldType.TC_TYPEKEY and term.DropDownType != APDDropDownType.TC_TYPELIST) {%>
<%for (code in term.Codes) for (ccy in code.Currencies.sort(TemplateComparators.TypekeyOrdering)) {%>
<%if (term.DropDownType == APDDropDownType.TC_OPTION) {%>
<%if(code["Name_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${exclusion.CodeIdentifier}${term.Name}.CovTermOpt_${productLine.LinePrefix}${exclusion.CodeIdentifier}${term.Name}${code.Code}${ccy.Code?:""}.Description = ${code["Name_" + lang.Code]}
<%}%>
<%} else { //package%>
<%if(code["Name_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${exclusion.CodeIdentifier}${term.Name}.CovTermPack_${productLine.LinePrefix}${exclusion.CodeIdentifier}${term.Name}${code.Code}${ccy.Code?:""}.Description = ${code["Name_" + lang.Code]}
<%}%>
<%for (val in code.Values.sort(TemplateComparators.DropdownValueOrdering) index i) {%>
<%if(term["Label_" + lang.Code] != null){%>PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}.CovTerm_${productLine.LinePrefix}${exclusion.CodeIdentifier}${term.Name}.CovTermPack_${productLine.LinePrefix}${exclusion.CodeIdentifier}${term.Name}${code.Code}${ccy.Code?:""}.PackageTerm_${productLine.LinePrefix}${exclusion.CodeIdentifier}${term.Name}${code.Code}${ccy.Code?:""}${i}.Name = ${val.DropdownColumn["Name_" + lang.Code]}
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%if (exclusion.ScheduleItemProperties.HasElements or exclusion.ScheduleLinkedClauseTerms.HasElements) { // Generate display keys for scheduled item properties %>
<%for (field in exclusion.ScheduleItemProperties.sort(TemplateComparators.AttributeOrdering)) {%>
<%if (field["Label_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}.ClauseSchedulePattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}Schedule.ScheduledItemPropertyPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}${field.Name}.Name = ${field["Label_" + lang.Code]}
PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}.ClauseSchedulePattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}Schedule.ScheduledItemPropertyPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}${field.Name}.Description = ${field["Description_" + lang.Code]?:field["Label_" + lang.Code]}
<%}%>
<%}%>
<%if (exclusion.ScheduleLinkedClauseTerms.HasElements) {%>
<%if (exclusion["Name_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl.Name = ${DisplayKey.get("Web.APD.Codegen.LinkedClause.Name", exclusion["Name_" + lang.Code])}
PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl.Description = ${DisplayKey.get("Web.APD.Codegen.LinkedClause.Description", exclusion["Description_" + lang.Code]?:exclusion["Name_" + lang.Code])}
<%}%>
<%for (term in exclusion.ScheduleLinkedClauseTerms.sort(TemplateComparators.AttributeOrdering)) { %>
<%if (term["Label_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl.CovTerm_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl${term.Name}.Name = ${term["Label_" + lang.Code]}
PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl.CovTerm_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl${term.Name}.Description = ${term["Description_" + lang.Code]?:term["Label_" + lang.Code]}
<%}%>
<%if (term.Type == APDFieldType.TC_TYPEKEY and term.DropDownType != APDDropDownType.TC_TYPELIST) {%>
<%for (code in term.Codes) for (ccy in code.Currencies.sort(TemplateComparators.TypekeyOrdering)){%>
<%if (term.DropDownType == APDDropDownType.TC_OPTION) {%>
<%if (code["Name_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl.CovTerm_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl${term.Name}.CovTermOpt_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl${term.Name}${code.Code}${ccy.Code?:""}.Description = ${code["Name_" + lang.Code]}
<%}%>
<%} else { //package%>
<%if (code["Name_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl.CovTerm_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl${term.Name}.CovTermPack_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl${term.Name}${code.Code}${ccy.Code?:""}.Description = ${code["Name_" + lang.Code]}
<%}%>
<%for (val in code.Values.sort(TemplateComparators.DropdownValueOrdering) index i) {%>
<%if (val.DropdownColumn["Name_" + lang.Code] != null) {%>
PolicyLine_${productLine.CodeIdentifier}.ExclusionPattern_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl.CovTerm_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl${term.Name}.CovTermPack_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl${term.Name}${code.Code}${ccy.Code?:""}.PackageTerm_${productLine.LinePrefix}${exclusion.CodeIdentifier}ItemExcl${term.Name}${code.Code}${ccy.Code?:""}${i}.Name = ${val.DropdownColumn["Name_" + lang.Code]}
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>
<%}%>