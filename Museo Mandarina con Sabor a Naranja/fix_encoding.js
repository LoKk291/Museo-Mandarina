const fs = require('fs');
const path = 'src/Furniture.js';

try {
    // Try reading as utf8 first
    let content = fs.readFileSync(path, 'utf8');
    // If it worked, write it back to ensure BOM or weirdness is normalized
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully rewrote Furniture.js as UTF-8');
} catch (e) {
    console.error('Failed to read as default utf8, trying latin1', e);
    try {
        let content = fs.readFileSync(path, 'latin1'); // mixed?
        fs.writeFileSync(path, content, 'utf8');
        console.log('Converted from latin1 to utf8');
    } catch (e2) {
        console.error('Failed completely', e2);
    }
}
