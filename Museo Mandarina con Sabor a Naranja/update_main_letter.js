const fs = require('fs');
const path = 'src/main.js';

try {
    let content = fs.readFileSync(path, 'utf8');

    // 1. Fix Vase Break Method Call (break -> breakVase)
    if (content.indexOf('vase.break()') !== -1) {
        content = content.replace('vase.break()', 'vase.breakVase()');
        console.log("Fixed vase.break() -> vase.breakVase()");
    }

    // 2. Add Interaction Check
    // We target the vase check block in checkInteraction to append our new block.
    // Use a unique string to identify the block in checkInteraction.
    // It's likely the first occurrence of "breakable-vase" logic.
    const interactionVaseBlock = `} else if (hitObject.userData.type === 'breakable-vase') {
            interactionMsg.textContent = "Click para romper jarrón";
            interactionMsg.style.display = 'block';`;

    const interactionNewBlock = `} else if (hitObject.userData.type === 'breakable-vase') {
            interactionMsg.textContent = "Click para romper jarrón";
            interactionMsg.style.display = 'block';
        } else if (hitObject.userData.type === 'minecraft-block') {
            interactionMsg.textContent = "Click para leer carta";
            interactionMsg.style.display = 'block';`;

    // We start searching from the beginning.
    let indexInteraction = content.indexOf(interactionVaseBlock);
    if (indexInteraction !== -1) {
        // Double check this is indeed checkInteraction (it should be cleaner/shorter than click handler)
        // Click handler has soundManager calls and splicing interactables.
        // checkInteraction block shown in previous tool output (Step 1103) matches exactly.
        content = content.replace(interactionVaseBlock, interactionNewBlock);
        console.log("Added minecraft-block to checkInteraction");
    } else {
        console.warn("Could not find checkInteraction vase block!");
    }

    // 3. Update showLetter signature
    const oldSig = "function showLetter(title, content, isSystem = false) {";
    const newSig = "function showLetter(title, content, isSystem = false, customClass = null) {";
    if (content.indexOf(oldSig) !== -1) {
        content = content.replace(oldSig, newSig);
        console.log("Updated showLetter signature");
    }

    // 4. Update showLetter logic to handle customClass
    // We look for where contentBox is defined.
    const contentBoxDef = "const contentBox = document.querySelector('.letter-content');";
    const contentBoxNewLogic = `const contentBox = document.querySelector('.letter-content');
    if (contentBox) {
        contentBox.classList.remove('system-message');
        contentBox.classList.remove('special-letter');
        if (customClass) contentBox.classList.add(customClass);
    }`;

    // We need to be careful not to break the `if (isSystem)` check that follows.
    // Original:
    /*
    310:    if (contentBox) {
    311:        if (isSystem) {
    312:            contentBox.classList.add('system-message');
    313:        } else {
    314:            contentBox.classList.remove('system-message');
    315:        }
    316:    }
    */
    // I'll replace that whole block if I can match it.
    // whitespace might vary.
    // Regex to match the block:
    const styleBlockRegex = /if\s*\(contentBox\)\s*\{\s*if\s*\(isSystem\)\s*\{\s*contentBox\.classList\.add\('system-message'\);\s*\}\s*else\s*\{\s*contentBox\.classList\.remove\('system-message'\);\s*\}\s*\}/;

    if (styleBlockRegex.test(content)) {
        content = content.replace(styleBlockRegex, `if (contentBox) {
        contentBox.classList.remove('system-message');
        contentBox.classList.remove('special-letter');
        
        if (isSystem) {
            contentBox.classList.add('system-message');
        }
        if (customClass) {
            contentBox.classList.add(customClass);
        }
    }`);
        console.log("Updated showLetter style logic");
    } else {
        console.warn("Could not find showLetter style block to update!");
        // Fallback: Just insert simpler logic after contentBox definition?
        // But we need to clear classes.
        // Let's try to just insert the cleaner logic after definition and HOPE the subsequent logic doesn't mess it up? 
        // No, the subsequent logic removes/adds specifically.
    }

    // 5. Add Click Handler logic
    // We look for the vase block in click listener.
    // Identified by having "world.interactables.splice(idx, 1);"

    const clickVaseBlockStart = `} else if (hitObject.userData.type === 'breakable-vase') {`;
    // Since we already replaced the first occurrence (checkInteraction), the NEXT occurrence should be the click handler.
    // But string replace replaces only first occurrence if string provided. 
    // Wait, `replace(string, string)` replaces only first match.
    // So using the SAME search string `} else if (hitObject.userData.type === 'breakable-vase') {` works perfectly 
    // if the checkInteraction block text was identical.
    // BUT, `checkInteraction` block has:
    // interactionMsg.textContent = ...
    // Click handler has:
    // soundManager.play...

    // So checking for unique content inside is safer.

    // Search for the splce line to find the end of the vase block.
    const spliceLine = "if (idx > -1) world.interactables.splice(idx, 1);";
    const spliceIndex = content.indexOf(spliceLine);
    if (spliceIndex !== -1) {
        // We want to insert AFTER this block closes.
        // The block closes with `}` shortly after spliceLine.
        const closingBraceIndex = content.indexOf("}", spliceIndex);
        if (closingBraceIndex !== -1) {
            const insertPos = closingBraceIndex + 1;
            const newClickLogic = ` else if (hitObject.userData.type === 'minecraft-block') {
                soundManager.play('click');
                const title = hitObject.userData.blockId === 'furnace' ? 'Horno' : 'Mesa de Trabajo';
                const content = "Una nota antigua yace aquí, escrita con una vieja máquina de escribir..."; 
                showLetter(title, content, false, 'special-letter');
            }`;

            content = content.slice(0, insertPos) + newClickLogic + content.slice(insertPos);
            console.log("Added minecraft bound click handler");
        }
    } else {
        console.warn("Could not find click handler splice line!");
    }

    fs.writeFileSync(path, content);
    console.log("Done");

} catch (e) {
    console.error(e);
}
