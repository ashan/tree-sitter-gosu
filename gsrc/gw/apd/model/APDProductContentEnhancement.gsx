package gw.apd.model

uses entity.APDAttribute
uses gw.apd.model.export.APDProductExportHelper
uses gw.apd.model.generate.xml.TemplateExportUtil
uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.api.util.LocaleUtil
uses gw.xml.XMLNode
uses gw.xml.XmlSerializationOptions
uses pcf.JobForward

uses java.nio.charset.Charset

enhancement APDProductContentEnhancement : APDProduct {
  /**
   * Returns true if the product can be removed, and false otherwise.
   */
  function canRemove() : boolean {
    return !hasBoundPeriods() and !hasOpenPeriodsThatCannotBeWithdrawn()
  }

  /**
   * Returns true if there are any bound periods for the product.
   */
  private function hasBoundPeriods() : boolean {
    var periodQuery = Query.make(PolicyPeriod)
    periodQuery.compare(PolicyPeriod#ModelNumber, NotEquals, null)
    var policyQuery = periodQuery.join(PolicyPeriod#Policy)
    policyQuery.compare(Policy#APDProduct, Equals, this)
    return periodQuery.select().Count > 0
  }

  /**
   * Returns true if there are any open periods for the given product that cannot be automatically withdrawn
   */
  private function hasOpenPeriodsThatCannotBeWithdrawn() : boolean {
    var openPeriodsQuery = getQueryForOpenPeriods()
    return openPeriodsQuery.hasMatch(\period -> not period.JobProcess.canWithdraw().Okay)
  }

  /**
   * Returns a query for open (non-completed) periods for the given product
   */
  private function getQueryForOpenPeriods() : IQueryBeanResult<PolicyPeriod> {
    var periodQuery = Query.make(PolicyPeriod)
    periodQuery.compare(PolicyPeriod#Locked, Equals, false)
    var policyQuery = periodQuery.join(PolicyPeriod#Policy)
    policyQuery.compare(Policy#APDProduct, Equals, this)
    return periodQuery.select()
  }
  /**
   * Returns a message if the product cannot be removed, or null if the removal is permitted
   */
  function getRemoveProductErrors() : String {
    if (hasBoundPeriods()) {
      return DisplayKey.get("Web.APD.RemoveProduct.Error.BoundJobs")
    } else if (hasOpenPeriodsThatCannotBeWithdrawn()) {
      return DisplayKey.get("Web.APD.RemoveProduct.Error.OpenJobs")
    } else {
      return null
    }
  }
  /**
   * Removes (retires) the given product. This will throw an exception if the product has any bound jobs or any jobs
   * that cannot be automatically withdrawn. Changes are made in a separate bundle.
   */
  function maybeRemove() {
    var error = getRemoveProductErrors()
    if (error != null) {
      throw new gw.api.util.DisplayableException(error)
    }

    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      var openPeriods = getQueryForOpenPeriods().toTypedArray()
      for (period in openPeriods) {
        bundle.add(period).getSlice(period.EditEffectiveDate).JobProcess.withdraw()
      }
      bundle.add(this).removeProduct()
    })
  }

  function createSubmission(account : Account, producerSelection : ProducerSelection) {
    var offer = new ProductSelection()
    offer.Product = gw.api.productmodel.ProductLookup.getByCodeIdentifier("Manual")
    if( producerSelection.DefaultPPEffDate == null ) {
      throw new gw.api.util.DisplayableException(DisplayKey.get('Web.SubmissionManagerLV.DefaultPPEffDateRequired'))
    }
    if( producerSelection.ProducerCode == null ) {
      throw new gw.api.util.DisplayableException( DisplayKey.get('Web.SubmissionManagerLV.ProducerCodeRequired') )
    }
    gw.api.web.job.submission.SubmissionUtil.setLastProducerSelection( producerSelection )
    offer.NumToCreate = 1
    var submission = gw.api.web.job.submission.SubmissionUtil.createSubmission( offer, account, producerSelection, QuoteType.TC_FULL )
    // For one new submission - go straight to Submission view
    var policyPeriod = submission.LatestPeriod
    gw.transaction.Transaction.runWithNewBundle( \ bun -> {
      policyPeriod = bun.add(policyPeriod)
      var policy = bun.add(policyPeriod.Policy)
      policy.APDProduct = this
      policyPeriod.SubmissionProcess.beginEditing()
      // add lines - PolicyCenter adds all lines in a multi-line product and the user must remove those not required
      this.ProductLines*.ProductLine.each(\pl -> {
        pl.buildRiskPolicyLine(policyPeriod.ManualLine)
      })
    })
    JobForward.go(submission, policyPeriod)
  }

  /**
   * Streams an XML representation of this product to a client browser. The filename will be this
   * product's <code>CodeIdentifier</code> suffixed with the current time.
   */
  function exportToClient() {
    var content = exportToXML()
    var fileName = TemplateExportUtil.getDefaultTemplateFilename(this.Abbreviation)
    TemplateExportUtil.exportToClient(content, fileName)
  }

  public function exportToXML() : byte[] {
    var export = new APDProductExportHelper(this).buildExport()

    var content = export.bytes(new XmlSerializationOptions(){
      :Encoding = Charset.forName("UTF-8"),
      :Sort = false,
      :Validate = false
    })

    return content
  }

  function buildTree() : XMLNode {
    var tree = new XMLNode(){
      :ElementName = "Product"
    }
    tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.ProductNode"))
    tree.setAttributeValue("Name", this.Name)
    if (checkGenerationValidity(tree)) {
      tree.setAttributeValue("Valid", "true")
    } else {
      tree.setAttributeValue("Valid", "false")
    }

    var typelistSet = this.AllTypelists.partition(\tl -> tl.Typelist)

    typelistSet.eachKeyAndValue(\tl, attributes -> {
      var typelistTree = new XMLNode(){
        :ElementName = "Typelist"
      }
      typelistTree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.TypelistNode"))
      typelistTree.setAttributeValue("Name", tl)
      tree.addChild(typelistTree)
      if (checkTypelistGenerationValidity(typelistTree, tl, attributes)) {
        typelistTree.setAttributeValue("Valid", "true")
        if (attributes.first().TypelistExists and attributes.first().DoNotRegenerate) {
          typelistTree.setAttributeValue("Generate", "false")
        } else {
          typelistTree.setAttributeValue("Generate", "true")
        }
      } else {
        typelistTree.setAttributeValue("Valid", "false")
      }
    })

    this.ProductLines*.ProductLine.each(\line -> {
      tree.addChild(line.buildTree())
    })

    // the coverable is invalid if any of its children are not valid
    if (tree.Children.hasMatch(\node -> node.getAttributeValue("Valid") == "false")) {
      tree.setAttributeValue("Valid", "false")
    }

    return tree
  }

  function buildTreeForVisualization() : XMLNode {
    var tree = new XMLNode(){
      :ElementName = "Product"
    }
    tree.setAttributeValue("Type", DisplayKey.get("Web.APD.ProductTree.ProductNode"))
    tree.setAttributeValue("Name", this.Name)

    this.ProductLines*.ProductLine.each(\line -> {
      tree.addChild(line.buildTreeForVisualization())
    })
    return tree
  }

  function checkGenerationValidity(cblNode : XMLNode) : Boolean {
    var valid = true
    var messages = new ArrayList<String>()

    if (not CodegenValidator.isValidName(this.CodeIdentifier)) {
      messages.add(DisplayKey.get("Web.APDValidation.Product.InvalidName", DisplayKey.get("Web.APDNewProduct.CodeIdentifier")))
    }
    if (not CodegenValidator.isValidName(this.Abbreviation)) {
      messages.add(DisplayKey.get("Web.APDValidation.Product.InvalidName", DisplayKey.get("Web.APDNewProduct.Abbreviation")))
    }

    var codeIdentifiers = this.ProductLines*.ProductLine*.CodeIdentifier.toList()
    codeIdentifiers.add(this.CodeIdentifier)
    var duplicateCodeIdentifiers = CodegenValidator.findDuplicates(codeIdentifiers.toTypedArray())
    for (duplicateCodeIdentifier in duplicateCodeIdentifiers) {
      messages.add(DisplayKey.get("Web.APDValidation.Product.UniqueIdentifiers", duplicateCodeIdentifier))
    }

    var duplicateLinePrefixes = CodegenValidator.findDuplicates(this.ProductLines*.ProductLine*.LinePrefix)
    for (duplicateLinePrefix in duplicateLinePrefixes) {
      messages.add(DisplayKey.get("Web.APDValidation.ProductLine.UniqueLinePrefixes", duplicateLinePrefix))
    }

    // must ensure default language exists for text that goes into display keys
    var lang = LocaleUtil.getDefaultLanguageType()
    if (this["Name_" + lang.Code] == null) {
      messages.add(DisplayKey.get("Web.APDValidation.Product.MissingName"))
    }
    if (this["Description_" + lang.Code] == null) {
      messages.add(DisplayKey.get("Web.APDValidation.Product.MissingDescription"))
    }

    if (messages.Count > 0) {
      valid = false
      messages.each(\msg -> {
        var errorTree = new XMLNode()
        errorTree.ElementName = "ERROR"
        errorTree.setAttributeValue("Name", msg)
        cblNode.addChild(errorTree)
      })
    }

    return valid
  }

  function checkTypelistGenerationValidity(cblNode : XMLNode, tl : String, attributes : List<APDAttribute>) : Boolean {
    var valid = true
    var messages = new ArrayList<String>()

    // typename must be used only once
    if (attributes.Count != 1) {
      attributes.each(\att -> {
        messages.add(DisplayKey.get("Web.APDValidation.DuplicateTypelistName", att.Label))
      })
    }

    if (messages.Count > 0) {
      valid = false
      messages.each(\msg -> {
        var errorTree = new XMLNode()
        errorTree.ElementName = "ERROR"
        errorTree.setAttributeValue("Name", msg)
        cblNode.addChild(errorTree)
      })
    }

    return valid
  }
}
