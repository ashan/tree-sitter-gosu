package nz.co.acc.rating.controller

uses gw.api.locale.DisplayKey
uses gw.api.util.DateUtil
uses gw.api.util.DisplayableException
uses gw.api.util.TypeUtil
uses gw.rating.rtm.domain.DatabasePopulator
uses gw.rating.rtm.domain.DatabaseVersioning
uses gw.rating.rtm.domain.DefaultErrorCollector
uses gw.rating.rtm.domain.EntityPersistenceAdapter
uses gw.rating.rtm.domain.EntityProcessingPersistenceAdapter
uses gw.rating.rtm.domain.ErrorCollector
uses gw.rating.rtm.domain.ImportPersistenceAdapter
uses gw.rating.rtm.domain.RateTablePopulator
uses gw.rating.rtm.domain.RateTableRowError
uses gw.rating.rtm.domain.TableVersioning
uses gw.rating.rtm.domain.table.RateTableCell
uses gw.rating.rtm.domain.table.RateTableModel
uses gw.rating.rtm.domain.table.RateTableRow
uses gw.rating.rtm.excel.ExcelSheetPopulator
uses gw.rating.rtm.excel.ExcelVersioning
uses gw.rating.rtm.valueprovider.RateTableCellValueProvider
uses gw.rating.rtm.valueprovider.RateTableCellValueProviderFactory
uses nz.co.acc.rating.util.RatingUtil_ACC
uses nz.co.acc.rating.validation.RateTableValidator_ACC
uses org.apache.poi.xssf.usermodel.XSSFSheet

/**
 * Rate table controller to validate and add the CU entity relationship to the rate data.
 */
class RateTableFactorListController_ACC {
  private final var CLASSIFICATION_UNIT_CODE_KEY = "ClassificationUnitCode"
  private final var START_DATE_KEY = "StartDate"
  private final var END_DATE_KEY = "EndDate"
  private final var CLASSIFICATION_UNIT_KEY = "ClassificationUnit_ACC"
  protected var _model: RateTableModel as RateTableModel
  protected var _populator: RateTablePopulator
  protected var _validator: RateTableValidator_ACC
  protected var _versioner: TableVersioning
  var _initRateTableIsOwned: boolean
  var _errorCollector: ErrorCollector as ErrorCollector
  var _persistenceAdapterType: Type<EntityProcessingPersistenceAdapter>
  private var _populateRateModelErrorExists : boolean as PopulateRateModelErrorExists = false // used to determine if an error exists when populating the table model
  private static final var TABLES_WITH_CLASSIFICATION_UNITS = {WorkAccountLevyRate_ACC.TYPE.Name, WorkResidualLevyRate_ACC.TYPE.Name, CPXWorkLevyRate_ACC.TYPE.Name,
                                                               AEPPartnershipDiscLevyRate_ACC.TYPE.Name}.freeze()

  private construct(populator: RateTablePopulator, versioner: TableVersioning, adapterType: Type<EntityProcessingPersistenceAdapter>) {
    _populator = populator
    _versioner = versioner
    _validator = new RateTableValidator_ACC()
    _errorCollector = new DefaultErrorCollector()
    _persistenceAdapterType = adapterType
  }

  function createModel(rateTable: RateTable, repo: RateTableCellValueProviderFactory) {
    if (_model == null) {
      _model = new RateTableModel(rateTable, repo, _persistenceAdapterType)
    }
  }

  function populateRateTableModel(): String {
    _initRateTableIsOwned = _model.RateTable.Owned
    _errorCollector.reset()
    _populateRateModelErrorExists = false
    try {
      _populator.populate(_model, _errorCollector)
      _versioner.updateVersion(_model)
    } catch (e: DisplayableException) {
      _populateRateModelErrorExists = true
      var message = e.Message
      return message
    }
    return null
  }

  function validateModel() {
    _errorCollector.reset()
    _validator.validate(_model, _errorCollector)
  }

