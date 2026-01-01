package edge.capabilities.quote.questionset.util

uses edge.capabilities.quote.questionset.dto.QuestionSetDTO
uses edge.capabilities.quote.questionset.dto.QuestionDTO
uses edge.capabilities.quote.questionset.dto.QuestionChoiceDTO
uses java.lang.UnsupportedOperationException
uses gw.api.productmodel.QuestionSet
uses gw.api.productmodel.Question
uses gw.api.productmodel.QuestionChoice
uses java.util.Map
uses java.lang.IllegalArgumentException
uses edge.util.MapUtil
uses java.util.Arrays
uses edge.PlatformSupport.Logger
uses edge.capabilities.quote.questionset.dto.QuestionFilterDTO
uses gw.api.productmodel.QuestionFilter
uses edge.capabilities.quote.questionset.dto.QuestionSetAnswersDTO
uses java.util.HashMap

/*
    File is not cross-platform because of the following inconsistencies between XCenters code:
    1) AnswerContainer was moved between packages
    2) QuestionChoice.getByCode and QuestionChoiceLookup.getByCode usage in different versions
*/

final class QuestionSetUtil {

  private static final var LOGGER = new Logger(QuestionSetUtil.Type.QName)

  private construct() {
    throw new UnsupportedOperationException()
  }

  /**
   * Converts question set to DTO.
   */
  @Param("qs", "Question set to convert")
  @Param("context", "Answer context. Can be null")
  public static function toDTO(qs : QuestionSet[], context : AnswerContainer) : QuestionSetDTO[] {
    return qs.map(\ q ->toDTO(q, context))
  }

  /**
   * Converts question set to DTO.
   */
  @Param("qs", "Question set to convert")
  @Param("context", "Answer context. Can be null")
  public static function toDTO(qs : QuestionSet, context : AnswerContainer) : QuestionSetDTO {
    final var res = new QuestionSetDTO()
    res.Code = qs.CodeIdentifier
    res.DisplayKey = "questionkey.QuestionSet_" + qs.CodeIdentifier + ".Name"
    res.OrderedQuestions = qs.OrderedQuestions.mapWithIndex(\ q, i -> toDTO(q, i, qs.OrderedQuestions, context))

    return res
  }

  /**
   * Converts question set to DTO.
   */
  @Param("qs", "Question set to convert")
  @Param("context", "Answer context. Can be null")
  public static function toAnswersDTO(qs : QuestionSet[], context : AnswerContainer) : QuestionSetAnswersDTO[] {
    return qs.map(\ q ->toAnswersDTO(q, context))
  }

  /**
   * Converts question set to DTO.
   */
  @Param("qs", "Question set to convert")
  @Param("context", "Answer context. Can be null")
  public static function toAnswersDTO(qs : QuestionSet, context : AnswerContainer) : QuestionSetAnswersDTO {
    final var res = new QuestionSetAnswersDTO()
    res.Code = qs.CodeIdentifier
    res.Answers = MapUtil.groupUnique(Arrays.asList(qs.OrderedQuestions.where( \ q -> q.isQuestionAvailable(context))), \ i -> i.CodeIdentifier, \ i -> getEffectiveAnswer(i, context)) as HashMap<String, String>
    return res
  }


  /**
   * Updates target with the specified question set.
   */
  @Param("target", "Item to set answer on")
  @Param("q", "Question sets to update")
  @Param("answers", "QuestionSetAnswers -> set answers map, may be not applicable for current question set")
  public static function update(target : AnswerContainer, q : QuestionSet[], sets : QuestionSetAnswersDTO[]) {
    if (sets == null) {
      return
    }
    update(target, q, MapUtil.groupUnique(Arrays.asList(sets), \ i -> i.Code, \ i -> i))
  }


  /**
   * Updates target with the specified question set.
   */
  @Param("target", "Item to set answer on")
  @Param("q", "Question sets to update")
  @Param("answers", "QuestionSetAnswers -> set answers map, may be not applicable for current question set")
  public static function update(target : AnswerContainer, q : QuestionSet[], answers : Map<String, QuestionSetAnswersDTO>) {
    q.each(\qs -> update(target, qs, answers))
  }



  /**
   * Updates target with the specified question set.
   */
  @Param("target", "Item to set answer on")
  @Param("q", "Question to update")
  @Param("answers", "QuestionSet -> set answers map, may be not applicable for current question set")
  public static function update(target : AnswerContainer, q : QuestionSet, answers : Map<String, QuestionSetAnswersDTO>) {
    final var answersForQS = answers.get(q.CodeIdentifier)
    if (answersForQS == null) {
      return
    }

    q.OrderedQuestions.each(\ question -> update(target, question, answersForQS.Answers))
  }


