package gw.apd.model.generate

uses gw.apd.model.generate.templates.TemplateComparators
uses gw.apd.model.generate.templates.product.DiffTreeDisplayProperties
uses gw.apd.model.generate.templates.product.LineWizardStepSet
uses gw.apd.model.generate.templates.product.PolicyMenuItemSet
uses gw.apd.model.generate.templates.product.ProductDiffTree
uses gw.apd.model.generate.templates.product.ProductDisplayProperties
uses gw.apd.model.generate.templates.product.ProductLookups
uses gw.apd.model.generate.templates.product.Product_Existing
uses gw.apd.model.generate.templates.product.Product_New
uses gw.apd.model.generate.templates.product.Typelist
uses gw.apd.model.generate.templates.product.Typelist_Names
uses gw.apd.model.generate.templates.systables.UWCompany_Existing
uses gw.apd.model.generate.xsd.productmodel.Product
uses org.w3c.dom.Node
uses org.w3c.dom.NodeList

uses javax.xml.parsers.DocumentBuilderFactory
uses javax.xml.xpath.XPathConstants
uses javax.xml.xpath.XPathFactory
uses java.nio.file.Path

@Export
class ProductGenerator extends TrackedFileGenerator {

  static final var SAMPLE_UW_COMPANY : String = "apd:1"
  static final var PUB_ID_ATTR : String = "public-id"

  var _product : APDProduct

  construct(context : GenerationContext, product : APDProduct) {
    super(context)
    _product = product
  }

  function generateConfig() {
    // create directory
    var path = createPath(PRODUCTSDIRECTORY.concat(new String[]{_product.CodeIdentifier}))
    createOrConfirmDirectory(path)
    path = createPath(LINEUIDIRECTORY.concat(new String[]{_product.Abbreviation.toLowerCase(), JOB}))
    createOrConfirmDirectory(path)
    path = createPath(LINEUIDIRECTORY.concat(new String[]{_product.Abbreviation.toLowerCase(), POLICY}))
    createOrConfirmDirectory(path)
    path = createPath(LINEUIDIRECTORY.concat(new String[]{_product.Abbreviation.toLowerCase(), POLICYFILE}))
    createOrConfirmDirectory(path)

    // create or update product definition
    var file = createPath((PRODUCTSDIRECTORY.concat(new String[]{_product.CodeIdentifier, _product.CodeIdentifier.concat(".xml")})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \-> Product_New.renderToString(_product), false)
    } else {
      addOrReplaceFile(file, \-> {
        var pmProduct = Product.parse(file) // do we need to close and reopen "file"?
        return Product_Existing.renderToString(_product, pmProduct)
      }, false)
    }
    // only write the lookup file if it does not exist; this preserves any availability logic added
    file = createPath((PRODUCTSDIRECTORY.concat(new String[]{_product.CodeIdentifier, _product.CodeIdentifier.concat("-lookups.xml")})))
    if (fileDoesNotExist(file)) {
      addOrReplaceFile(file, \-> ProductLookups.renderToString(_product), false)
    }
    // add product model display properties for each language
    AllLanguages.each(\language -> {
      file = createPath(APDLanguageResolver.resolveProductModelDisplayPropertiesFilePaths(language))
      if (fileExists(file)) {
        // add the display literals to the end
        appendToFile(file, \-> ProductDisplayProperties.renderToString(_product, language), false)
      } else {
        addOrReplaceFile(file, \-> ProductDisplayProperties.renderToString(_product, language), false)
      }
    })
    // add typelists - only if new or we can regenerate
    for (typelist in _product.AllTypelists.where(\tl -> not tl.TypelistExists
        or (tl.TypelistExists and tl.DoNotRegenerate != true)) // null DoNotRegenrate => false
        .orderBy(\typelist -> typelist.Typelist)) { // The name of the implementing typelist must be unique within PC
      file = createPath(TYPELISTDIRECTORY.concat(new String[]{typelist.Typelist.concat(".tti")}))
      addOrReplaceFile(file, \-> Typelist.renderToString(typelist))
      AllLanguages.each(\language -> {
        file = createPath(APDLanguageResolver.resolveTypelistPropertiesFilePaths(language))
        if (fileExists(file)) {
          // add the display literals to the end
          appendToFile(file, \-> Typelist_Names.renderToString(typelist, language), false)
        } else {
          addOrReplaceFile(file, \-> Typelist_Names.renderToString(typelist, language), false)
        }
      })
    }

    // UI
    // add wizard steps to the UI - need to decide when this is not replaced
    file = createPath(LINEUIDIRECTORY.concat(new String[]{_product.Abbreviation.toLowerCase(), JOB, "LineWizardStepSet." + _product.CodeIdentifier + ".pcf"}))
    addOrReplaceFile(file, \-> LineWizardStepSet.renderToString(_product, FIELDMAX))
    file = createPath(LINEUIDIRECTORY.concat(new String[]{_product.Abbreviation.toLowerCase(), POLICYFILE, "PolicyMenuItemSet." + _product.CodeIdentifier + ".pcf"}))
    addOrReplaceFile(file, \-> PolicyMenuItemSet.renderToString(_product, FIELDMAX))
    // add the diff tree
    file = createPath(DIFFTREEDIRECTORY.concat(new String[]{_product.Abbreviation.concat("DiffTree.xml")}))
    addOrReplaceFile(file, \-> ProductDiffTree.renderToString(_product))
    AllLanguages.each(\language -> {
      file = createPath(APDLanguageResolver.resolveDisplayPropertiesFilePaths(language))
      if (fileExists(file)) {
        // add the display literals to the end
        appendToFile(file, \-> DiffTreeDisplayProperties.renderToString(_product, language), false)
      } else {
        addOrReplaceFile(file, \-> DiffTreeDisplayProperties.renderToString(_product, language), false)
      }
    })

    //TODO: for now we're just adding the line to a random UW company
    //but we'll want to give the user that choice in the future
    //only do this if there isn't already a compatible UW company (prevents readding on regens)
    file = createPath(SYSTABLESDIRECTORY.concat({"underwriting_companies.xml"}))
    var noMatchingCompany = verifyNoMatchingCompanyInFile(file, _product.CodeIdentifier)
    if (noMatchingCompany) {
      insertContents(file, \-> {
        var uwCompanyPublicID = returnDefaultOrFirstUWCompany(file)
        return UWCompany_Existing.renderToString(_product, uwCompanyPublicID)
      }, "</import>", false)
    }
  }

