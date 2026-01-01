package gw.rating.rtm.builders.scenario

uses gw.api.database.Query
uses gw.rating.rtm.RatingTestMethods
uses gw.rating.rtm.builders.RateTableArgumentSourceBuilder
uses gw.rating.rtm.builders.RateTableArgumentSourceSetBuilder
uses gw.rating.rtm.builders.RateTableBuilder
uses gw.rating.rtm.builders.RateTableDefinitionBuilder
uses gw.sampledata.tiny.TinySampleRatingData
uses gw.util.concurrent.LockingLazyVar

@Export
class GXRateTablesBuilder implements RatingTestMethods {
    public final static var GST_RATE_TABLE_CODE            : String  = "gst_rate_table"
    public final static var GST_RATE_TABLE_FACTOR          :   String  = "Factor"
    public final static var GST_RATE_TABLE_NAME            :   String  = "GSTRateTable"

    static var _GenericStateTaxParamSet : LockingLazyVar<CalcRoutineParameterSet> as GenericStateTaxParamSet = LockingLazyVar<CalcRoutineParameterSet>
        .make(\ -> {
          new TinySampleRatingData().load()
          return getCalcRoutineParameterSet("GenericStateTaxParamSet")
        })

    public static final var EXACT_MATCH_OP_DEF : RateTableMatchOpDefinition =
        Query.make(RateTableMatchOpDefinition).compare(RateTableMatchOpDefinition#OpCode, Equals, "ExactMatch").select().first() //can be duplicates in tests

    //----------------- GenericStateTaxTable -----------------//

    static property get GenericStateTaxTable() : RateTableBuilder {
      return new RateTableBuilder(GenericStateTaxTableDef)
    }

    static property get GenericStateTaxTableDef() : RateTableDefinition {
      return GenericStateTaxTableDefBuilder.createAndCommit()
    }

    static property get GenericStateTaxTableDefBuilder() : RateTableDefinitionBuilder {
      var argSrcBldr1 = new RateTableArgumentSourceBuilder()
          .withRoot(CalcRoutineParamName.TC_STATE)

      var paramBldr1 = getParam(10, "JURISDICTION", "str1")
          .withColumnLabel("Jurisdiction")
          .withValueProvider("gw.rating.rtm.valueprovider.TypeListValueProvider(typekey.Jurisdiction)")

      var matchOpBldr1 = getMatchOp(paramBldr1)
          .withRateTableArgumentSource(argSrcBldr1)
          .withMatchOpDefinition(EXACT_MATCH_OP_DEF)

      var argSrcSetBldr = new RateTableArgumentSourceSetBuilder()
          .withCode("DEFAULT")
          .withName("Default")
          .withCalcRoutineParamSet(GenericStateTaxParamSet.get())
          .addArgumentSource(argSrcBldr1)

      var defBldr = new RateTableDefinitionBuilder()
          .addArgumentSourceSet(argSrcSetBldr)
          .withCode(GST_RATE_TABLE_CODE)
          .named(GST_RATE_TABLE_NAME)
          .withPolicyLine(null)
          .addMatchOperation(matchOpBldr1)
          .addFactor(getFactor(GST_RATE_TABLE_FACTOR))

      return defBldr
    }


    private static function getCalcRoutineParameterSet(code : String) : CalcRoutineParameterSet {
      return Query<CalcRoutineParameterSet>.make(CalcRoutineParameterSet)
          .compare("Code", Equals, code)
          .select()
          .single()
    }
}