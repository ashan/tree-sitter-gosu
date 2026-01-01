package nz.co.acc.edge.capabilities.policychange.draft

uses edge.capabilities.policychange.draft.IPolicyChangeDraftPlugin
uses edge.capabilities.policychange.dto.TransactionDTO

/**
 * Created by nitesh.gautam on 04-Aug-17.
 */
interface IPolicyChangeDraftPlugin_ACC extends IPolicyChangeDraftPlugin {
  function toDto(change:PolicyChange):TransactionDTO
}