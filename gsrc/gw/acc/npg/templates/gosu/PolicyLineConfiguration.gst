<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>
      case "${productLine.AbbrevationLowerCase}":
        pkg = "${productLine.PackageName}"
        break
