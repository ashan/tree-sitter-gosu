package gw.apd.model.generate

uses gw.api.locale.DisplayKey
uses gw.api.tree.RowTreeRootNode
uses gw.api.web.color.GWColor
uses gw.util.Pair
uses gw.xml.XMLNode

uses java.nio.charset.StandardCharsets
uses java.nio.file.CopyOption
uses java.nio.file.Files
uses java.nio.file.OpenOption
uses java.nio.file.StandardCopyOption

@Export
class ProductGeneratorHelper extends TrackedFileGenerator {
  var _product : APDProduct
  var _productLine : APDProductLine
  var _productTree : RowTreeRootNode as readonly ProductTree
  var _fileModificationWarning : String
  var _checkSumManager : CheckSumManager

  public static enum GenerationMode {
    ALL, BASE_CODE, EXTERNAL
  }

  construct(product : APDProduct, checkSumManager : CheckSumManager) {
    super(new GenerationContext())

    _product = product
    // Create a RowTreeRootNode that can serve as the basis for the UI widget for displaying the data
    // To support the UI, you need to provide a wrapper called a RowTreeRootNode.  It contains:
    // 1) A list of the top level items to display
    // 2) A block (mini-function) that describes how to get a node's children for the tree view
    // 3) How many levels of the tree should be opened when the tree is first displayed
    final var root = new ArrayList()
    root.add(_product.buildTree())
    _productTree = new RowTreeRootNode(root, (\node -> (node as XMLNode).Children), 5)
    _fileModificationWarning = ""
    _checkSumManager = checkSumManager
  }

  construct(productLine : APDProductLine) {
    super(new GenerationContext())

    _productLine = productLine
    final var root = new ArrayList()
    root.add(productLine.buildFullTree())
    _productTree = new RowTreeRootNode(root, (\node -> (node as XMLNode).Children), 5)
  }

  property get Title() : String {
    return _product.Name ?: _productLine.Name
  }

  property get IsValid() : Boolean {
    return (_productTree.Children.first().Data as gw.xml.XMLNode).getAttributeValue("Valid") == "true"
  }

  property get isProductTreeValid() : boolean {
    var rootNode = (ProductTree.Children.first().Data as gw.xml.XMLNode)
    return rootNode.getAttributeValue("Valid") == "true"
  }

  function generateConfiguration() {
    generateConfiguration(ALL)
  }

  function generateConfiguration(mode : GenerationMode) {
    Context.asGenerationRun()
    generate(mode)
  }

  function compareCheckSum(mode : GenerationMode) {
    Context.asCheckSumRun()
    generate(mode)
  }

  private function generate(mode : GenerationMode) {
    if (mode == ALL || mode == BASE_CODE) {
      // remove unwanted Display Properties
      removeOldReferences()

      // product
      new ProductGenerator(Context, _product).generateConfig()

      // for each line, add line
      _product.ProductLines*.ProductLine.each(\pl -> new ProductLineGenerator(Context, _product, pl).generateConfig())

      if (not Context.IsCheckSumRun) {
        _product.DateInstalled = Date.CurrentDate
      }
    }

    // For now, exclude the UI warning message support for external codegen
    if (not Context.IsCheckSumRun) {
      if (mode == ALL || mode == EXTERNAL) {
        new APDExternalCodeGenerator(_product).generateConfig()
      }
    }

    checkOrGenerateCheckSum()
  }

  private function checkOrGenerateCheckSum() {
    if (Context.IsCheckSumRun) {
      var changedFiles = _checkSumManager.getModifiedProtectedPaths(Context.FileTracker.ProtectedPaths)
      if (changedFiles.HasElements) {
        var formattedListOfFiles = changedFiles.sort().join(System.lineSeparator())
        _fileModificationWarning = DisplayKey.get("Web.APD.GeneratedProtectedFiles.ChangesDetected.WarningMessage", formattedListOfFiles)
      }
    } else {
      _checkSumManager.commitCheckSumSet(Context.FileTracker.AllPaths)
    }
  }

