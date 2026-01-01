package edge.capabilities.gpa.account.search

uses edge.capabilities.gpa.account.search.dto.AccountSearchCriteriaDTO
uses gw.account.AccountSearchCriteria
uses edge.di.annotations.ForAllGwNodes
uses java.lang.Integer

uses gw.api.database.InOperation
uses gw.api.database.Query
uses gw.api.filters.StandardQueryFilter
uses gw.api.database.IQueryBeanResult
uses gw.entity.IEntityPropertyInfo
uses edge.capabilities.gpa.account.search.dto.AccountSearchSummaryDTO
uses edge.capabilities.gpa.account.IAccountSummaryPlugin
uses java.lang.IllegalArgumentException
uses edge.capabilities.helpers.pagination.IQueryPlugin
uses edge.capabilities.helpers.pagination.dto.QueryOptionsDTO
uses edge.capabilities.helpers.pagination.dto.QueryParameterDTO

class DefaultAccountSearchPlugin implements IAccountSearchPlugin {

  final private static var defaultCreatedInLastXDays : Integer = 30
  private var _accountSummaryPlugin : IAccountSummaryPlugin
  private var _queryPlugin : IQueryPlugin

  @ForAllGwNodes
  construct(anAccountSummaryPlugin : IAccountSummaryPlugin, aQueryPlugin : IQueryPlugin) {
    this._accountSummaryPlugin = anAccountSummaryPlugin
    this._queryPlugin = aQueryPlugin
  }

  override function toDTO(anAccountSearchCriteria: AccountSearchCriteria): AccountSearchCriteriaDTO {
    final var dto = new AccountSearchCriteriaDTO()
    fillBaseProperties(dto, anAccountSearchCriteria)

    return dto
  }

  override function createSearchCriteria(dto: AccountSearchCriteriaDTO): AccountSearchCriteria {
    final var anAccountSearchCriteria = new AccountSearchCriteria()
    updateBaseProperties(anAccountSearchCriteria, dto)

    return anAccountSearchCriteria
  }

  public static function fillBaseProperties(dto : AccountSearchCriteriaDTO, anAccountSearchCriteria : AccountSearchCriteria){
    dto.ContactName = anAccountSearchCriteria.CompanyName
    dto.ContactNameKanji = anAccountSearchCriteria.CompanyNameKanji
    dto.FirstName = anAccountSearchCriteria.FirstName
    dto.LastName = anAccountSearchCriteria.LastName
    dto.FirstNameKanji = anAccountSearchCriteria.FirstNameKanji
    dto.LastNameKanji = anAccountSearchCriteria.LastNameKanji
    dto.City = anAccountSearchCriteria.City
    dto.CityKanji = anAccountSearchCriteria.CityKanji
    dto.State = anAccountSearchCriteria.State
    dto.PostalCode = anAccountSearchCriteria.PostalCode
  }

  public static function updateBaseProperties(anAccountSearchCriteria: AccountSearchCriteria, dto: AccountSearchCriteriaDTO) {

    if(dto.ContactType == ContactType.TC_COMPANY){
      anAccountSearchCriteria.CompanyName = dto.ContactName
      anAccountSearchCriteria.CompanyNameKanji = dto.ContactNameKanji
    } else if(dto.ContactType == ContactType.TC_PERSON){

      anAccountSearchCriteria.FirstName = dto.FirstName
      anAccountSearchCriteria.LastName = dto.LastName
      anAccountSearchCriteria.FirstNameKanji = dto.FirstNameKanji
      anAccountSearchCriteria.LastNameKanji = dto.LastNameKanji
    }

    anAccountSearchCriteria.City = dto.City
    anAccountSearchCriteria.CityKanji = dto.CityKanji
    anAccountSearchCriteria.State = dto.State
    anAccountSearchCriteria.PostalCode = dto.PostalCode
  }

  override function getAccountsForProducerCode(createdInLastXDays: Integer, aProducerCode: ProducerCode, queryOptions: QueryOptionsDTO): AccountSearchSummaryDTO {
    if(aProducerCode == null){
      throw new IllegalArgumentException("ProducerCode must not be null.")
    }
    return getAccountsForProducerCodes(createdInLastXDays, {aProducerCode}, queryOptions, null)
  }

