Descriptor

The file the must be created to describe the data fix.

Sample execute-gosu.json Descriptor

{
    "code" : "00004",
    "description" : "Sample Test Gosu",
    "type" : "gosu_script",
    "order" : 1,
    "statements" : [
        {"mode": "script", "statement": "print(\"Hello 1\")"},
        {"mode": "script", "statement": "print(\"Hello 2\")"},
        {"mode": "file", "statement": "gosu_script.gsp"}
    ]
}

Sample gosu_script.gsp Gosu Script

print("File 1")

Directory to Structure

The upgrade-scripts directory will be the one that holds all the descriptors grouped by extension version
(i.e. a directory that matches the extension version):

<GUIDEWIRE_DIR>\modules\configuration\etc\upgrade-scripts\<EXT_VERSION>\

Example

C:\Guidewire\PolicyCenter\modules\configuration\etc\upgrade-scripts\500\

File Mode

If the mode specified in the statement description is file the location of the file is a sub-directory the
corresponds to the type field.

Example using execute-sql.json descriptor above:

{"mode": "file", "statement": "gosu_script.gsp"}

The gosu_script.gsp must be in the following directory:

C:\Guidewire\PolicyCenter\modules\configuration\etc\upgrade-scripts\500\gosu_script\

Supported Types

* Raw SQL Syntax (sql_script)
* Gosu Code (gosu_script)
* Empty Scripts File

AutoDatamodelUpgrade ScriptParameter

The interpration of the descriptor can be disabled by AutoDatamodelUpgrade ScriptParameter.

Possible Enhancements

* Ratebook Import
* Admin Upload Import
* Setup Activity Pattern
* Setup Role
* Update ScriptParameter