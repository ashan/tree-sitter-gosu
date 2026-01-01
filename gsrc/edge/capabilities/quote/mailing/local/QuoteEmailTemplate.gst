<% uses edge.capabilities.quote.dto.QuoteDataDTO %>
<% uses edge.capabilities.quote.quoting.dto.QuoteDTO %>
<%@ params(qdd : QuoteDataDTO, sender : String, quoteUrl : String, contactNumber : String, chatURL : String) %>
<body>
<table width="800" bgcolor="#f7f7f7">
<tr>
<td style="padding: 0px 50px 0px 50px; font-family: Arial, sans-serif; font-size: 12px; color: #373737">
<b><i>Dear <%=qdd.DraftData.AccountHolder.DisplayName%></i></b><br>

<p>
Thank you for visiting <%=sender%>, and requesting a quote for <%=qdd.DraftData.ProductName%> insurance. The details of your quote are below. 
If at any time you want to go back and review your quote online, and get an updated quote, visit us at <%=quoteUrl+"?postalCode="+qdd.DraftData.PolicyAddress.PostalCode+"&quoteID="+qdd.QuoteID%> to continue quote #<%=qdd.QuoteID%>.
 To get any questions answered, you can contact us in the following ways:</p>

<ul>
    <li>Call us at <%=contactNumber%></li>
    <%if (chatURL != null) {%>
    <li>Use online chat at <%=chatURL%></li>
    <%}%>
    <li>Email us by replying to this email, or sending new email to <%=sender%>.</li>
</ul>

<%
  var quotes : QuoteDTO[] = qdd.QuoteData.OfferedQuotes
  if (quotes.Count >0) { 
%>

<p>
Your quote information is below.
</p>

<table align="center">
  <tr>
  <% for (quote in quotes) { %>
    <% if (quote.BranchName!= "CUSTOM") { %>
    <td style="padding: 0px 10px 0px 10px;font-family: Arial, sans-serif; font-size: 12px; color: #373737" bgcolor="#eeeeee">
    <h3><%=quote.BranchName%></h3>
    <div><b><%=quote.MonthlyPremium%></b> monthly</div>

    <div><b><%=quote.Total%></b> for <%=quote.TermMonths%> months</div>
    </td>
    <% } %>
  <% } %>
  </tr>
</table>
<br>
<div align="center">
<!--[if mso]>
  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="<%=quoteUrl%>" style="height:40px;v-text-anchor:middle;width:300px;" arcsize="10%" stroke="f" fillcolor="#93B84A">
    <w:anchorlock/>
    <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">
      Buy Policy
    </center>
  </v:roundrect>
  <![endif]-->
  <![if !mso]>
  <table cellspacing="0" cellpadding="0"> <tr> 
  <td align="center" width="300" height="40" bgcolor="#93B84A" style="-webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px; color: #ffffff; display: block;">
    <a href="<%=quoteUrl%>" style="color: #ffffff; font-size:16px; font-weight: bold; font-family:sans-serif; text-decoration: none; line-height:40px; width:100%; display:inline-block">
      Buy Policy
    </a>
  </td> 
  </tr> </table> 
  <![endif]>
</div>
<br>
<p align="center">The full range of coverage and payment options are available on the website.</p>
<br>

<% } %>
</tr>
</td>
</table>
</body>
