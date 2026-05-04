#Requires AutoHotkey v2.0
#SingleInstance Force

global ProjectPath := FindProjectRoot(A_ScriptDir)
if (ProjectPath = "") {
    MsgBox("Nie znaleziono katalogu projektu. Umiesc skrypt w repozytorium albo w jego podkatalogu.", "ProjektZespolowy")
    ExitApp
}

global ProjectName := GetPathLeafName(ProjectPath)
global ComposeCommand := DetectComposeCommand()
global DevcontainerProjectName := "projektzespolowy-devcontainer"
global TitleLogs := ProjectName . " - backend logs"
global TitleWeb := ProjectName . " - web"
global WebUrl := "http://localhost:4200/"

if (ComposeCommand = "") {
    MsgBox("Nie znaleziono docker compose.`nZainstaluj Docker Desktop i upewnij sie, ze CLI jest dostepne w PATH.", ProjectName)
    ExitApp
}

if !CommandSucceeds("docker info") {
    MsgBox("Docker CLI jest dostepne, ale daemon nie odpowiada.`nUruchom Docker Desktop i sprobuj ponownie.", ProjectName)
    ExitApp
}

LaunchEnvironment()
return

LaunchEnvironment() {
    global ProjectPath

    LaunchLogsTerminal()
    LaunchCliTerminal()
    ArrangeTerminalWindows()
    OpenVSCode(ProjectPath)
}

BuildDevcontainerComposeCommand() {
    global ComposeCommand, DevcontainerProjectName

    return ComposeCommand . " -p " . DevcontainerProjectName . " -f docker-compose.yml -f .devcontainer/docker-compose.yml"
}

LaunchLogsTerminal() {
    global ProjectPath, TitleLogs, WebUrl

    devComposeCommand := BuildDevcontainerComposeCommand()

    powershellScript := "& { "
    powershellScript .= "[Console]::Title = " . QuotePs(TitleLogs) . "; "
    powershellScript .= "Set-Location " . QuotePs(ProjectPath) . "; "
    powershellScript .= "$compose = " . QuotePs(devComposeCommand) . "; "
    powershellScript .= "Write-Host " . QuotePs("[1/3] Zatrzymywanie starego stacka") . "; "
    powershellScript .= "Invoke-Expression ($compose + ' down --remove-orphans'); "
    powershellScript .= "Write-Host " . QuotePs("[2/3] Budowanie i start kontenerow") . "; "
    powershellScript .= "Invoke-Expression ($compose + ' up --build --remove-orphans -d db backend web'); "
    powershellScript .= "Write-Host " . QuotePs("[3/3] Logi backend i web") . "; "
    powershellScript .= "Invoke-Expression ($compose + ' logs --tail=100 db backend web'); "
    powershellScript .= "$deadline = (Get-Date).AddMinutes(5); "
    powershellScript .= "$ready = $false; "
    powershellScript .= "while ((Get-Date) -lt $deadline) { "
    powershellScript .= "$backendReady = $false; "
    powershellScript .= "$webReady = $false; "
    powershellScript .= "try { Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8000/api/health/' -TimeoutSec 5 | Out-Null; $backendReady = $true } catch { } "
    powershellScript .= "try { Invoke-WebRequest -UseBasicParsing -Uri " . QuotePs(WebUrl) . " -TimeoutSec 5 | Out-Null; $webReady = $true } catch { } "
    powershellScript .= "if ($backendReady -and $webReady) { $ready = $true; break } "
    powershellScript .= "Start-Sleep -Seconds 3; "
    powershellScript .= "} "
    powershellScript .= "Clear-Host; "
    powershellScript .= "if ($ready) { "
    powershellScript .= "Write-Host " . QuotePs("Web: " . WebUrl) . "; "
    powershellScript .= "} else { "
    powershellScript .= "Write-Host " . QuotePs("Backend lub web nie osiagnely gotowosci w ciagu 5 minut.") . "; "
    powershellScript .= "} "
    powershellScript .= "}"

    Run('powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -NoExit -Command "' . powershellScript . '"')
}

LaunchCliTerminal() {
    global TitleWeb

    powershellScript := "& { "
    powershellScript .= "[Console]::Title = " . QuotePs(TitleWeb) . "; "
    powershellScript .= "Write-Host " . QuotePs("dkbuild") . "; "
    powershellScript .= "}"

    Run('powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -NoExit -Command "' . powershellScript . '"')
}

