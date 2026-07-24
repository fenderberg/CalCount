param(
  [int]$MaxAgeDays = 45
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$failures = [System.Collections.Generic.List[string]]::new()
$notes = [System.Collections.Generic.List[string]]::new()

function Add-Failure([string]$Message) {
  $failures.Add($Message)
}

function Relative-Path([string]$Path) {
  return [System.IO.Path]::GetRelativePath($repoRoot, $Path).Replace('\', '/')
}

Push-Location $repoRoot
try {
  $canonicalDocs = @(
    'README.md',
    'docs/handoff.md',
    'docs/prd.md',
    'docs/design.md',
    'docs/architecture.md',
    'docs/deployment.md'
  )

  if (-not (Test-Path -LiteralPath 'AGENTS.md' -PathType Leaf)) {
    Add-Failure 'Ontbrekende repositorypolicy: AGENTS.md'
  }

  foreach ($doc in $canonicalDocs) {
    if (-not (Test-Path -LiteralPath $doc -PathType Leaf)) {
      Add-Failure "Ontbrekend canoniek document: $doc"
    }
  }

  if ($failures.Count -eq 0) {
    $readme = Get-Content -Raw -LiteralPath 'README.md'
    foreach ($doc in $canonicalDocs | Where-Object { $_ -ne 'README.md' }) {
      if (-not $readme.Contains($doc)) {
        Add-Failure "README.md verwijst niet naar $doc"
      }
    }

    $design = Get-Content -Raw -LiteralPath 'docs/design.md'
    if ($design -notmatch '(?m)^canonical:\s*true\s*$') {
      Add-Failure 'docs/design.md mist frontmatter `canonical: true`.'
    }
  }

  # Controleer lokale links in actieve projectdocumentatie en BMAD-artefacten.
  $markdownFiles = @()
  if (Test-Path README.md) { $markdownFiles += Get-Item README.md }
  if (Test-Path AGENTS.md) { $markdownFiles += Get-Item AGENTS.md }
  foreach ($directory in @('docs', '_bmad-output')) {
    if (Test-Path $directory) {
      $markdownFiles += Get-ChildItem $directory -Recurse -Filter '*.md' -File |
        Where-Object { $_.Name -ne '.memlog.md' }
    }
  }

  foreach ($file in $markdownFiles) {
    $content = Get-Content -Raw -LiteralPath $file.FullName
    foreach ($match in [regex]::Matches($content, '\]\(([^)]+)\)')) {
      $target = $match.Groups[1].Value.Trim('<', '>')
      if ($target -match '^(https?://|mailto:|#)' -or $target -match '^\{') { continue }
      $pathOnly = ($target -split '#')[0]
      if (-not $pathOnly) { continue }
      $resolved = [System.IO.Path]::GetFullPath((Join-Path $file.DirectoryName $pathOnly))
      if (-not (Test-Path -LiteralPath $resolved)) {
        Add-Failure "Kapotte link in $(Relative-Path $file.FullName): $target"
      }
    }
  }

  # Bekende driftpatronen in actieve/canonieke documenten.
  $driftRules = @(
    @{ File = 'README.md'; Pattern = 'Render-service nog aan te maken'; Label = 'oude Render-status' },
    @{ File = 'README.md'; Pattern = 'Prisma/SQLite'; Label = 'oude database-stack' },
    @{ File = 'docs/handoff.md'; Pattern = '12 unit tests'; Label = 'oud testaantal' },
    @{ File = 'docs/handoff.md'; Pattern = 'Prisma\s*/\s*SQLite'; Label = 'oude database-stack' },
    @{ File = 'docs/architecture.md'; Pattern = 'Database\s*\|\s*SQLite'; Label = 'oude databasearchitectuur' },
    @{ File = 'docs/architecture.md'; Pattern = 'Fastify\s*\|\s*4\.x'; Label = 'oude Fastify-versie' },
    @{ File = 'docs/architecture.md'; Pattern = 'Prisma\s*\|\s*5\.x'; Label = 'oude Prisma-versie' },
    @{ File = '_bmad-output/planning-artifacts/epics.md'; Pattern = 'Epic 3 heeft nu prioriteit'; Label = 'oude epicprioriteit' }
  )
  foreach ($rule in $driftRules) {
    if (-not (Test-Path -LiteralPath $rule.File)) { continue }
    $content = Get-Content -Raw -LiteralPath $rule.File
    if ($content -match $rule.Pattern) {
      Add-Failure "$($rule.File) bevat $($rule.Label): /$($rule.Pattern)/"
    }
  }

  # De architectuur moet iedere geregistreerde Fastify-route noemen.
  if (Test-Path 'docs/architecture.md') {
    $architecture = Get-Content -Raw -LiteralPath 'docs/architecture.md'
    $routeFiles = Get-ChildItem 'api/src' -Recurse -Filter '*.ts' -File
    $routes = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($file in $routeFiles) {
      $source = Get-Content -Raw -LiteralPath $file.FullName
      foreach ($match in [regex]::Matches($source, 'app\.(?:get|post|put|patch|delete)\(\s*[''"]([^''"]+)[''"]')) {
        [void]$routes.Add($match.Groups[1].Value)
      }
    }
    foreach ($route in $routes) {
      if (-not $architecture.Contains($route)) {
        Add-Failure "API-route ontbreekt in docs/architecture.md: $route"
      }
    }
  }

  # De nieuwste Prisma-migratie moet in overdracht of deployment zijn genoemd.
  $migrationRoot = 'api/prisma/migrations'
  if (Test-Path $migrationRoot) {
    $latestMigration = Get-ChildItem $migrationRoot -Directory | Sort-Object Name | Select-Object -Last 1
    if ($latestMigration) {
      $migrationDocs = (Get-Content -Raw 'docs/handoff.md') + (Get-Content -Raw 'docs/deployment.md')
      if (-not $migrationDocs.Contains($latestMigration.Name)) {
        Add-Failure "Nieuwste Prisma-migratie is niet gedocumenteerd: $($latestMigration.Name)"
      }
    }
  }

  # Sprintstatus: bekende statussen en actieve stories met een bijpassend storybestand.
  $sprintFile = '_bmad-output/implementation-artifacts/sprint-status.yaml'
  if (Test-Path $sprintFile) {
    $allowedStatuses = @('backlog', 'ready-for-dev', 'in-progress', 'review', 'done', 'optional')
    $sprintLines = Get-Content -LiteralPath $sprintFile
    foreach ($line in $sprintLines) {
      if ($line -notmatch '^\s{2}([^#:\s]+):\s+([a-z-]+)') { continue }
      $key = $Matches[1]
      $status = $Matches[2]
      if ($status -notin $allowedStatuses) {
        Add-Failure "Onbekende sprintstatus voor ${key}: $status"
        continue
      }
      if ($key -notmatch '^\d+-\d+-' -or $status -notin @('in-progress', 'review')) { continue }

      $storyFile = Join-Path '_bmad-output/implementation-artifacts' "$key.md"
      if (-not (Test-Path -LiteralPath $storyFile)) {
        Add-Failure "Actieve story mist storybestand: $storyFile"
        continue
      }
      $storyContent = Get-Content -Raw -LiteralPath $storyFile
      if ($storyContent -notmatch '(?m)^Status:\s*([^\s]+)') {
        Add-Failure "Storybestand mist Status-regel: $storyFile"
        continue
      }
      $storyStatus = $Matches[1]
      $statusMatches = $storyStatus -eq $status -or ($storyStatus -eq 'parked' -and $status -eq 'in-progress')
      if (-not $statusMatches) {
        Add-Failure "Statusverschil: $storyFile=$storyStatus, sprint-status=$status"
      }
    }
  } else {
    Add-Failure "Ontbrekende sprintstatus: $sprintFile"
  }

  # Periodieke review: gebruik laatste commitdatum, met bestandstijd als fallback voor nieuwe files.
  $now = [DateTimeOffset]::UtcNow
  foreach ($doc in $canonicalDocs) {
    if (-not (Test-Path -LiteralPath $doc)) { continue }
    $workingTreeChange = (& git status --porcelain -- $doc 2>$null | Select-Object -First 1)
    $lastCommitDate = (& git log -1 --format=%cs -- $doc 2>$null | Select-Object -First 1)
    if ($workingTreeChange) {
      $lastReviewed = [DateTimeOffset](Get-Item -LiteralPath $doc).LastWriteTimeUtc
    } elseif ($lastCommitDate) {
      $lastReviewed = [DateTimeOffset]::ParseExact(
        $lastCommitDate.Trim(),
        'yyyy-MM-dd',
        [System.Globalization.CultureInfo]::InvariantCulture
      )
    } else {
      $lastReviewed = [DateTimeOffset](Get-Item -LiteralPath $doc).LastWriteTimeUtc
    }
    $age = [math]::Floor(($now - $lastReviewed).TotalDays)
    if ($age -gt $MaxAgeDays) {
      Add-Failure "$doc is $age dagen niet gereviewd (maximum: $MaxAgeDays)."
    }
  }

  if ($failures.Count -gt 0) {
    Write-Host "Documentatiecheck mislukt met $($failures.Count) fout(en):" -ForegroundColor Red
    foreach ($failure in $failures) { Write-Host "- $failure" -ForegroundColor Red }
    exit 1
  }

  Write-Host "Documentatiecheck geslaagd." -ForegroundColor Green
  Write-Host "- Canonieke documenten aanwezig en recent"
  Write-Host "- Lokale Markdown-links geldig"
  Write-Host "- API-routes en nieuwste migratie gedocumenteerd"
  Write-Host "- BMAD-storystatus consistent"
} finally {
  Pop-Location
}
