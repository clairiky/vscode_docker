'use strict';
import * as cp from 'child_process';
import * as vscode from 'vscode';
import * as path  from 'path';
import * as fs from 'fs';
import * as os from 'os';

// this class manages the docker commands like build, run, exec, 
export class DockerManager {
    private _imageIds: string[]; // declare an array of image ids, that exists on the system, conversionContainerImage, QuantizationImage
    private _containerIds: string[];
    private _workspace: vscode.WorkspaceFolder | undefined;
    private _extensionPath: string;
    // the constructor might need to get the required images from the docker hub too.
    constructor(extensionPath: string) {
        this._imageIds = [];
        this._containerIds = [];
        this._extensionPath = extensionPath;
        let currentContainerId: string = "";
        if (vscode.window.activeTextEditor)
            this._workspace = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
        let images = cp.spawn('docker', ['images', 'onnx-ecosystem:latest']);

        let allImages: string = "";
        images.stdout.on("data", (data: string): void => {
            allImages = allImages + data.toString();
        });
        images.on("exit", (data: string | Buffer): void => {

            console.log(`Testing... ${allImages}`);
            this._imageIds.push(allImages.trim().split(/\s+ \s+/)[4].split('\n')[1]);

            //if (vscode.window.activeTextEditor) {
            if (vscode.window.activeTextEditor) {
                //let folder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
                if (this._workspace && vscode.workspace.workspaceFolders) {
                    let userWorkspaceMount: string = `source=${this._workspace.uri.fsPath},target=C:\\${path.basename(this._workspace.uri.fsPath)},type=bind`;
                    let extensionMount: string =`source=${os.tmpdir()},target=C:\\output,type=bind`;
                    console.log(`mount location:${userWorkspaceMount}`);
                    console.log(`${this._imageIds[0]}`);

                    let runningContainer = cp.spawn('docker', ['run', '-t', '-d', '--mount', userWorkspaceMount, '--mount', extensionMount, this._imageIds[0]]);

                    console.log(this._workspace.uri.fsPath);
                    runningContainer.on('error', (err) => {
                        console.log('Failed to start the container.');
                    });

                    runningContainer.stdout.on('data', (data: string) => {
                        console.log(`Creating container id ${data.toString()}`);
                        currentContainerId = data.toString();
                    });

                    runningContainer.on('exit', (err) => {
                        if (err != 0) {
                            vscode.window.showInformationMessage("Something wrong happening while starting the development environment is ready");
                            console.log(`Exit with error code:  ${err}`);
                        }
                        else {
                            this._containerIds.push(currentContainerId.substr(0, 12));
                            vscode.window.showInformationMessage("Development environment is ready!");
                            console.log("Development environment successfully running!");     
                        }

                    });
                }
            }
            
        });
    }

    // Docker exec needs a running container, 
    dockerExec(fileuri: any) {

        if (this._workspace && vscode.workspace.workspaceFolders) {
            console.log(`Location: C:\\${path.basename(this._workspace.uri.fsPath)}\\tf_onnx.py C:\\${path.basename(this._workspace.uri.fsPath)}\\${path.basename(fileuri.fsPath)}`);
            let exec = cp.spawn('docker', ['exec',  this._containerIds[0], 'python', `C:\\${path.basename(this._workspace.uri.fsPath)}\\tf_onnx.py`, `C:\\${path.basename(this._workspace.uri.fsPath)}\\${path.basename(fileuri.fsPath)}`]);

            console.log("Converting...");
            exec.on('error', (err) => {
                console.log('Failed to start the container.');
            });

            exec.stdout.on('data', (data: string) => {
                console.log(`container id is ${data.toString()}`);
                this._containerIds.push(data.toString().substr(0, 12));
            });

            exec.on('exit', (err: any) => {
                if (err != 0) {
                    vscode.window.showInformationMessage("COnversion failed");
                    console.log(`Exit with error code:  ${err}`);
                }
                else {
                    vscode.window.showInformationMessage("Converted to an onnx model!");
                    console.log("Converted to an onnx model!");
                }

            });
        }
    }

    dockerValidate() {
        this.selectWorkspaceFolder("Select input data folders");
        //this.selectWorkspaceFolder("Select result folder");
    }

    dispose(): void {

    }

    // this could be utility functions?
    //async  selectWorkspaceFolder(context: vscode.ExtensionContext): Promise<vscode.WorkspaceFolder | undefined> {
    async  selectWorkspaceFolder(label: string): Promise<vscode.WorkspaceFolder | undefined> {

        if (vscode.workspace.workspaceFolders) {
    
            let folderUris = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: true, canSelectMany: true, openLabel: label });
            if (!folderUris) {
                return undefined;
            }
            let folders:string = "";
            folderUris.forEach(function (value) {
                console.log(value.path.toString());
                folders = folders + ',' + value.path.toString();
            });

            let currentPanel : vscode.WebviewPanel = vscode.window.createWebviewPanel("testType", "Validation summary", vscode.ViewColumn.Two, { enableScripts : true } );  
            

            currentPanel.webview.html = getHtmlContent(this._extensionPath, folders);
            //this.showInputBox();
           // return folderUris;
        }
    
        
    }
    
    async  showInputBox() {
        const result = await vscode.window.showInputBox({
            value: 'abcdef',
            valueSelection: [2, 4],
            placeHolder: 'For example: fedcba. But not: 123',
            validateInput: text => {
                vscode.window.showInformationMessage(`Validating: ${text}`);
                return text === '123' ? 'Not 123!' : null;
            }
        });
        vscode.window.showInformationMessage(`Got: ${result}`);
    }
    
}

function interpolateTemplate(template: string, params : Object) {
    const names = Object.keys(params);
    const vals = Object.values(params);
    return new Function(...names, `return \`${template}\`;`)(...vals);
}

function getHtmlContent(extensionPath : string, folders : string) : string {
    let resourcePath = path.join(extensionPath, 'resources');
    let scriptPath = vscode.Uri.file(path.join(resourcePath, 'main.js')).with({ scheme : 'vscode-resource'});
    let bundleUri = vscode.Uri.file(path.join(resourcePath, 'bundle.js')).with({ scheme: 'vscode-resource'});

    console.log("before");
    let htmlTemplate = fs.readFileSync(path.join(resourcePath, "index.html"), "utf8");
    let datajson = fs.readFileSync(path.join(os.tmpdir(), "output.json"), "utf8");
    console.log("after");
    let result = interpolateTemplate(htmlTemplate, {
        profileData : datajson,
        script : scriptPath,
        bundleUri : bundleUri,
        folders : folders
    });
    
    return result;
    //return htmlTemplate;
    // return `<!DOCTYPE html>
    // <html lang="en">
    // <head>
    //     <meta charset="UTF-8">
    //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //     <title>Source</title>
    // </head>
    // <body>
    //     <h1>Source</h1>
    // </body>
    // </html>`;
}