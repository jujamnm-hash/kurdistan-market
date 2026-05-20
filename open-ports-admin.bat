@echo off
echo Opening firewall ports for Kurdistan Market...
netsh advfirewall firewall delete rule name="Kurdistan Market Frontend" >nul 2>&1
netsh advfirewall firewall delete rule name="Kurdistan Market Backend" >nul 2>&1
netsh advfirewall firewall add rule name="Kurdistan Market Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Kurdistan Market Backend" dir=in action=allow protocol=TCP localport=5000
echo.
echo Done! Ports 3000 and 5000 are now open.
echo Mobile devices on the same WiFi can now access the app.
pause
