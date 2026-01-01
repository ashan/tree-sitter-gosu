package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class LineEntityGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, productLine : entity.APDProductLine) {
    _generators = {
        new APDProductLineBasedGenerator(context, productLine, Templates.LINE_ENTITY,
            ENTITY_DIR, "${productLine.QualifiedName}.eti")
    }
  }

}