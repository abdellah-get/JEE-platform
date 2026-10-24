# Post-deploy smoke checks for the JEE Platform API.
# Usage: .\scripts\smoke-api.ps1 https://ton-api.onrender.com

param(
	[string]$BaseUrl = "http://localhost:8081"
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")

Write-Host "==> Health: $BaseUrl/api/v1/health"
$health = Invoke-RestMethod -Uri "$BaseUrl/api/v1/health" -Method Get
if ($health.status -ne "UP") {
	throw "FAIL: health not UP"
}
Write-Host "OK health"

Write-Host "==> H2 console must not be public"
try {
	$prev = $ProgressPreference
	$ProgressPreference = "SilentlyContinue"
	$h2 = Invoke-WebRequest -Uri "$BaseUrl/h2-console" -Method Get -MaximumRedirection 0 -UseBasicParsing
	$ProgressPreference = $prev
	if ($h2.StatusCode -in 200, 301, 302) {
		throw "FAIL: /h2-console returned $($h2.StatusCode)"
	}
	Write-Host "OK h2-console status $($h2.StatusCode)"
}
catch {
	if ($_.Exception.Message -match "^FAIL:") { throw }
	Write-Host "OK h2-console closed/unreachable"
}

Write-Host "==> Auth login rejects bad credentials"
try {
	Invoke-RestMethod -Uri "$BaseUrl/api/v1/auth/login" -Method Post `
		-ContentType "application/json" `
		-Body '{"email":"smoke-nobody@ensem.jee","password":"wrong-password"}'
	throw "FAIL: login should not succeed"
}
catch {
	if ($_.Exception.Message -match "^FAIL:") { throw }
	$resp = $_.Exception.Response
	if ($null -eq $resp) {
		Write-Host "OK auth endpoint rejected request"
	}
	else {
		$code = [int]$resp.StatusCode
		if ($code -notin 401, 429) {
			throw "FAIL: login expected 401/429, got $code"
		}
		Write-Host "OK auth endpoint responds ($code)"
	}
}

Write-Host "Smoke OK against $BaseUrl"
