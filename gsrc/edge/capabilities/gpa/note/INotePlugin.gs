package edge.capabilities.gpa.note

uses edge.capabilities.gpa.note.dto.NoteDTO

interface INotePlugin {

  public function toDTO(aNote : Note) : NoteDTO
  public function toDTOArray(notes : Note[]) : NoteDTO[]
  public function updateNote(aNote : Note, dto : NoteDTO)
  public function createNoteForAccount(anAccount : Account, dto : NoteDTO) : Note
  public function getNotesForAccount(anAccount : Account) : NoteDTO[]
  public function createNoteForPolicy(aPolicy : Policy, dto : NoteDTO) : Note
  public function getNotesForPolicy(aPolicy : Policy) : NoteDTO[]
  public function createNoteForActivity(anActivity : Activity, dto : NoteDTO) : Note
  public function getNotesForActivity(anActivity : Activity) : NoteDTO[]
  public function createNoteForJob(aJob : Job, dto : NoteDTO) : Note
  public function getNotesForJob(aJob : Job) : NoteDTO[]
}
