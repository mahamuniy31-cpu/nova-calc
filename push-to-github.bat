@echo off
title Push NOVA CALC to GitHub
echo ========================================================
echo   PUSHING NOVA CALC TO GITHUB REPOSITORY
echo   https://github.com/mahamuniy31-cpu/nova-calc
echo ========================================================
echo.
cd /d "%~dp0"
echo Pushing branch 'main' to GitHub...
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   SUCCESS! NOVA CALC HAS BEEN PUSHED TO GITHUB!
    echo   Repository: https://github.com/mahamuniy31-cpu/nova-calc
    echo ========================================================
) else (
    echo.
    echo If it failed because the repository does not exist yet:
    echo 1. Go to https://github.com/new
    echo 2. Create a new repository named: nova-calc
    echo 3. Run this script again!
)
echo.
pause
