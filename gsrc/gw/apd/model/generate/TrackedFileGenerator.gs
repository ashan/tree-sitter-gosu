package gw.apd.model.generate

uses gw.apd.model.generate.templates.TemplateComparators
uses gw.apd.model.generate.xsd.clausemodel.CoveragePattern
uses gw.apd.model.generate.xsd.clausemodel.ExclusionPattern
uses gw.apd.model.generate.xsd.clausemodel.ConditionPattern

uses java.nio.file.Files
uses java.nio.file.LinkOption
uses java.nio.file.Path

@Export
abstract class TrackedFileGenerator extends Generator {

  private var _context : GenerationContext

  construct(context : GenerationContext) {
    super()
    _context = context
  }

  construct(context : GenerationContext, rootPath : Path) {
    super(rootPath)
    _context = context
  }

  property get Context() : GenerationContext {
    return _context
  }

  protected function addOrReplaceFile(file : Path, contents : block() : String, isProtected : boolean) {
    if (Context.IsCheckSumRun) {
      Context.FileTracker.trackFileChanges(file, isProtected)
    } else {
      super.addOrReplaceFile(file, contents())
    }
  }

  protected function addOrReplaceFile(file : Path, contents : block() : String) {
    addOrReplaceFile(file, contents, true)
  }

  protected function appendToFile(file : Path, contents : block() : String, isProtected : boolean) {
    if (Context.IsCheckSumRun) {
      Context.FileTracker.trackFileChanges(file, isProtected)
    } else {
      super.appendToFile(file, contents())
    }
  }

  protected function appendToFile(file : Path, contents : block() : String) {
    appendToFile(file, contents, true)
  }

  protected function insertContents(filePath : Path, contents : block() : String, beforeMatchingText : String, isProtected : boolean) {
    if (Context.IsCheckSumRun) {
      Context.FileTracker.trackFileChanges(filePath, isProtected)
    } else {
      super.insertContents(filePath, contents(), beforeMatchingText)
    }
  }

  protected function insertContents(filePath : Path, contents : block() : String, beforeMatchingText : String) {
    insertContents(filePath, contents, beforeMatchingText, true)
  }

  protected function insertContentsIfNoMatchFound(filePath : Path, contents : block() : String, beforeMatchingText : String, isProtected : boolean) {
    if (Context.IsCheckSumRun) {
      Context.FileTracker.trackFileChanges(filePath, isProtected)
    } else {
      super.insertContentsIfNoMatchFound(filePath, contents(), beforeMatchingText)
    }
  }

  protected function insertContentsIfNoMatchFound(filePath : Path, contents : block() : String, beforeMatchingText : String) {
    insertContentsIfNoMatchFound(filePath, contents, beforeMatchingText)
  }

  protected function removeLookupsForTerm(filePath : Path, lookupType : String, codeIdentifier : String, isProtected : boolean) {
    if (Context.IsCheckSumRun) {
      Context.FileTracker.trackFileChanges(filePath, isProtected)
    } else {
      super.removeLookupsForTerm(filePath, lookupType, codeIdentifier)
    }
  }

  protected function removeLookupsForTerm(filePath : Path, lookupType : String, codeIdentifier : String) {
    removeLookupsForTerm(filePath, lookupType, codeIdentifier, true)
  }

  protected function parseCoveragePattern(filePath : Path) : CoveragePattern {
    return CoveragePattern.parse(filePath)
  }

  protected function parseExclusionPattern(filePath : Path) : ExclusionPattern {
    return ExclusionPattern.parse(filePath)
  }

  protected function parseConditionPattern(filePath : Path) : ConditionPattern {
    return ConditionPattern.parse(filePath)
  }

  protected function fileExists(file : Path) : boolean {
    return Files.exists(file, new LinkOption[0])
  }

  protected function fileDoesNotExist(file : Path) : boolean {
    return Files.notExists(file, new LinkOption[0])
  }

  /**
   * Create new directory on the provided {@literal directoryPath} if it is not already exists.
   *
   * @param directoryPath {@link java.nio.file.Path} on which new directory will be created
   */
  protected override function createOrConfirmDirectory(directoryPath : Path) {
    if (not Context.IsCheckSumRun) {
      super.createOrConfirmDirectory(directoryPath)
    }
  }

  protected property get AllLanguages() : LanguageType[] {
    return gw.api.util.LocaleUtil.getAllLanguages()?.toTypedArray().sort(TemplateComparators.TypekeyOrdering)
  }

}