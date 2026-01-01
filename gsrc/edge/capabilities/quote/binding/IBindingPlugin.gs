package edge.capabilities.quote.binding

uses edge.capabilities.quote.binding.dto.BindingDataDTO

/**
 * Policy (submission) binding plugin.
 */
interface IBindingPlugin {
  /**
   * Retrieves binding-related information from the submission. This
   * method may return <code>null</code> if submisson have no valid
   * binding-related information (i.e. it is in the draft state).
   */
  public function getBindingData(submission : Submission) : BindingDataDTO
  
  
  
  /**
   * Updates binding data on the submission. This method is called to
   * save "draft" data so <code>data</code> object may be not comlpete.
   */
  public function updateBindingData(submission : Submission, data : BindingDataDTO)
  
  
  
  /**
   * Updates the submission and prepares it to binding. <code>updateBindingData</code> is not called
   * before a call to <code>preBind</code>. So this method should update appropriate data.
   * However, this method may perform additional data validations because at this
   * moment <code>data</code> must me complete and usable for the binding.
   * <p><code>bind</code> would be called after this method but in another transaction bundle.
   */
  public function preBind(submission : Submission, data : BindingDataDTO)
  
  
  
  /**
   * Binds the submission. This method is always called after <code>preBind</code> but in 
   * another transaction bundle. Such behaviour allows implementers to save all user data
   * in pre-bind call and have them safe even if binding fails for some reason.
   */
  public function bind(submission : Submission, data : BindingDataDTO)
}
