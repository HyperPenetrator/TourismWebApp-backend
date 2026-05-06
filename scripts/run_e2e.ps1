# Start backend
$backend = Start-Process -FilePath "powershell" -ArgumentList "-NoProfile -Command", "uvicorn main:app --reload --host 0.0.0.0 --port 8000" -NoNewWindow -PassThru
Start-Sleep -Seconds 6

# Start frontend
Push-Location D:\Projects\Spot@NE\tourism_frontend
npm install -s
Start-Process -FilePath "powershell" -ArgumentList "-NoProfile -Command", "npm run dev" -NoNewWindow -PassThru
Start-Sleep -Seconds 8
Pop-Location

# Run Playwright tests (assumes tests configured via package.json)
npx playwright test
