package nz.co.acc.lob.common.excel

/**
 * Interface for the raw parsed spreadsheet row data to determine its condition.
 */
interface ExcelRow {

  public function rowEmpty() : boolean

  public function anyDataMissing() : boolean
}