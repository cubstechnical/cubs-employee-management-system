@echo off
echo 🧪 Testing Visa Automation Function
echo.

echo Please enter your Supabase service role key:
set /p SERVICE_ROLE_KEY=

if "%SERVICE_ROLE_KEY%"=="" (
    echo ❌ Service role key is required!
    pause
    exit /b 1
)

echo.
echo 🔍 Testing function...
echo.

curl -X POST "https://tndfjsjemqjgagtsqudr.supabase.co/functions/v1/send-visa-notifications" ^
  -H "Authorization: Bearer %SERVICE_ROLE_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"manual\": true}"

echo.
echo.
echo ✅ Test completed!
echo 📧 Check your email at: info@cubstechnical.com
echo 📊 Check Supabase logs for detailed execution info
echo.
pause 