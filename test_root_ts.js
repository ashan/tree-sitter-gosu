try {
    const Parser = require('tree-sitter');
    const parser = new Parser();
    console.log("Root tree-sitter init works.");

    const Gosu = require('./build/Release/tree_sitter_gosu_binding.node');
    console.log("Loaded binding.");

    parser.setLanguage(Gosu);
    console.log("setLanguage works!");

    const tree = parser.parse("var x = 1");
    console.log("Parse works! Root node type: " + tree.rootNode.type);

} catch (e) {
    console.error("Root tree-sitter failed:", e);
}
