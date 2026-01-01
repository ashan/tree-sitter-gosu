<%@ params(productLine:APDProductLine, lobPackageName:String) %>
      case "${(productLine.LinePrefix).toLowerCase()}":
        pkg = "${lobPackageName}"
        break
<% // needs new line line to ensure instert tag get onto its own line%>