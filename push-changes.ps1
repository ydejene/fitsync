# Git Push Script with Descriptive Commits
# This script stages and commits the recent changes with proper messages

Write-Host "Starting git push with descriptive commits..." -ForegroundColor Cyan

# Commit 1: Update backend dependencies
Write-Host "`nCommit 1: Updating backend dependencies..." -ForegroundColor Yellow
git add backend/package.json backend/package-lock.json
git commit -m "Updated backend dependencies

- Update package-lock.json
- Resolve dependency versions"

# Commit 2: Update booking controller
Write-Host "`nCommit 2: Updating booking controller..." -ForegroundColor Yellow
git add backend/src/controllers/booking.controller.js
git commit -m "Modified booking controller implementation

- Enhance booking controller logic
- Update request/response handling"

# Commit 3: Update frontend dependencies
Write-Host "`nCommit 3: Updating frontend dependencies..." -ForegroundColor Yellow
git add frontend/package.json frontend/package-lock.json
git commit -m "Updated frontend dependencies

- Update package-lock.json
- Resolve dependency versions"

# Push all commits to remote
Write-Host "`nPushing all commits to GitHub..." -ForegroundColor Cyan
git push origin develop

Write-Host "`n[SUCCESS] All changes pushed successfully!" -ForegroundColor Green