  override function getAccountsForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]): AccountSearchSummaryDTO {
    final var producerCodes = User.util.CurrentUser.UserProducerCodes*.ProducerCode

    return getAccountsForProducerCodes(createdInLastXDays, producerCodes, queryOptions, queryParameters)
  }

  override function getAllAccountsForCurrentUser(): Account[] {
    final var producerCodes = User.util.CurrentUser.UserProducerCodes*.ProducerCode
    final var accounts = new ArrayList<Account>()
    final var accountQuery = getAccountsQueryForProducerCodes(producerCodes, null, null)

    accountQuery.each( \ account -> accounts.add(account as Account))

    return accounts.toTypedArray()
  }

  override function getAccountsForProducerCodes(createdInLastXDays : Integer, producerCodes: ProducerCode[], queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]): AccountSearchSummaryDTO {
    var accountQuery = getAccountsQueryForProducerCodes(producerCodes, createdInLastXDays, queryOptions)
    if(queryParameters != null && queryParameters.HasElements){
      accountQuery = _queryPlugin.runQueryOperation(accountQuery, queryParameters)
    }
    final var accounts = filterAccountsQueryResultsByOffset(accountQuery, queryOptions)

    return accountSearchResultsToDTO(accountQuery, accounts.toTypedArray())
  }

  override function getPersonalAccountsForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]): AccountSearchSummaryDTO {
    final var producerCodes = User.util.CurrentUser.UserProducerCodes*.ProducerCode
    return getAccountsByAccountTypeForCurrentUser(createdInLastXDays, queryOptions, typekey.Contact.TC_PERSON, producerCodes, queryParameters)
  }

  override function getCommercialAccountsForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]): AccountSearchSummaryDTO {
    final var producerCodes = User.util.CurrentUser.UserProducerCodes*.ProducerCode
    return getAccountsByAccountTypeForCurrentUser(createdInLastXDays, queryOptions, typekey.Contact.TC_COMPANY, producerCodes, queryParameters)
  }

  override function getPersonalAccountsForProducerCode(createdInLastXDays: Integer, queryOptions: QueryOptionsDTO, aProducerCode: ProducerCode): AccountSearchSummaryDTO {
    if(aProducerCode == null){
      throw new IllegalArgumentException("ProducerCode must not be null.")
    }
    return getAccountsByAccountTypeForCurrentUser(createdInLastXDays, queryOptions, typekey.Contact.TC_PERSON, {aProducerCode}, null)
  }

  override function getCommercialAccountsForProducerCode(createdInLastXDays: Integer, queryOptions: QueryOptionsDTO, aProducerCode: ProducerCode): AccountSearchSummaryDTO {
    if(aProducerCode == null){
      throw new IllegalArgumentException("ProducerCode must not be null.")
    }
    return getAccountsByAccountTypeForCurrentUser(createdInLastXDays, queryOptions, typekey.Contact.TC_COMPANY, {aProducerCode}, null)
  }

  override function getAccountsForProducerCode(aProducerCode: ProducerCode): Account[] {
    return getAccountsForProducerCodes(new ProducerCode[]{aProducerCode})
  }

  override function getAccountsForProducerCodes(producerCodes: ProducerCode[]): Account[] {
    final var accounts = new ArrayList<Account>()
    final var accountQuery = getAccountsQueryForProducerCodes(producerCodes, null, null)

    accountQuery.each( \ account -> accounts.add(account as Account))

    return accounts.toTypedArray()
  }

  protected function accountSearchResultsToDTO(aQueryResults : IQueryBeanResult, accounts : Account[]) : AccountSearchSummaryDTO{
    final var accountSearchSummary = new AccountSearchSummaryDTO()
    accountSearchSummary.MaxNumberOfResults = aQueryResults.Count
    accountSearchSummary.Accounts = _accountSummaryPlugin.toDTOArray(accounts)

    return accountSearchSummary
  }

  protected function getAccountsQueryForProducerCodes(producerCodes : ProducerCode[], createdInLastXDays : Integer, queryOptions : QueryOptionsDTO) : IQueryBeanResult{

    final var accProdCodeQuery = gw.api.database.Query.make(AccountProducerCode).compareIn("ProducerCode", producerCodes);
    final var accountsQuery = Query.make(Account).subselect("ID", InOperation.CompareIn, accProdCodeQuery, "Account").select()

    if(createdInLastXDays != null){
      final var dateFilter = getCreateTimeQueryFilter(createdInLastXDays)
      accountsQuery.addFilter(dateFilter)
    }

    if(queryOptions.OrderBy != null){
      var prop = entity.Account.Type.TypeInfo.getProperty(queryOptions.OrderBy) as IEntityPropertyInfo
      if(prop != null){
        if(queryOptions.OrderByDescending){
          accountsQuery.orderByDescending(prop)
        }else{
          accountsQuery.orderBy(prop)
        }
      }
    }

    return accountsQuery
  }

  protected function findAccountsByProducerCode(createdInLastXDays : Integer, producerCodes : ProducerCode[]) : Account[]{
    final var accounts = new ArrayList<Account>()

    final var accProdCodeQuery = gw.api.database.Query.make(AccountProducerCode).compareIn("ProducerCode", producerCodes);
    final var accountsQuery = Query.make(Account).subselect("ID", InOperation.CompareIn, accProdCodeQuery, "Account").select()

    if(createdInLastXDays != null){
      final var dateFilter = getCreateTimeQueryFilter(createdInLastXDays)
      accountsQuery.addFilter(dateFilter)
    }

    if(accountsQuery.HasElements){
      accountsQuery.each( \ account -> {
          if(perm.Account.view(account)){
              accounts.add(account)
          }
      })
    }

    return accounts.toTypedArray()
  }

  protected function getCreateTimeQueryFilter(createdInLastXDays: Integer): StandardQueryFilter {
    var currentDate = gw.api.util.DateUtil.currentDate()
    createdInLastXDays = createdInLastXDays ?: defaultCreatedInLastXDays

    return new StandardQueryFilter("Created in last X days", \query -> {
      query.between("CreateTime", currentDate.addDays(- createdInLastXDays).trimToMidnight(), currentDate)
    })
  }

  protected function getAccountsByAccountTypeForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, accountContactType : typekey.Contact, producerCodes : ProducerCode[], queryParameters : QueryParameterDTO[]) : AccountSearchSummaryDTO{
    var accountQuery = getAccountsQueryForProducerCodes(producerCodes, createdInLastXDays, queryOptions)
    final var accountTypeFilter = getAccountTypeFilter(accountContactType)
    accountQuery.addFilter(accountTypeFilter)

    if(queryParameters != null && queryParameters.HasElements){
      accountQuery = _queryPlugin.runQueryOperation(accountQuery, queryParameters)
    }

    final var accounts = filterAccountsQueryResultsByOffset(accountQuery, queryOptions)

    return accountSearchResultsToDTO(accountQuery, accounts.toTypedArray())
  }

  protected function getAccountTypeFilter(accountContactType : typekey.Contact) : StandardQueryFilter{
    return new StandardQueryFilter("AccountContactTypeFilter", \ aQuery -> {
      aQuery.join("AccountHolderContact").compare("Subtype", Equals, accountContactType)
    })
  }

  protected function filterAccountsQueryResultsByOffset(accountQuery: IQueryBeanResult, queryOptions: QueryOptionsDTO): List<Account> {
    final var accounts = new ArrayList<Account>()

    if (queryOptions.OffsetEnd != null) {
      var accIterator = accountQuery.iterator(queryOptions.OffsetStart)
      for (var i in queryOptions.OffsetStart..queryOptions.OffsetEnd) {
        if (accIterator.hasNext()) {
          accounts.add(accIterator.next() as Account)
        } else {
          break
        }
      }
    } else {
      accountQuery.each(\ account -> accounts.add(account as Account))
    }

    return accounts
  }

}
