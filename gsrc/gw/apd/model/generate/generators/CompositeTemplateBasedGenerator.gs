package gw.apd.model.generate.generators

uses gw.apd.model.generate.Generator

@Export
abstract class CompositeTemplateBasedGenerator extends Generator {

  protected var _generators : List<AbstractTemplateBasedGenerator> as readonly Generators

  function generate() {
    foreach (var generator in Generators) {
      generator.generate()
    }
  }

}