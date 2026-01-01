package edge.exception

enum ApplicationErrorCode {
  GW_SECURITY_ERROR(600),
  GW_DTO_VALIDATION_ERROR(601),
  GW_UNDERWRITING_ERROR(602),
  GW_ENTITY_NOT_FOUND_ERROR(603),
  GW_INVALID_SESSION(604),
  GW_ILLEGAL_STATE_ERROR(605),
  GW_DUPLICATE_ENTITY_ERROR(606),
  GW_SESSION_TIMEOUT(607),
  GW_ENTITY_VALIDATION_ERROR(608), // used in classes that extend IValidator
  GW_ENTITY_PERMISSION_ERROR(609),
  GW_ILLEGAL_CONTENTTYPE_ERROR(610),
  GW_BLOCK_QUOTE_UNDERWRITING_ERROR(611)

  private var _code : int

  private construct(errorCode : int) {
    _code = errorCode
  }

  public function getErrorCode() : int{
    return _code
  }
}
