class StandAloneBillingSystemPlugin {
  private function createInvoiceStreams() {
    return new BillingInvoiceStreamInfo[]{
        new StandAloneBillingInvoiceStreamInfo() {
        :PublicID = "1:" + id,
        :Description = "PA (57493074, 5738982)"
      }
    }
  }

  function searchForAccounts() {
     localAccountQuery.compare(Account.ACCID_ACC_PROP.get(), Relop.Equals, searchCriteria.AccountNumber)
  }
}
