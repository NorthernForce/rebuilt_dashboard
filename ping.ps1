$adapter = "Ethernet 5"
$dashboardURL = "http://localhost:5800"

$driverStation = "C:\Program Files (x86)\FRC Driver Station\DriverStation.exe"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

$compMode = $false

while (!$compMode) {

    $status = (Get-NetAdapter -Name $adapter).Status

    # ENTER COMP MODE
    if ($status -eq "Up" -and -not $compMode) {

        Write-Host "Entering Competition Mode"

        Disable-NetAdapter -Name "Wi-Fi" -Confirm:$false -ErrorAction SilentlyContinue

        powercfg /setactive SCHEME_MIN

        if (-not (Get-Process DriverStation -ErrorAction SilentlyContinue)) {
            Start-Process $driverStation
        }

        if (-not (Get-Process node -ErrorAction SilentlyContinue)) {
            Start-Process "C:\Users\evere\Source\rebuilt_dashboard\start-dashboard.bat"
        }

        Start-Sleep -Seconds 3

        if (-not (Get-Process chrome -ErrorAction SilentlyContinue)) {
            Start-Process $chrome $dashboardURL
        } else {
            Start-Process "chrome.exe" "--new-tab $dashboardURL"
        }

        $compMode = $true
    }

    if ($status -ne "Up" -and $compMode) {

        Write-Host "Exiting Competition Mode"

        Enable-NetAdapter -Name "Wi-Fi" -Confirm:$false -ErrorAction SilentlyContinue

        powercfg /setactive SCHEME_BALANCED

        Stop-Process -Name chrome -ErrorAction SilentlyContinue

        Stop-Process -Name node -ErrorAction SilentlyContinue

        $compMode = $false
    }

    Start-Sleep -Seconds 2
}