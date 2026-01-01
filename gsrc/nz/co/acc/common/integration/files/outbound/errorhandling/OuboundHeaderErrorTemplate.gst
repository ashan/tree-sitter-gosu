<%@ params( outboundHeader: OutBoundHeader_ACC, errorMessage: String) %>
An outbound file has failed to be created.
The details are:
File Status = ${outboundHeader.Status}
File Type  = ${outboundHeader.BatchType}
Record ID = ${outboundHeader.PublicID}
Batch Date = ${outboundHeader.CreateTime.format("dd/MM/yyyy HH:mm:ss")}
<% if (errorMessage != null) { %>
Error Message = ${errorMessage}
<% } %>