QuotePs(value) {
    return "'" . StrReplace(value, "'", "''") . "'"
}

ArrangeTerminalWindows() {
    global TitleLogs, TitleWeb

    terminalHeight := 360
    MonitorGetWorkArea(1, &left, &top, &right, &bottom)
    screenWidth := right - left
    logsWidth := Floor(screenWidth * 0.45)
    cliWidth := screenWidth - logsWidth
    positionY := bottom - terminalHeight

    if (logId := WinWait(TitleLogs, , 10)) {
        WinActivate(logId)
        WinMove(left, positionY, logsWidth, terminalHeight, logId)
    }

    if (cliId := WinWait(TitleWeb, , 10)) {
        WinActivate(cliId)
        WinMove(left + logsWidth, positionY, cliWidth, terminalHeight, cliId)
    }
}

OpenVSCode(projectPath) {
    projectName := GetPathLeafName(projectPath)
    vscInfo := FindVSCodePath()

    if (vscInfo.exe != "") {
        try {
            Run('"' . vscInfo.exe . '" --new-window "' . projectPath . '"')
        } catch {
            MsgBox("Nie udalo sie uruchomic Visual Studio Code.", projectName)
        }
        return
    }

    if (vscInfo.cli != "") {
        try {
            Run('"' . vscInfo.cli . '" --new-window "' . projectPath . '"')
        } catch {
            MsgBox("Nie udalo sie uruchomic Visual Studio Code.", projectName)
        }
        return
    }

    MsgBox("Nie znaleziono Visual Studio Code. Projekt otworz recznie.", projectName)
}

WaitForVSCodeWindow(pid, projectName, exePathOrName := "Code.exe") {
    exeName := GetPathLeafName(exePathOrName)

    if (pid) {
        if (windowId := WinWait("ahk_pid " . pid, , 20))
            return windowId
    }

    if (windowId := WinWait(projectName . " ahk_exe " . exeName, , 20))
        return windowId

    if (windowId := WinWait("ahk_exe " . exeName, , 10))
        return windowId

    return 0
}

ReopenVSCodeInContainer(windowId, projectName) {
    WinActivate("ahk_id " . windowId)
    if !WinWaitActive("ahk_id " . windowId, , 10) {
        MsgBox("Nie udalo sie aktywowac okna VS Code.", projectName)
        return
    }

    Sleep(1500)
    Send("^+p")
    Sleep(700)
    SendText(">Dev Containers: Reopen in Container")
    Sleep(300)
    Send("{Enter}")
}

HasDevContainersExtension() {
    extensionPattern := EnvGet("USERPROFILE") . "\\.vscode\\extensions\\ms-vscode-remote.remote-containers-*"

    Loop Files extensionPattern, "D"
        return true

    return false
}

FindProjectRoot(startDir) {
    currentDir := startDir

    Loop {
        if (FileExist(currentDir . "\\docker-compose.yml") and FileExist(currentDir . "\\backend\\manage.py")) {
            return currentDir
        }

        SplitPath(currentDir, &dirName, &parentDir)
        if (parentDir = "" || parentDir = currentDir)
            break

        currentDir := parentDir
    }

    return ""
}

GetPathLeafName(path) {
    SplitPath(path, &name)
    return name
}

DetectComposeCommand() {
    if CommandSucceeds("docker compose version")
        return "docker compose"
    if CommandSucceeds("docker-compose version")
        return "docker-compose"
    return ""
}

CommandSucceeds(commandLine) {
    try {
        exitCode := RunWait(A_ComSpec . ' /C "' . commandLine . ' >nul 2>&1"', , "Hide")
        return exitCode = 0
    } catch {
        return false
    }
}

FindVSCodePath() {
    cliPath := GetFirstWhereResult("code")
    if (cliPath != "" && FileExist(cliPath))
        return { cli: cliPath, exe: InferVSCodeExeFromCli(cliPath) }

    regPaths := [
        "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Code.exe",
        "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\Code.exe"
    ]

    for regPath in regPaths {
        try {
            exePath := RegRead(regPath, "")
            if (exePath != "" && FileExist(exePath)) {
                installPath := ""
                try installPath := RegRead(regPath, "Path")

                if (installPath != "") {
                    cliPath := installPath . "\\bin\\code.cmd"
                    if FileExist(cliPath)
                        return { cli: cliPath, exe: exePath }
                }

                return { cli: "", exe: exePath }
            }
        }
    }

    localAppData := EnvGet("LOCALAPPDATA")
    localAppDataCode := localAppData . "\\Programs\\Microsoft VS Code"
    cliPath := localAppDataCode . "\\bin\\code.cmd"
    exePath := localAppDataCode . "\\Code.exe"

    return {
        cli: FileExist(cliPath) ? cliPath : "",
        exe: FileExist(exePath) ? exePath : ""
    }
}

