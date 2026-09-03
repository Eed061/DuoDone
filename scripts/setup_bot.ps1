$BOT_TOKEN = "8610123389:AAEB_fhurfxpSJZxQtceltu7ez4WhMMYjAo"
$API_BASE = "https://api.telegram.org/bot$BOT_TOKEN"
$WEB_APP_URL = "https://duodone.vercel.app"

Write-Host "🤖 Starting Telegram Bot configuration..." -ForegroundColor Cyan

# 1. Set Name
$namePayload = @{ name = "DuoDone 🏓 Змагання та Лічильники" } | ConvertTo-Json -Compress
Write-Host "1. Setting Bot Name..."
curl.exe -4 -s -X POST "$API_BASE/setMyName" -H "Content-Type: application/json" -d $namePayload

# 2. Set Short Description
$shortDescPayload = @{ short_description = "DuoDone — змагальний блок, балансир XP балів та лічильники з фотофіксацією для пар! 🏓" } | ConvertTo-Json -Compress
Write-Host "`n2. Setting Short Description..."
curl.exe -4 -s -X POST "$API_BASE/setMyShortDescription" -H "Content-Type: application/json" -d $shortDescPayload

# 3. Set Full Description
$fullDesc = "DuoDone — легкий веб-застосунок для пар та сімей для прозорого розподілу побутових завдань без токсичності та суперечок 🤝`n`n🏓 Сценарій «Симетричний Пінг-понг»: почергова передача ходу конкретної справи.`n⚖️ Сценарій «Балансир балів»: спільний накопичувальний залік за шкалою XP із графічним перетягуванням каната.`n🎡 «Рулетка долі»: розіграш призів та покарань наприкінці місяця.`n🔢 «Лічильники дій»: автономні клікери з живим фотопідтвердженням через камеру, календарем та таймштампами.`n`nНатисніть кнопку нижче, щоб відкрити застосунок!"
$descPayload = @{ description = $fullDesc } | ConvertTo-Json -Compress
Write-Host "`n3. Setting Full Description..."
curl.exe -4 -s -X POST "$API_BASE/setMyDescription" -H "Content-Type: application/json" -d $descPayload

# 4. Set Commands
$commandsPayload = @{
    commands = @(
        @{ command = "start"; description = "Відкрити DuoDone Mini App 🏓" },
        @{ command = "help"; description = "Інструкція та підтримка ℹ️" }
    )
} | ConvertTo-Json -Compress
Write-Host "`n4. Setting Bot Commands..."
curl.exe -4 -s -X POST "$API_BASE/setMyCommands" -H "Content-Type: application/json" -d $commandsPayload

# 5. Set Menu Button
$menuPayload = @{
    menu_button = @{
        type = "web_app"
        text = "Відкрити DuoDone 🏓"
        web_app = @{ url = $WEB_APP_URL }
    }
} | ConvertTo-Json -Compress
Write-Host "`n5. Setting Web App Menu Button..."
curl.exe -4 -s -X POST "$API_BASE/setChatMenuButton" -H "Content-Type: application/json" -d $menuPayload

Write-Host "`n🎉 Telegram Bot setup finished!" -ForegroundColor Green
