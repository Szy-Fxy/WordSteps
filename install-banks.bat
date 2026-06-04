@echo off
chcp 65001 >nul
echo 正在复制词库到 AppData...
set TARGET=%APPDATA%\wordsteps\user-banks\Szy
if not exist "%TARGET%" mkdir "%TARGET%"
xcopy /E /I /Y "%~dp0user-banks\Szy\*" "%TARGET%"
echo ✅ 复制完成！词库已安装到：
echo    %TARGET%
echo.
echo 现在用 npm run dev:electron 启动应用就能看到 Szy 词库了。
pause
