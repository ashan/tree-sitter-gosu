package nz.co.acc.gwer.batch

uses com.guidewire.inboundfile.batch.InboundFileBatchProcess
uses gw.surepath.suite.integration.inbound.util.InboundFileConfigFactory

class ERClaimsExtractInboundFileBatch_ACC extends InboundFileBatchProcess {
  public static final var CONFIG_PROPERTY_NAME : String = "claimsextract_config_name"

  static final var BATCH_NAME = "ERClaimsExtractInboundFileBatch_ACC"
  construct() {
    super(BatchProcessType.TC_ERCLAIMSEXTRACTINBOUNDFILEBATCH_ACC, BATCH_NAME)
  }

  construct(args : Object[]) {
    super(BatchProcessType.TC_ERCLAIMSEXTRACTINBOUNDFILEBATCH_ACC, { args != null and args.length == 1 ? InboundFileConfigFactory.makeConfig(String.valueOf(args[0])) : InboundFileConfigFactory.makeConfigFromProperty(CONFIG_PROPERTY_NAME) }, BATCH_NAME)
  }
}