  protected function verifyNoMatchingCompanyInFile(filePath : Path, product : String) : boolean {
    var factory = DocumentBuilderFactory.newInstance();
    var builder = factory.newDocumentBuilder();
    var doc = builder.parse(filePath.toFile());
    var xPathfactory = XPathFactory.newInstance();
    var nodeList = (xPathfactory.newXPath().compile("/import/LicensedState/ProductCode[text()='${product}']")
        .evaluate(doc, javax.xml.xpath.XPathConstants.NODESET) as org.w3c.dom.NodeList)
    return nodeList.Length == 0
  }

  /**
   * If the "default apd" UW company exists in the system table file return its publicID
   * Otherwise return the publicID of the first UWcompany found
   */
  protected function returnDefaultOrFirstUWCompany(filePath : Path) : String {
    var factory = DocumentBuilderFactory.newInstance();
    var builder = factory.newDocumentBuilder();
    var doc = builder.parse(filePath.toFile());
    var xPathfactory = XPathFactory.newInstance();
    var node = (xPathfactory.newXPath().compile("/import/UWCompany[@${PUB_ID_ATTR}='${SAMPLE_UW_COMPANY}']")
        .evaluate(doc, XPathConstants.NODE) as Node)
    if (node != null) {
      return SAMPLE_UW_COMPANY
    } else {
      var nodeList = (xPathfactory.newXPath().compile("/import/UWCompany")
          .evaluate(doc, XPathConstants.NODESET) as NodeList)
      if (nodeList == null || nodeList.getLength() == 0) {
        throw new IllegalArgumentException("Unable to find any UWCompany rows in file " + filePath.toAbsolutePath().toString())
      } else {
        return nodeList.item(0).getAttributes().getNamedItem(PUB_ID_ATTR).TextContent
      }
    }
  }
}