try {
    const Gosu = require('../');
    console.log("Successfully loaded Gosu language binding:");
    console.log(Gosu);

    const Parser = require('tree-sitter');
    const parser = new Parser();
    parser.setLanguage(Gosu);
    console.log("Parser initialized successfully.");

    const tree = parser.parse("var x = 1");
    console.log("Parsed tree root type:", tree.rootNode.type);

} catch (e) {
    console.error("Failed to load native binding:", e);
}
