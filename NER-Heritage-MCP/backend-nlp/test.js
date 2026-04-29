import nlp from "compromise";
import { validateTextInput, scrubPII } from "../backend-safety/validator.js";
import fs from "fs";

const text = "I visited the Taj Mahal in India last summer. Contact me at john.doe@example.com or 123-456-7890.";

console.log("--- NER Heritage Logic Test ---");
console.log("Original Text:", text);

const validation = validateTextInput(text);
console.log("Validation:", validation);

const scrubbed = scrubPII(text);
console.log("Scrubbed Text:", scrubbed);

const doc = nlp(scrubbed);
const people = doc.people().out("array");
const places = doc.places().out("array");
const dates = doc.match('#Date').out("array"); // Correct way in core compromise

console.log("Entities Found:", { people, places, dates });

const sites = JSON.parse(fs.readFileSync("../data-stores/heritage_sites.json", "utf8"));
const matched = sites.filter(site => 
  places.some(p => p.toLowerCase().includes(site.name.toLowerCase()) || 
                  site.name.toLowerCase().includes(p.toLowerCase()))
);

console.log("Matched Heritage Sites:", matched);
