# Generate n8n encryption key
$bytes = New-Object byte[] 16
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
$rng.GetBytes($bytes)
$encryptionKey = [System.BitConverter]::ToString($bytes).Replace('-', '').ToLower()

Write-Host "Generated n8n encryption key: $encryptionKey" -ForegroundColor Green
Write-Host ""
Write-Host "Copy this key and replace 'generate_a_32_character_key_here' in your .env.n8n file" -ForegroundColor Yellow 