  function getValidityIcon(item : XMLNode) : Pair<String, GWColor> {
    //warning nodes display the 'warning' icon
    if (item.ElementName == "WARNING") {
      return new Pair("warning", GWColor.THEME_ALERT_WARNING)
    }

    //nodes that have been validated display 'completed' icon if validation passes, 'error' otherwise
    if (item.getAttributeValue("Valid") != null) {
      if (item.getAttributeValue("Valid") == "true") {
        return new Pair("completed", null)
      } else {
        return new Pair("error", GWColor.THEME_ALERT_ERROR)
      }
    }

    //remaining messages get no icon (these are generally error details)
    return new Pair(null, null)
  }

  private function removeOldReferences() {
    AllLanguages.each(\language -> {
      // product model disply keys
      var file = createPath(APDLanguageResolver.resolveProductModelDisplayPropertiesFilePaths(language))
      if (fileExists(file)) {
        if (Context.IsCheckSumRun) {
          Context.FileTracker.trackFileChanges(file, false)
        } else {
          // for re-gens, we need to look for and remove any existing lines to avoid duplicates
          // APD does not maintain the following types therefore we won't delete the relevant display keys
          //      modifiers
          //      offerings
          var unhandledTypes = "((?!(Modifier_|Offering_)).)*$"
          var unwantedRegexes = new ArrayList<String>()
          unwantedRegexes.add("Product_" + _product.CodeIdentifier + unhandledTypes)
          _product.ProductLines*.ProductLine.each(\pl -> {
            unwantedRegexes.add("PolicyLine_" + pl.CodeIdentifier + unhandledTypes)
          })

          // this version is buffered and handles the file line by line, assuming it could be large and we don't want to read it all into memory
          var tempFile = createPath(APDLanguageResolver.resolveTempProductModelDisplayPropertiesFilePaths(language))
          var temp = Files.newBufferedWriter(tempFile, StandardCharsets.UTF_8, new OpenOption[]{})
          final var lines = Files.lines(file)
          try {
            lines.filter(\dsp -> dsp.length > 0 and not unwantedRegexes.hasMatch(\unwanted -> dsp.matches(unwanted))).forEach(\w -> {
              temp.write(w)
              temp.newLine()
            })
          } finally {
            temp.close()
            lines.close()
          }
          // this will rename the file back to the original
          Files.move(tempFile, file, new CopyOption[]{StandardCopyOption.REPLACE_EXISTING})
          // this version reads it all into memory and does not need a temporary file
          // var filteredContent = Files.lines(file).filter(\w -> not unwanted.hasMatch(\name -> w.substring(0, w.indexOf(".")) == name)).collect(Collectors.toList())
          // Files.write(file, filteredContent, StandardCharsets.UTF_8, new OpenOption[]{StandardOpenOption.TRUNCATE_EXISTING})
        }
      }
      // standard display keys
      file = createPath(APDLanguageResolver.resolveDisplayPropertiesFilePaths(language))
      if (fileExists(file)) {
        if (Context.IsCheckSumRun) {
          Context.FileTracker.trackFileChanges(file, false)
        } else {
          // for re-gens, we need to look for and remove any existing lines to avoid duplicates
          var unwanted = new ArrayList<String>()
          unwanted.add("Web.LineWizardMenu." + _product.CodeIdentifier + ".")
          unwanted.add("Web.PolicyFile.ProductLine." + _product.CodeIdentifier + ".")
          _product.ProductLines*.ProductLine.each(\pl -> {
            unwanted.add("Web.Differences.LOB." + pl.LinePrefix)
            unwanted.add("entity." + pl.LinePrefix + pl.TypeName)
            unwanted.add("Web.PolicyFile." + pl.LinePrefix + ".")
            unwanted.add("Web.PolicyFile.Line." + pl.LinePrefix + ".")
            unwanted.add("Web.PolicyFile." + pl.CodeIdentifier + ".")
            unwanted.add("Web.Policy." + pl.LinePrefix + ".")
            pl.Exposures.each(\exp -> {
              unwanted.add("entity." + pl.LinePrefix + exp.TypeName)
            })
            pl.AllChildCoverables.each(\cbl -> {
              unwanted.add("entity." + cbl.LinePrefix + cbl.TypeName)
              cbl.Exposures.each(\exp -> {
                unwanted.add("entity." + cbl.LinePrefix + exp.TypeName)
              })
            })
          })
          // this version is buffered and handles the file line by line, assuming it could be large and we don't want to read it all into memory
          var tempFile = createPath(APDLanguageResolver.resolveTempDisplayPropertiesFilePaths(language))
          var temp = Files.newBufferedWriter(tempFile, StandardCharsets.UTF_8, new OpenOption[]{})
          final var lines = Files.lines(file)
          try {
            lines.filter(\dsp -> dsp.length > 0 and not unwanted.hasMatch(\name -> dsp.substring(0, minLength(dsp, name)) == name)).forEach(\w -> {
              temp.write(w)
              temp.newLine()
            })
          } finally {
            temp.close()
            lines.close()
          }
          // this will rename the file back to the original
          Files.move(tempFile, file, new CopyOption[]{StandardCopyOption.REPLACE_EXISTING})
        }
      }
      // typelist disply keys
      file = createPath(APDLanguageResolver.resolveTypelistPropertiesFilePaths(language))
      if (fileExists(file)) {
        if (Context.IsCheckSumRun) {
          Context.FileTracker.trackFileChanges(file, false)
        } else {
          // for re-gens, we need to look for and remove any existing lines to avoid duplicates
          var unwanted = new ArrayList<String>()
          _product.ProductLines*.ProductLine.each(\pl -> {
            unwanted.add("TypeKey.InstalledPolicyLine." + pl.LinePrefix)
            unwanted.add("TypeKeyDescription.InstalledPolicyLine." + pl.LinePrefix)
          })
          // add typelists - only if new or we can regenerate
          for (typelist in _product.AllTypelists.where(\tl -> not tl.TypelistExists
              or (tl.TypelistExists and tl.DoNotRegenerate != true))) {
            unwanted.add("TypeKey." + typelist.Typelist + ".")
            unwanted.add("TypeKeyDescription." + typelist.Typelist + ".")
          }
          // this version is buffered and handles the file line by line, assuming it could be large and we don't want to read it all into memory
          var tempFile = createPath(APDLanguageResolver.resolveTempTypelistPropertiesFilePaths(language))
          var temp = Files.newBufferedWriter(tempFile, StandardCharsets.UTF_8, new OpenOption[]{})
          final var lines = Files.lines(file)
          try {
            lines.filter(\dsp -> dsp.length > 0 and not unwanted.hasMatch(\name -> dsp.substring(0, minLength(dsp, name)) == name)).forEach(\w -> {
              temp.write(w)
              temp.newLine()
            })
          } finally {
            temp.close()
            lines.close()
          }
          // this will rename the file back to the original
          Files.move(tempFile, file, new CopyOption[]{StandardCopyOption.REPLACE_EXISTING})
        }
      }
    })
  }

  property get CurrencyDisplayModeMismatch() : boolean {
    if (gw.api.system.PLConfigParameters.MulticurrencyDisplayMode.Value == "SINGLE") {
      return findFirstMulticurrencyMode() != null
    } else {
      return false
    }
  }

  property get HasModifiedFileWarning() : boolean {
    return _fileModificationWarning.HasContent
  }

  property get ModifiedFileWarning() : String {
    return _fileModificationWarning
  }

  public function findFirstMulticurrencyMode() : APDCurrencyHandling {
    return _product.Currencies != APDCurrencyHandling.TC_DOMESTIC ? _product.Currencies :
        _product.ProductLines*.ProductLine*.Currencies.firstWhere(\curr -> curr != APDCurrencyHandling.TC_DOMESTIC)
  }

  private function minLength(a : String, b : String) : Integer {
    return a.length < b.length ? a.length : b.length
  }

}