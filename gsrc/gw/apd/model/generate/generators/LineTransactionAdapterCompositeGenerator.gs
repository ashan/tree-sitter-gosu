package gw.apd.model.generate.generators

uses gw.apd.model.generate.GenerationContext
uses gw.apd.model.generate.templates.Templates

@Export
class LineTransactionAdapterCompositeGenerator extends CompositeTemplateBasedGenerator {

  construct(context : GenerationContext, productLine : entity.APDProductLine) {
    var subPackage : String[] = {productLine.LinePrefixLowerCase, FINANCIALS}
    var filePrefix = productLine.LinePrefix
    _generators = {
        new APDProductLineBasedGenerator(context, productLine, Templates.LINE_TRANSACTION_ADAPTER,
            BASE_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}TransactionAdapterBase.gs"
        ),
        new APDProductLineBasedGenerator(context, productLine, Templates.LINE_TRANSACTION_ADAPTER_EXT,
            EXT_GOSU_LOB_DIR.concat(subPackage), "${filePrefix}TransactionAdapter.gs"
        )
    }
  }

}