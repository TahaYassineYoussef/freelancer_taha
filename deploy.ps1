# Enhanced Vercel Deployment Script with Detailed Progress
# Usage: .\deploy.ps1 [preview|prod]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("preview", "prod")]
    [string]$Environment = "preview"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Vercel Deployment with Enhanced Progress" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envArgs = if ($Environment -eq "prod") { @("--prod") } else { @() }

Write-Host "Deploying to: $Environment" -ForegroundColor Yellow
Write-Host "Starting deployment with debug mode..." -ForegroundColor Green
Write-Host ""

# Run Vercel with debug flag for enhanced progress
$arguments = @("vercel", "--debug") + $envArgs
$process = Start-Process -FilePath "npx" -ArgumentList $arguments -NoNewWindow -PassThru -Wait

if ($process.ExitCode -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Deployment completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Deployment failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit $process.ExitCode
}
