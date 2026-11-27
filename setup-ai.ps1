# Adds your AI key to api\.env so the Pearl Travel assistant uses a real language model (RAG).
# Usage:  powershell -ExecutionPolicy Bypass -File .\setup-ai.ps1
# The key is typed here (hidden) and saved only in api\.env on this computer. It is never sent to the web app or to GitHub.
$ErrorActionPreference = 'Stop'
if (-not (Test-Path api\.env)) { Write-Host "Run setup.ps1 first (api\.env is missing)." -ForegroundColor Red; exit 1 }

Write-Host "Which AI provider is your key from?"
Write-Host "  1) Google Gemini (free tier available at aistudio.google.com)"
Write-Host "  2) OpenAI"
Write-Host "  3) Other OpenAI-compatible service"
$c = Read-Host "Choose 1, 2 or 3"
switch ($c) {
  '1' { $base = 'https://generativelanguage.googleapis.com/v1beta/openai'; $model = 'gemini-2.5-flash'; $emb = 'gemini-embedding-001' }
  '2' { $base = 'https://api.openai.com/v1'; $model = 'gpt-4o-mini'; $emb = 'text-embedding-3-small' }
  default { $base = Read-Host "Base URL (ending in /v1)"; $model = Read-Host "Chat model name"; $emb = Read-Host "Embedding model name" }
}
$sec = Read-Host "Paste your API key (hidden)" -AsSecureString
$key = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
if (-not $key) { Write-Host "No key entered." -ForegroundColor Red; exit 1 }

$t = Get-Content api\.env -Raw
function SetVar($text, $name, $value) {
  if ($text -match "(?m)^$name=") { return ($text -replace "(?m)^$name=.*$", "$name=$value") }
  return ($text.TrimEnd() + "`r`n$name=$value`r`n")
}
$t = SetVar $t 'LLM_API_KEY' $key
$t = SetVar $t 'LLM_BASE_URL' $base
$t = SetVar $t 'LLM_MODEL' $model
$t = SetVar $t 'EMBEDDING_MODEL' $emb
Set-Content -Path api\.env -Value $t -Encoding UTF8
Write-Host "Saved. Restart the app (npm run dev:full). The guidance is indexed automatically on start." -ForegroundColor Green
Write-Host "Then ask the assistant a question; answers will show their sources."
