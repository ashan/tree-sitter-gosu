package nz.co.acc.edge.capabilities.policychange.draft

uses edge.capabilities.address.IPolicyAddressPlugin
uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.policychange.draft.DefaultPolicyChangeDraftPlugin
uses edge.capabilities.policychange.dto.DraftLobDataDTO
uses edge.capabilities.policychange.dto.TransactionDTO
uses edge.capabilities.policychange.lob.ILobDraftPlugin
uses edge.capabilities.quote.lob.ILobQuotingPlugin
uses edge.capabilities.quote.lob.dto.QuoteLobDataDTO
uses edge.di.annotations.ForAllNodes

/**
 * Created by nitesh.gautam on 04-Aug-17.
 */
class PolicyChangeDraftPlugin_ACC extends DefaultPolicyChangeDraftPlugin implements IPolicyChangeDraftPlugin_ACC {

  @ForAllNodes
  construct(addressPlugin : IPolicyAddressPlugin, lobPlugin : ILobDraftPlugin<DraftLobDataDTO>, coveragesPlugin : ILobQuotingPlugin<QuoteLobDataDTO>) {
    super(addressPlugin, lobPlugin, coveragesPlugin)
  }

  override function toDto(change : PolicyChange) : TransactionDTO {
    var dto = super.toDto(change)

    //fix for DE518: PreviousTotalCost should always be (TotalCostRPT - TransactionCost)
    dto.PreviousTotalCost = AmountDTO.fromMonetaryAmount(change.LatestPeriod.BasedOn.TotalCostRPT)
    dto.Job = change
    return dto
  }

  override function toDto(change : Renewal) : TransactionDTO {
    var dto = super.toDto(change)

    //fix for DE518: PreviousTotalCost should always be (TotalCostRPT - TransactionCost)
    dto.PreviousTotalCost = AmountDTO.fromMonetaryAmount(change.LatestPeriod.BasedOn.TotalCostRPT)
    dto.Job = change
    return dto
  }

  override function toDto(change : Job) : TransactionDTO {
    var dto = super.toDto(change)

    //fix for DE518: PreviousTotalCost should always be (TotalCostRPT - TransactionCost)
    dto.PreviousTotalCost = AmountDTO.fromMonetaryAmount(change.LatestPeriod.BasedOn.TotalCostRPT)
    dto.Job = change
    return dto
  }
}