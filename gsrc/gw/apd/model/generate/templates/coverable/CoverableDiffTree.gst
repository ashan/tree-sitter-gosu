<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(cbl:APDCoverable) %>
      <RootEntity
          sortorder="1"
          type="entity.${cbl.QualifiedName}">
        <Properties
          includefromtype="entity.${cbl.QualifiedName}"
          parentpath="ENTITY"
          sortorder="1"/>
<%if (cbl.Coverages.Count > 0) {%>
        <Entity
          parentpath="ENTITY.${cbl.TypeName}"
          sortorder="2"
          type="entity.${cbl.QualifiedName}Cov">
          <Properties
            includefromtype="entity.${cbl.QualifiedName}Cov"
            parentpath="ENTITY"
            sortorder="1"/>
        </Entity>
<%if (cbl.Coverages.hasMatch(\cov -> cov.HasSchedule)) {%>
        <Entity
          parentpath="ENTITY.${cbl.TypeName}"
          sortorder="3"
          type="entity.${cbl.QualifiedName}ScheduleCov">
          <Entity
            parentpath="ENTITY.Schedule"
            type="entity.${cbl.QualifiedName}ScheduleCovItem">
<%if (cbl.Coverages.hasMatch(\cov -> cov.ScheduleLinkedClauseTerms.HasElements)) {%>
            <Properties
              includefromtype="entity.${cbl.QualifiedName}SchCovItemCov"
              parentpath="ENTITY.${cbl.QualifiedName}ScheduleCovItem">
            </Properties>
<%}%>
          </Entity>
        </Entity>
<%}%>
<%}%>
<%if (cbl.Exclusions.Count > 0) {%>
        <Entity
          parentpath="ENTITY.${cbl.TypeName}"
          sortorder="4"
          type="entity.${cbl.QualifiedName}Excl">
          <Properties
            includefromtype="entity.${cbl.QualifiedName}Excl"
            parentpath="ENTITY"
            sortorder="1"/>
        </Entity>
<%if (cbl.Exclusions.hasMatch(\cond -> cond.HasSchedule)) {%>
        <Entity
          parentpath="ENTITY.${cbl.TypeName}"
          sortorder="3"
          type="entity.${cbl.QualifiedName}ScheduleExcl">
          <Entity
            parentpath="ENTITY.Schedule"
            type="entity.${cbl.QualifiedName}ScheduleExclItem">
<%if (cbl.Exclusions.hasMatch(\cond -> cond.ScheduleLinkedClauseTerms.HasElements)) {%>
            <Properties
              includefromtype="entity.${cbl.QualifiedName}SchExclItemExcl"
              parentpath="ENTITY.${cbl.QualifiedName}ScheduleExclItem">
            </Properties>
<%}%>
          </Entity>
        </Entity>
<%}%>
<%}%>
<%if (cbl.Conditions.Count > 0) {%>
        <Entity
          parentpath="ENTITY.${cbl.TypeName}"
          sortorder="5"
          type="entity.${cbl.QualifiedName}Cond">
          <Properties
            includefromtype="entity.${cbl.QualifiedName}Cond"
            parentpath="ENTITY"
            sortorder="1"/>
        </Entity>
<%if (cbl.Conditions.hasMatch(\excl -> excl.HasSchedule)) {%>
        <Entity
          parentpath="ENTITY.${cbl.TypeName}"
          sortorder="3"
          type="entity.${cbl.QualifiedName}ScheduleCond">
          <Entity
            parentpath="ENTITY.Schedule"
            type="entity.${cbl.QualifiedName}ScheduleCondItem">
<%if (cbl.Conditions.hasMatch(\excl -> excl.ScheduleLinkedClauseTerms.HasElements)) {%>
            <Properties
              includefromtype="entity.${cbl.QualifiedName}SchCondItemCond"
              parentpath="ENTITY.${cbl.QualifiedName}ScheduleCondItem">
            </Properties>
<%}%>
          </Entity>
        </Entity>
<%}%>
<%}%>
<%for (exp in cbl.Exposures.sort(TemplateComparators.ExposureOrdering) index i) {%>
        <Entity
          label="entity.${exp.QualifiedName}.DisplayName"
          parentpath="ENTITY.${cbl.TypeName}"
          sortorder="${i+6}"
          type="entity.${exp.QualifiedName}">
          <Properties
            includefromtype="entity.${exp.QualifiedName}"
            parentpath="ENTITY"
            sortorder="1"/>
        </Entity>
<%}%>
      </RootEntity>