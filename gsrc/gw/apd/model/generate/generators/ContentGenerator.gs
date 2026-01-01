package gw.apd.model.generate.generators

@Export
interface ContentGenerator {

  property get ShouldGenerateContent() : boolean

  function finalizeContent(content : String) : String

}