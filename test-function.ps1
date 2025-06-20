# PowerShell Test Script for Visa Function
# Run with: .\test-function.ps1

Write-Host "🧪 Testing Visa Automation Function" -ForegroundColor Green
Write-Host ""

# Get service role key from user
$serviceRoleKey = Read-Host "Enter your Supabase service role key"

if ([string]::IsNullOrEmpty($serviceRoleKey)) {
    Write-Host "❌ Service role key is required!" -ForegroundColor Red
    exit 1
}

# Test data
$testData = @{
    manual = $true
} | ConvertTo-Json

# Function URL
$functionUrl = "https://tndfjsjemqjgagtsqudr.supabase.co/functions/v1/send-visa-notifications"

Write-Host "🔍 Testing function at: $functionUrl" -ForegroundColor Yellow
Write-Host "📤 Sending test data: $testData" -ForegroundColor Yellow
Write-Host ""

try {
    # Make the request
    $response = Invoke-RestMethod -Uri $functionUrl -Method POST -Body $testData -Headers @{
        "Authorization" = "Bearer $serviceRoleKey"
        "Content-Type" = "application/json"
    } -ErrorAction Stop

    Write-Host "✅ Function test successful!" -ForegroundColor Green
    Write-Host "📊 Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
    
    if ($response.success) {
        Write-Host ""
        Write-Host "🎉 Your visa automation is working!" -ForegroundColor Green
        Write-Host "📧 Check your email at: info@cubstechnical.com" -ForegroundColor Yellow
        Write-Host "📊 Check Supabase logs for detailed execution info" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "⚠️ Function returned success=false" -ForegroundColor Yellow
        Write-Host "Check the response for details" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        # Try to get response body
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "🔍 Next steps:" -ForegroundColor Cyan
Write-Host "1. Check Supabase Dashboard → Edge Functions → send-visa-notifications → Logs" -ForegroundColor White
Write-Host "2. Check your email for notifications" -ForegroundColor White
Write-Host "3. Run database setup if not done: supabase/email-templates-setup.sql" -ForegroundColor White 