  private function updateModelWithCU() {
    var entityName = _model.Entity.Name
    if (TABLES_WITH_CLASSIFICATION_UNITS.contains(entityName)) {
      // only get the CU relationship for these entities
      for (factorRow in _model.FactorRows) {
        var row = factorRow.Row
        var cuCode = row.getFieldValue(CLASSIFICATION_UNIT_CODE_KEY) as String
        var startDate = row.getFieldValue(START_DATE_KEY) as Date
        var endDate = row.getFieldValue(END_DATE_KEY) as Date
        var classificationUnit = RatingUtil_ACC.findClassificationUnit(cuCode, startDate, endDate)
        if(classificationUnit == null) {
          _errorCollector.addRowError(factorRow, RateTableErrorType.TC_INVALIDVALUE)
        }
        row.setFieldValue(CLASSIFICATION_UNIT_KEY, classificationUnit)
      }
    }
  }

  function persistModel() {
    if (not _model.areTableRowsEqual()) { //comparing if the current model is different from the original table rows stored in the database
      _versioner.updateVersion(_model)
      // update the rate data with the CU relationship
      updateModelWithCU()
      _model.persistModel()

      if (bundleHasRateFactorRowChange() and _initRateTableIsOwned) {
        RateTableModel.RateTable.LastTableRowEdit = DateUtil.currentDate()
      }
      _model.RateTable.Checksum = _model.calculateCheckSum()
    }

    if (_model.RateTable.Checksum == null) {  //for backwards compatibility where checksum was not originally set
      _model.RateTable.Checksum = _model.calculateCheckSum()
    }
  }

  function validateAndPersistRateTableModel() {
    validateModel()
    persistModel()
  }

  private function bundleHasRateFactorRowChange(): boolean {
    var bundle = gw.transaction.Transaction.getCurrent()
    var entityType = RateTableModel.RateTableDefinition.FactorRowEntity

    return bundle.InsertedBeans.hasMatch(\b -> TypeUtil.isNominallyOrStructurallyAssignable(entityType, typeof b))
        or bundle.RemovedBeans.hasMatch(\b -> TypeUtil.isNominallyOrStructurallyAssignable(entityType, typeof b))
        or bundle.UpdatedBeans.hasMatch(\b -> TypeUtil.isNominallyOrStructurallyAssignable(entityType, typeof b))
  }

  function removeVisible(): boolean {
    return not _model.FactorRows.Empty
  }

  function startInEditMode(): boolean {
    return _populator.startInEditMode()
  }

  function resetValueProviderFactory(repo: RateTableCellValueProviderFactory) {
    // The excel populator populates the value provider cache with entities from the wrong TX,
    // in this case just clear out the cache
    if (_populator.startInEditMode()) {
      repo.ValueProviders.clear()
    }
  }

  function editable(): boolean {
    return RateTableModel.RateBook.Status == RateBookStatus.TC_DRAFT
  }

  function refresh() {
    _populator.refresh(_model)
  }

  function getValueProviderFor(cell: RateTableCell<Comparable>): RateTableCellValueProvider {
    return _model.ValueProviderRepository.getValueProviderFor(cell)
  }

  function getRowErrors(row: RateTableRow): List<RateTableRowError> {
    return _errorCollector.getRowErrors(row)
  }

  function createAndPopulateRateTableModel(rateTable: RateTable): String {
    var valueProviderFactory = new RateTableCellValueProviderFactory()
    createModel(rateTable, valueProviderFactory)
    return populateRateTableModel()
  }

  function hasErrors(): boolean {
    return _errorCollector.getErrorCount() > 0
  }

  static function createExcelBasedController(populator: RateTablePopulator): RateTableFactorListController_ACC {
    return new RateTableFactorListController_ACC(populator, new ExcelVersioning(), ImportPersistenceAdapter.Type)
  }

  static function createDatabaseBasedController(): RateTableFactorListController_ACC {
    return new RateTableFactorListController_ACC(new DatabasePopulator(), new DatabaseVersioning(), EntityPersistenceAdapter.Type)
  }

  static function validateStructureAndGetController(rateTable: RateTable, sheet: XSSFSheet): RateTableFactorListController_ACC {
    var sheetPopulator = new ExcelSheetPopulator(sheet)
    if (!sheetPopulator.isCompatibleTable(rateTable)) {
      throw new DisplayableException(DisplayKey.get("Web.Rating.Errors.IncompatibleExcelFile", rateTable.Definition.TableName))
    }
    return RateTableFactorListController_ACC.createExcelBasedController(sheetPopulator)
  }

}