<%@ params( outboundHeader: OutBoundHeader_ACC,outboundRecord: OutBoundRecord_ACC, errorMessage: Throwable) %>
A disbursement record has failed to get sent to the bank.
The details are:
Record Status = ${outboundRecord.Status}
Record Type  = ${outboundRecord.Type.DisplayName}
Record ID = ${outboundRecord.PublicID}
Batch Date = ${outboundHeader.CreateTime.format("dd/MM/yyyy HH:mm:ss")}
<% if (errorMessage != null) { %>
Error Message = ${errorMessage.getMessage()}
<% } %>