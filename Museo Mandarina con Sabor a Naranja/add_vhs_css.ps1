$path = "c:\Users\david\OneDrive\Documentos\GitHub\Museo-Mandarina\Museo Mandarina con Sabor a Naranja\index.html"
$content = Get-Content -Path $path -Raw

# Find the closing </style> tag in <head> section and add VHS CSS before it
$marker = "        }
    </style>
</head>"

$vhsCSS = @"
        }

        /* VHS Selector Styles */
        #vhs-selector {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 5000;
        }

        .vhs-menu {
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
            padding: 40px;
            border-radius: 15px;
            border: 3px solid #FFD700;
            box-shadow: 0 10px 40px rgba(255, 215, 0, 0.3);
        }

        .vhs-menu h2 {
            color: #FFD700;
            text-align: center;
            margin-bottom: 30px;
            font-family: 'Courier New', monospace;
            text-transform: uppercase;
            letter-spacing: 3px;
        }

        .vhs-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }

        .vhs-item {
            background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
            border: 2px solid #555;
            border-radius: 10px;
            padding: 30px 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }

        .vhs-item:hover {
            border-color: #FFD700;
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(255, 215, 0, 0.5);
        }

        .vhs-label {
            color: #FFD700;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
        }

        #close-vhs-selector {
            width: 100%;
            padding: 15px;
            background: #8B0000;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: background 0.3s;
        }

        #close-vhs-selector:hover {
            background: #FF0000;
        }

        /* Cinema Controls */
        #cinema-controls {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 20px 30px;
            border-radius: 10px;
            border: 2px solid #FFD700;
            display: flex;
            gap: 20px;
            align-items: center;
            z-index: 4000;
        }

        #stop-cinema {
            padding: 10px 20px;
            background: #8B0000;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: background 0.3s;
        }

        #stop-cinema:hover {
            background: #FF0000;
        }

        .volume-control {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #FFD700;
            font-family: 'Courier New', monospace;
        }

        #cinema-volume {
            width: 150px;
            cursor: pointer;
        }
    </style>
</head>"@

$content = $content.Replace($marker, $vhsCSS)
Set-Content -Path $path -Value $content
Write-Host "Added VHS CSS styling"
