<%@ params(line : APDProductLine) %>
  <FileDefinition
    ExternallyManaged="true"
    Name="${line.LinePrefix.toLowerCase()}costdef.xml"
    Priority="0">
    <Entity
      Type="${line.LinePrefix}CostDefinition"/>
  </FileDefinition>