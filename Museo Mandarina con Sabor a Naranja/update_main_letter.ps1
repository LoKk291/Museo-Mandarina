$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\src\main.js"
$content = Get-Content -Path $path -Raw

# 1. Fix Vase Break Method Call (break -> breakVase)
if ($content -match "vase\.break\(\)") {
    $content = $content -replace "vase\.break\(\)", "vase.breakVase()"
    Write-Host "Fixed vase.break() -> vase.breakVase()"
}

# 2. Add Interaction Check (checkInteraction)
# Search for the vase block in checkInteraction.
$interactionSearch = "} else if \(hitObject\.userData\.type === 'breakable-vase'\) \{\s*interactionMsg\.textContent = .*?;\s*interactionMsg\.style\.display = 'block';\s*\}"
# This regex is tricky with whitespace. Let's use exact string if possible, or simpler regex.

# We know the specific lines from previous view:
# } else if (hitObject.userData.type === 'breakable-vase') {
#    interactionMsg.textContent = "Click para romper jarrón";
#    interactionMsg.style.display = 'block';
# }

# We will try to match this block.
$vaseBlockRaw = "} else if (hitObject.userData.type === 'breakable-vase') {
            interactionMsg.textContent = ""Click para romper jarrón"";
            interactionMsg.style.display = 'block';
        }"
# Normalize line endings
$normalizedContent = $content -replace "`r`n", "`n"
$normalizedVaseBlock = $vaseBlockRaw -replace "`r`n", "`n"

# But spaces might differ.
# Let's simple search for the identifying line and insert AFTER the closing brace of that block.
$identifyingLine = "interactionMsg.textContent = `"Click para romper jarrón`";"
$idx = $content.IndexOf($identifyingLine)

if ($idx -ne -1) {
    # Find the closing brace of this block.
    # It follows the display = 'block'; line.
    $displayLine = "interactionMsg.style.display = 'block';"
    $displayIdx = $content.IndexOf($displayLine, $idx)
    
    if ($displayIdx -ne -1) {
         # Find the closing '}'
         $braceIdx = $content.IndexOf("}", $displayIdx)
         
         if ($braceIdx -ne -1) {
             # Check if we already added it?
             if ($content.Substring($braceIdx, 100) -notmatch "minecraft-block") {
                 $insertText = " } else if (hitObject.userData.type === 'minecraft-block') {
            interactionMsg.textContent = `"Click para leer carta`";
            interactionMsg.style.display = 'block';"
                 
                 # We insert BEFORE the closing brace? No, we are adding an 'else if' chain.
                 # Wait, existing structure is:
                 # } else if (...) { ... }
                 # So we append AFTER the closing brace of the vase block.
                 # Actually, the vase block ends with '}', and then usually followed by 'else' or end of function.
                 
                 # Let's replace the block's content + closing brace with block + new block.
                 # Easier: replace the entire matched block.
                 
                 # Let's construct a reliable replacement logic.
                 # "interactionMsg.style.display = 'block';" inside vase block.
                 # followed by \s*}
                 
                 # Let's try replacing the specific string sequence.
                 $targetStr = "interactionMsg.textContent = `"Click para romper jarrón`";`r`n            interactionMsg.style.display = 'block';`r`n        }"
                 # Powershell regex replace.
                 # Use [regex]::Escape to be safe? No, string replace.
                 
                 # Since line endings might be issue, let's just use regex.
                 
                 $addition = "
        } else if (hitObject.userData.type === 'minecraft-block') {
            interactionMsg.textContent = `"Click para leer carta`";
            interactionMsg.style.display = 'block';
        }"
                 
                 # We replace the CLOSING BRACE of the vase block in checkInteraction.
                 # Identifying feature: It is followed by "else {" (default case) or "return".
                 # Actually typically "else {" or another "else if".
                 
                 # Unique identifier: textContent = "Click para romper jarrón"
                 $pattern = "(interactionMsg\.textContent = ""Click para romper jarrón"";[\s\S]*?\}[\s\S]*?)(else \{|return)"
                 # This matches the block until `else {` or `return`.
                 # We want to insert before that `else`.
                 
                 # Simpler: Just searching for the specific line and injecting after it.
                 # Locate: interactionMsg.textContent = "Click para romper jarrón";
                 # Skip to next }
                 # Insert code.
             }
         }
    }
}

# 3. Update showLetter signature
$content = $content -replace "function showLetter\(title, content, isSystem = false\) \{", "function showLetter(title, content, isSystem = false, customClass = null) {"

# 4. Update showLetter logic
# We replace the whole style block.
$styleBlockRegex = "if \(contentBox\) \{\s*if \(isSystem\) \{\s*contentBox\.classList\.add\('system-message'\);\s*\} else \{\s*contentBox\.classList\.remove\('system-message'\);\s*\}\s*\}"

$newStyleBlock = "if (contentBox) {
        contentBox.classList.remove('system-message');
        contentBox.classList.remove('special-letter');
        
        if (isSystem) {
            contentBox.classList.add('system-message');
        }
        if (customClass) {
            contentBox.classList.add(customClass);
        }
    }"

$content = [regex]::Replace($content, $styleBlockRegex, $newStyleBlock)

# 5. Add Click Handler
# We look for "soundManager.play('vase_break');"
# Then find the closing brace of that block.
# Then append.

$clickMarker = "soundManager.play('vase_break');"
$markerIdx = $content.IndexOf($clickMarker)

if ($markerIdx -ne -1) {
    # Find next splice
    $spliceMarker = "world.interactables.splice(idx, 1);"
    $spliceIdx = $content.IndexOf($spliceMarker, $markerIdx)
    
    if ($spliceIdx -ne -1) {
        $closeBraceIdx = $content.IndexOf("}", $spliceIdx)
        if ($closeBraceIdx -ne -1) {
            # Check if already added
            $snippet = $content.Substring($closeBraceIdx, 500)
            if ($snippet -notmatch "minecraft-block") {
                 $newHandler = " else if (hitObject.userData.type === 'minecraft-block') {
            soundManager.play('click');
            const title = hitObject.userData.blockId === 'furnace' ? 'Horno' : 'Mesa de Trabajo';
            // Placeholder text
            const content = `"Una nota antigua yace aquí, escrita con una vieja máquina de escribir...`"; 
            showLetter(title, content, false, 'special-letter');
        }"
                 $content = $content.Insert($closeBraceIdx + 1, $newHandler)
                 Write-Host "Added minecraft click handler"
            }
        }
    }
}

# Redo step 2 with simple text replace since regex was annoying
# CheckInteraction update
$targetCI = "interactionMsg.textContent = `"Click para romper jarrón`";"
$idxCI = $content.IndexOf($targetCI)
if ($idxCI -ne -1) {
    # Find next }
    $endBlockIdx = $content.IndexOf("}", $idxCI)
    if ($endBlockIdx -ne -1) {
        # Verify not done
         $snippet = $content.Substring($endBlockIdx, 200)
         if ($snippet -notmatch "minecraft-block") {
             $insert = " else if (hitObject.userData.type === 'minecraft-block') {
            interactionMsg.textContent = `"Click para leer carta`";
            interactionMsg.style.display = 'block';
        }"
             $content = $content.Insert($endBlockIdx + 1, $insert)
             Write-Host "Added minecraft checkInteraction"
         }
    }
}

Set-Content -Path $path -Value $content
Write-Host "Done"
