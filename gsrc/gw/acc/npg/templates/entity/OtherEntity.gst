<%@ params(otherEntity:gw.acc.npg.model.OtherEntity) %>
<?xml version="1.0"?>
<entity
  xmlns="http://guidewire.com/datamodel"
  entity="${otherEntity.EntityName}"
  table="${otherEntity.TableName}"
  desc="${otherEntity.Description}"
  type="effdated"
  effDatedBranchType="PolicyPeriod"
  exportable="true"
  extendable="true"
  loadable="false"
  platform="false">
<%for(var field in otherEntity.Fields){%>
${EntityColumn.renderToString(field)}
<%}%>
</entity>
