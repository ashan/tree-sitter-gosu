package nz.co.acc.plm.integration.instruction.ui

uses gw.api.database.IQueryBeanResult
uses nz.co.acc.plm.integration.ir.ui.IRSequencerAdminUIHelper

/**
 * UI helper class for Screen [SequencedWorkers_ACCPanelSet].
 */
class SequencedWorkersUIHelper {

  private var _sequencerUIHelper : IRSequencerAdminUIHelper as SequencerUIHelper = null

  private var _instructionUIHelper : InstructionListUIHelper as InstructionUIHelper = null

  private var _sequencedWorkers : IQueryBeanResult<InstructionWorker_ACC> as SequencedWorkers = null

  private var _selectedIRSequencer : IRSequencer_ACC as SelectedIRSequencer

  /**
   * Constructor
   */
  public construct(sequencerUIHelper : IRSequencerAdminUIHelper, sequencer : IRSequencer_ACC) {
    _sequencerUIHelper = sequencerUIHelper
    _selectedIRSequencer = sequencer
    _sequencedWorkers = sequencer.OrderedWorkers
  }

  /**
   * Constructor
   */
  public construct(instructionUIHelper : InstructionListUIHelper) {
    _instructionUIHelper = instructionUIHelper
    _sequencedWorkers = instructionUIHelper.SelectedWorkers
  }

  /**
   * Need to show "SequencerKey" Column
   */
  public function showSequencerKey() : boolean {
    if (_sequencerUIHelper != null) {
      return false
    }
    return true
  }

  /**
   * Need to show "Instruction" Column Link
   */
  public function showInstructionLink() : boolean {
    if (_instructionUIHelper != null) {
      return false
    }
    return true
  }

  /**
   * Get the icon to show if the rec is completed
   */
  public static function getIcon(rec : InstructionWorker_ACC): String {
    if (rec.Completed) {
      return "profiler_green.png"
    } else if (rec.canBeSkipped()) {
      return "profiler_red.png"
    } else {
      return "trans_pixel.png"
    }
  }
}