$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\index.html"
$content = Get-Content -Path $path -Raw

# Find where to insert VHS UI (after audio-controls div, before script tag)
$marker = "</div>
    <script>"

$vhsUI = @"
</div>

    <!-- VHS Selector UI -->
    <div id="vhs-selector" class="hidden">
        <div class="vhs-menu">
            <h2>Selecciona un VHS</h2>
            <div class="vhs-grid">
                <div class="vhs-item" data-video="1">
                    <div class="vhs-label">VHS 1</div>
                </div>
                <div class="vhs-item" data-video="2">
                    <div class="vhs-label">VHS 2</div>
                </div>
                <div class="vhs-item" data-video="3">
                    <div class="vhs-label">VHS 3</div>
                </div>
                <div class="vhs-item" data-video="4">
                    <div class="vhs-label">VHS 4</div>
                </div>
                <div class="vhs-item" data-video="5">
                    <div class="vhs-label">VHS 5</div>
                </div>
            </div>
            <button id="close-vhs-selector" class="close-btn">Cerrar</button>
        </div>
    </div>

    <!-- Cinema Video Player Controls -->
    <div id="cinema-controls" class="hidden">
        <button id="stop-cinema">⏹ STOP</button>
        <div class="volume-control">
            <label for="cinema-volume">VOL:</label>
            <input type="range" id="cinema-volume" min="0" max="100" value="50">
            <span id="cinema-volume-label">50%</span>
        </div>
    </div>

    <script>
"@

$content = $content.Replace($marker, $vhsUI)
Set-Content -Path $path -Value $content
Write-Host "Added VHS UI to index.html"
