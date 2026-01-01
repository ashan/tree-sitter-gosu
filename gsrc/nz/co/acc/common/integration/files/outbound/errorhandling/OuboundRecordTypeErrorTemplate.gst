<%@ params( outboundHeader: OutBoundHeader_ACC,outboundRecord: OutBoundRecord_ACC, errorMessage: String) %>
A outbound record has failed.
The details are:
Record Status = ${outboundRecord.Status}
Record Type  = ${outboundRecord.Type.DisplayName}
Record ID = ${outboundRecord.PublicID}
<% if (outboundHeader!=null) { %>
Batch Date = ${outboundHeader.CreateTime.format("dd/MM/yyyy HH:mm:ss")}
<% } %>
<% if (errorMessage != null) { %>
Error Message = ${errorMessage}
<% } %>