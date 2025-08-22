$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$base = 'http://localhost:4200'
$creds = @(
    @{ email = 'platform.admin@pranathiss.local'; password = 'admin123$' },
    @{ email = 'ops.admin@pranathiss.local'; password = 'ops123@' },
    @{ email = 'finance.admin@pranathiss.local'; password = 'finance123!' },
    @{ email = 'support.agent@pranathiss.local'; password = 'support123' },
    @{ email = 'readonly.viewer@pranathiss.local'; password = 'test123' }
)

Write-Host 'Health check:' -NoNewline
try {
    $h = Invoke-RestMethod -Uri ($base + '/health') -Method Get
    Write-Host ' OK'
} catch {
    Write-Host ' FAIL'
}

foreach ($c in $creds) {
  try {
    $resp = Invoke-RestMethod -Uri ($base + '/api/admin/login') -Method Post -ContentType 'application/json' -Body ($c | ConvertTo-Json)
    if ($resp.token) {
      Write-Output ("{0} -> OK" -f $c.email)
    } else {
      Write-Output ("{0} -> 200 but no token" -f $c.email)
    }
  } catch {
    $code = $null
    $body = $null
    if ($_.Exception.Response) {
      $code = $_.Exception.Response.StatusCode.value__
      $reader = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
      $body = $reader.ReadToEnd()
    }
    Write-Output ("{0} -> ERROR {1} {2}" -f $c.email, $code, $body)
  }
}
