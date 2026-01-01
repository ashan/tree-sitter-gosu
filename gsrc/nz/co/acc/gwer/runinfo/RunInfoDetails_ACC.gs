package nz.co.acc.gwer.runinfo

class RunInfoDetails_ACC {
  private var _runID : Long as RunID
  private var _requestTypeID : Long as RequestTypeID
  private var _requestTypeDesc : String as RequestTypeDesc
  private var _runDateTime : Date as RunDateTime
  private var _requestID : Long as RequestID
  private var _RecordCreated : Date as RecordCreated
  private var _RecordCreatedBy : String as RecordCreatedBy
  private var _runStatus : String as RunStatus
  private var _totalResults : Long as TotalResults
  private var _requiresManualCalc : Long as RequiresManualCalc
  private var _pendingManualCalc : Long as PendingManualCalc
  private var _extractID : Long as ExtractID
  private var _extractStatus : String as ExtractStatus
}