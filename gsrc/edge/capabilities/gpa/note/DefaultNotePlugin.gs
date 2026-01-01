package edge.capabilities.gpa.note

uses edge.capabilities.gpa.note.dto.NoteDTO
uses java.lang.IllegalArgumentException
uses edge.di.annotations.ForAllGwNodes
uses gw.api.database.Query
uses edge.PlatformSupport.Bundle

class DefaultNotePlugin implements INotePlugin {

  @ForAllGwNodes
  construct(){}

  override function toDTO(aNote: Note): NoteDTO {
    final var dto = new NoteDTO()
    fillBaseProperties(dto, aNote)

    return dto
  }

  override function toDTOArray(notes: Note[]): NoteDTO[] {
    if(notes != null || notes.HasElements){
      return notes.map( \ aNote -> toDTO(aNote))
    }

    return new NoteDTO[]{}
  }

  override function updateNote(aNote: Note, dto: NoteDTO) {
    updateBaseProperties(aNote, dto)
  }

  override function createNoteForAccount(anAccount: Account, dto: NoteDTO): Note {
    if(anAccount == null){
      throw new IllegalArgumentException("Account cannot be null.")
    }

    final var newNote = anAccount.newNote()
    newNote.Author = User.util.CurrentUser
    updateNote(newNote, dto)

    return newNote
  }

  override function getNotesForAccount(anAccount: Account): NoteDTO[] {
    if(anAccount == null){
      throw new IllegalArgumentException("Account cannot be null.")
    }

    return toDTOArray(anAccount.Notes.where( \ aNote -> perm.Note.view(aNote)))
  }

  override function createNoteForPolicy(aPolicy: Policy, dto: NoteDTO): Note {
    if(aPolicy == null){
      throw new IllegalArgumentException("Policy cannot be null.")
    }

    final var newNote = aPolicy.newNote()
    newNote.Author = User.util.CurrentUser
    updateNote(newNote, dto)

    return newNote
  }

  override function getNotesForPolicy(aPolicy: Policy): NoteDTO[] {
    if(aPolicy == null){
      throw new IllegalArgumentException("Policy cannot be null.")
    }

    final var notes = Bundle.resolveInTransaction( \ bundle -> {
          bundle.add(aPolicy)
          return aPolicy.getNotes(null).where( \ aNote -> perm.Note.view(aNote)).toTypedArray()
    })

    return toDTOArray(notes)
  }

  override function createNoteForActivity(anActivity: Activity, dto: NoteDTO): Note {
    if(anActivity == null){
      throw new IllegalArgumentException("Activity cannot be null.")
    }
    final var newNote = anActivity.newNote()
    newNote.Author = User.util.CurrentUser
    updateNote(newNote, dto)

    return newNote
  }

  override function getNotesForActivity(anActivity: Activity): NoteDTO[] {
    if(anActivity == null){
      throw new IllegalArgumentException("Activity cannot be null.")
    }
    final var notes = Query.make(Note).compare("Activity", Equals, anActivity).select().toTypedArray()

    return toDTOArray(notes.where( \ aNote -> perm.Note.view(aNote)))
  }

  override function createNoteForJob(aJob: Job, dto: NoteDTO): Note {
    if(aJob == null){
      throw new IllegalArgumentException("Job cannot be null.")
    }
    final var note = aJob.newNote()
    note.Author = User.util.CurrentUser
    updateNote(note, dto)

    return note
  }

  override function getNotesForJob(aJob: Job): NoteDTO[] {
    if(aJob == null){
      throw new IllegalArgumentException("Job cannot be null.")
    }

    final var notes = aJob.Notes.where( \ note -> perm.Note.view(note))

    return toDTOArray(notes)
  }

  public static function fillBaseProperties(dto : NoteDTO, aNote : Note){
    dto.AuthorName = aNote.Author.DisplayName
    dto.CreatedDate = aNote.CreateTime
    dto.Subject = aNote.Subject
    dto.Body = aNote.Body
    dto.Topic = aNote.Topic
    dto.PublicID = aNote.PublicID
  }

  public static function updateBaseProperties(aNote: Note, dto: NoteDTO) {
    aNote.Body = dto.Body
    aNote.Subject = dto.Subject
    aNote.Topic = dto.Topic != null ? dto.Topic : NoteTopicType.TC_GENERAL
  }

}
