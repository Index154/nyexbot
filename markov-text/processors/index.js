const { splitIntoSyllabes, removeUnwantedSyllabes } = require("./syllables");

const { splitIntoWords, removeUnwantedWords } = require("./words");

module.exports = {
  words: {
    split: splitIntoWords,
    clean: removeUnwantedWords
  },
  syllabes: {
    split: splitIntoSyllabes,
    clean: removeUnwantedSyllabes
  }
};