InferVSCodeExeFromCli(cliPath) {
    if (cliPath = "")
        return ""

    SplitPath(cliPath, &cliName, &binDir)
    if (StrLower(cliName) != "code.cmd" && StrLower(cliName) != "code")
        return ""

    SplitPath(binDir, &binName, &installDir)
    if (StrLower(binName) != "bin")
        return ""

    exePath := installDir . "\\Code.exe"
    return FileExist(exePath) ? exePath : ""
}

GetFirstWhereResult(commandName) {
    tempFile := A_Temp . "\\ahk_where_" . commandName . "_" . A_TickCount . ".txt"

    try {
        exitCode := RunWait(A_ComSpec . ' /C "where ' . commandName . ' > "' . tempFile . '" 2>nul"', , "Hide")
        if (exitCode != 0 || !FileExist(tempFile))
            return ""

        content := Trim(FileRead(tempFile, "UTF-8"))
        if (content = "")
            return ""

        firstLine := StrSplit(content, "`n", "`r")[1]
        return Trim(StrReplace(firstLine, '"'))
    } catch {
        return ""
    } finally {
        if FileExist(tempFile)
            FileDelete(tempFile)
    }
}

BuildCommandLine(commands*) {
    commandLine := ""

    for index, command in commands {
        if (index > 1)
            commandLine .= " && "
        commandLine .= command
    }

    return commandLine
}

RunCliCommand(commandLine) {
    global TitleWeb

    if !WinExist(TitleWeb) {
        MsgBox("Nie znaleziono terminala CLI. Uruchom skrypt ponownie.", TitleWeb)
        return
    }

    WinActivate(TitleWeb)
    WinWaitActive(TitleWeb, , 2)
    SendText(commandLine)
    Send("{Enter}")
}

ShowBuildMenu() {
    global ProjectName

    buildGui := Gui(, ProjectName . " - Docker Build")
    buildGui.SetFont("s10")
    buildGui.Add("Text", "w320 Center", "Wybierz tryb przebudowy srodowiska:")

    btnStandard := buildGui.Add("Button", "w320 h40 Default", "1. Standardowy rebuild")
    btnStandard.OnEvent("Click", (*) => BuildActionStandard(buildGui))

    btnRestart := buildGui.Add("Button", "w320 h40", "2. Szybki restart")
    btnRestart.OnEvent("Click", (*) => BuildActionRestart(buildGui))

    btnReset := buildGui.Add("Button", "w320 h40", "3. Reset bazy (-v) + rebuild")
    btnReset.SetFont("Bold cRed")
    btnReset.OnEvent("Click", (*) => BuildActionResetDatabase(buildGui))

    buildGui.Show()
}

BuildActionStandard(guiObj) {
    global ComposeCommand

    devComposeCommand := BuildDevcontainerComposeCommand()

    guiObj.Destroy()
    RunCliCommand(ComposeCommand . " down --remove-orphans; if ($LASTEXITCODE -eq 0) { " . devComposeCommand .
        " down --remove-orphans; if ($LASTEXITCODE -eq 0) { " . devComposeCommand .
        " up --build --remove-orphans -d db backend web } }")
}

BuildActionRestart(guiObj) {
    devComposeCommand := BuildDevcontainerComposeCommand()

    guiObj.Destroy()
    RunCliCommand(devComposeCommand . " restart db backend web")
}

BuildActionResetDatabase(guiObj) {
    global ComposeCommand, ProjectName

    devComposeCommand := BuildDevcontainerComposeCommand()

    guiObj.Destroy()

    if (MsgBox("Usunac baze danych i przebudowac srodowisko od zera?", ProjectName, "YesNo") != "Yes")
        return

    RunCliCommand(ComposeCommand . " down -v --remove-orphans; if ($LASTEXITCODE -eq 0) { " . devComposeCommand .
        " down -v --remove-orphans; if ($LASTEXITCODE -eq 0) { " . devComposeCommand .
        " up --build --remove-orphans -d db backend web } }")
}

#HotIf WinActive(TitleWeb)

::dkbuild::
{
    ShowBuildMenu()
}

#HotIf
