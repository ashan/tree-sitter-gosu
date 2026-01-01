package nz.co.acc.gwer.suppressionlists

uses java.io.Serializable

class SuppressionListSearchCriteria_ACC implements Serializable{

  private var _businessGroupIdField : Long as BusinessGroupIdField

  private var _accPolicyIdField : String as AccPolicyIdField

  private var _levyNameField : String as LevyNameField

}