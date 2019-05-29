'use strict';
import * as cp from 'child_process';
import * as vscode from 'vscode';
import { basename } from 'path';
// this class manages the docker commands like build, run, exec, 
export class DockerManager {
    private _imageIds: string[]; // declare an array of image ids, that exists on the system, conversionContainerImage, QuantizationImage
    private _containerIds: string[];
    private _workspace: vscode.WorkspaceFolder | undefined;
    // the constructor might need to get the required images from the docker hub too.
    constructor () {
        this._imageIds = [];
        this._containerIds = [];
        if (vscode.window.activeTextEditor) 
            this._workspace = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
        let images = cp.spawn('docker', ['images', 'onnx-ecosystem']);

        let allImages: string = "";
        images.stdout.on("data", (data : string) : void => {
            allImages = allImages + data.toString();
        });
        images.on("exit", (data : string | Buffer) : void => {

            console.log(`Testing... ${allImages}`);
            this._imageIds.push(allImages.trim().split(/\s+ \s+/)[4].split('\n')[1]);
           
            if (vscode.window.activeTextEditor) {
                //let folder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
                if (this._workspace && vscode.workspace.workspaceFolders) {
                    let mountLocation:string = `source=${this._workspace.uri.fsPath},target=C:\\${basename(this._workspace.uri.fsPath)},type=bind`;
                    console.log(`mount location:${mountLocation}`);
                    console.log(`${this._imageIds[0]}`);

                    let runningContainer= cp.spawn('docker', ['run', '-t', '-d', '--mount', mountLocation, this._imageIds[0]]);
                    console.log(this._workspace.uri.fsPath);
                    runningContainer.on('error', (err) => {
                        console.log('Failed to start the container.');
                    });

                    runningContainer.stdout.on('data', (data: string) => {
                        console.log(`container id is ${data.toString()}`);
                        this._containerIds.push(data.toString().substr(0,12));
                    });

                    runningContainer.on('exit', (err) => {
                          if (err != 0) {
                            vscode.window.showInformationMessage("Something wrong happening while starting the development environment is ready");
                            console.log(`Exit with error code:  ${err}`);
                          }
                          else {
                             vscode.window.showInformationMessage("Development environment is ready!");
                             console.log("Development environment successfully running!");
                             // probably need to remove the containerid that was pushed in if the running wasnt successful
                          }
                        
                      });
                }
            }

        });
    }

    // Docker exec needs a running container, 
    dockerExec(fileuri:any ) {
        //docker exec 3798452640c9 python c:\test1.py
        if (this._workspace && vscode.workspace.workspaceFolders) {
            //let exec = cp.spawn('docker', ['exec',  this._containerIds[0], 'python', `C:\\${basename(this._workspace.uri.fsPath)}\\tf_onnx.py`, `${basename(fileuri.fsPath)}`  ]);
            let exec = cp.spawn('docker', ['exec',  'b21173889877', 'python', "C:\Conversion-quantization\\tf_onnx.py", "C:\Conversion-quantization\\saved_model.pb"  ]);
            console.log("Converting...");
            exec.on('error', (err) => {
            console.log('Failed to start the container.');
            });

            exec.stdout.on('data', (data: string) => {
                console.log(`container id is ${data.toString()}`);
                this._containerIds.push(data.toString().substr(0,12));
            });

            exec.on('exit', (err:any) => {
              if (err != 0) {
                vscode.window.showInformationMessage("COnversion failed");
                console.log(`Exit with error code:  ${err}`);
              }
              else {
                 vscode.window.showInformationMessage("Converted to an onnx model!");
                 console.log("Converted to an onnx model!");
                 // probably need to remove the containerid that was pushed in if the running wasnt successful
              }
            
            });
        }
    }

    dispose() : void {
        
    }

}