  /**
   * Updates a question by choosing an applicable question. Ignores questions if no
   * value is set.
   */
  @Param("target", "Item to set answer on")
  @Param("q", "Question to update")
  @Param("answers", "Question -> answer map, may be not applicable for current question")
  public static function update(target : AnswerContainer, q : Question, answers : Map<String, String>)  {
    final var choice = answers.get(q.CodeIdentifier)
    if (choice == null) {
      return
    }

    var answer = target.getAnswer(q)
    if(answer == null) {
          answer = target.createAnswer(q)
    }
    switch (q.QuestionType) {
      case typekey.QuestionType.TC_BOOLEAN :
        answer.BooleanAnswer = choice == "true"
        return
      case typekey.QuestionType.TC_CHOICE:
        final var code = q.Choices.firstWhere(\ q2 -> q2.ChoiceCode == choice)
        if (code == null) {
          throw new IllegalArgumentException("Unsupported answer code " + choice + " for question " + q.PublicID)
        }
        answer.ChoiceAnswer = code
        return
      case typekey.QuestionType.TC_STRING:
        answer.TextAnswer = choice
        return
      default:
        LOGGER.logError("Got answer for unsupported question type " + q.QuestionType)
        throw new IllegalArgumentException("Attempt to set answer for the unsupported question type")
    }
  }

  /**
   * Converts question to DTO.
   */
  public static function toDTO(q : Question, idx : int, possibleDeps : Question[], context : AnswerContainer) : QuestionDTO {
    final var res = new QuestionDTO()

    res.Order = idx
    res.Code = q.CodeIdentifier
    res.DisplayKey = "questionkey.Question_"+q.QuestionSet.CodeIdentifier+"."+q.CodeIdentifier+".Text"

    // This is inverted,  all the basic questions are set to false internally in our sample qeustion set, and the one question that is filtered/dependent is set to true
    // We may need to negate this value for the frontend (any dependant questions should be required transitively), but technically, these being set to false is the opposite of what we want for front end validation
    res.Required = q.Required
    res.QuestionType = q.QuestionType

    res.Filters = q.Filters.map(\f -> toDTO(f)).toTypedArray()
    res.Choices = choicesOf(q)

    return res
  }


  private static function toDTO(filter : QuestionFilter) : QuestionFilterDTO {
    final var res = new QuestionFilterDTO()
    res.QuestionCode = filter.FilterQuestion.CodeIdentifier
    res.Answer = filter.Answer
    return res
  }


  /**
   * Calculates an effective answer and encodes it in the string form.
   */
  public static function getEffectiveAnswer(q : Question, ctx : AnswerContainer) : String {
    if (ctx == null) {
      return q.DefaultAnswer
    }

    final var activeAnswer = ctx.getAnswer(q)
    if (activeAnswer == null) {
      return q.DefaultAnswer
    }

    switch (q.QuestionType) {
      case typekey.QuestionType.TC_BOOLEAN :
        if (activeAnswer.BooleanAnswer != null) {
          return activeAnswer.BooleanAnswer.toString()
        } else {
          return null
        }
      case typekey.QuestionType.TC_CHOICE:
        return activeAnswer.ChoiceAnswer.ChoiceCode
      case typekey.QuestionType.TC_STRING:
        return activeAnswer.TextAnswer
      default:
        LOGGER.logError("Unsupported question type " + q.QuestionType)
        return null
    }
  }


  /**
   * Extracts question sets from the DTO.
   */
  public static function choicesOf(q : Question) : QuestionChoiceDTO[] {
    //booleans do not have choices defined this way it seems
    if(q.QuestionType == QuestionType.TC_BOOLEAN && q.Choices.Count<1) {
      var a = new QuestionChoiceDTO()
      a.DisplayKey = "displaykey.Java.NameValueView.Boolean.False"
      a.ChoiceCode = "false"
      var b = new QuestionChoiceDTO()
      b.DisplayKey = "displaykey.Java.NameValueView.Boolean.True"
      b.ChoiceCode = "true"
      return {b, a}
    }

    return q.Choices.map(\c -> toDTO(c)).toTypedArray()
  }


  /**
   * Converts question choice to the DTO.
   */
  public static function toDTO(c : QuestionChoice) : QuestionChoiceDTO {
    final var res = new QuestionChoiceDTO()
    res.ChoiceCode = c.ChoiceCode
    res.DisplayKey = "questionkey.QuestionChoice_" + c.CodeIdentifier + ".Name"
    return res
  }

  /*
   * ---------------
   * Helper functions to isolate API changes for QuestionSet retrieval
   * ---------------
   */

  static function getByCode(code:String) : QuestionSet{
    return gw.api.productmodel.QuestionSetLookup.getByCodeIdentifier(code)
  }

  static function translateChoice(code:String):String {
    var split = code.split("\\.")
    return gw.api.productmodel.QuestionChoiceLookup.getByCodeIdentifier(split[0])?[split[1]]?.toString()
  }

  static function translateQuestion(code:String):String {
    var split = code.split("\\.")
    var qs = QuestionSetUtil.getByCode(split[0])
    return qs?.getQuestionByCodeIdentifier(split[1])?[split[2]]?.toString()
  }


  static function translateQuestionSet(code:String) : String {
    var split = code.split("\\.")
    return QuestionSetUtil.getByCode(split[0])?[split[1]]?.toString()
  }

}