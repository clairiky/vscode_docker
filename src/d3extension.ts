'use strict';

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import {getHtmlContent} from './extension';

// LCR - questions
// This class should start a docker container
// but what kinds of container it needs? - we dont know that yet
// for the time being just start a container which can run a python script 
// should I have a class which does everything for to the container
export class dockerExtension
{
    private _output : vscode.OutputChannel;
    private _rootPath : string;
    private _profilerBinPath : string;
    private _result : string;
    private _panel: vscode.WebviewPanel|undefined;
    private _status : vscode.StatusBarItem ;

    constructor(rootPath : string, binPath : string, panel: vscode.WebviewPanel | undefined) {
        this._output = vscode.window.createOutputChannel("Python profiler");
        this._rootPath = rootPath;
        this._profilerBinPath = binPath;
        this._result  = "";
        this._panel = panel;
        this._status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 25);

        console.log(`Created D3Extension instance, will be running from ${this._profilerBinPath}`);
    }
   
    testOutput(message : string) : void {
        this._status.text = "Profiler starting ... ";
        this._status.show();
        this._output.clear();
        let channel : vscode.OutputChannel = this._output;
        let errString : string = "";

        channel.appendLine("Profiler starting...");
        
        //let p = cp.spawn(this._profilerBinPath, ['-p']);
        /*
        if (this._panel) {
            this._panel.reveal(vscode.ViewColumn.Two);
            this._panel.webview.html = getHtmlContent(this._rootPath);
            //this._panel.webview.postMessage({ command : 'refactor'});
            this._status.text = "Done!";
            this._status.show();
            console.log("Done sending command");
        } else {
            console.log("No panel to display");
        }
        */
       let textEditor = vscode.window.activeTextEditor;
       
       if (!textEditor) {
           vscode.window.showErrorMessage("No document selected.");
           return;
       } else {
           let doc = textEditor.document;
           if (!doc || doc.languageId != "python") {
             vscode.window.showErrorMessage("Please invoke this command from a Python file.");
             return;
           }
           vscode.window.showInformationMessage(`The texteditor has ${doc.fileName} open`);
           console.log(`this file is open now ${doc.fileName}`);
  
       }
       
        let p = cp.spawn('dotnet', [this._profilerBinPath, '-d', os.tmpdir(), '-j', '--', 'C:\\Users\\Chanchala\\Miniconda3\\envs\\bare_vscode_2\\python.exe', textEditor.document.fileName]);
       //let p = cp.spawn('C:\\Users\\perf\\Anaconda3\\envs\\onnx_vscode_p3.6\\python.exe', ["C:\\Users\\perf\\PTVS\\bare_vscode\\test.py"]);
        
       p.stdout.on("data", (data : string | Buffer) : void => {
           channel.append(data.toString());
           this._status.text = "Profiler running ..."; this._status.show();
       });
       p.stderr.on("data", (data : string | Buffer) : void => {
           errString += data.toString();
           // TODO --- I'm getting errors, what are they?
           // this._status.text = "Profiler encountered error..."; this._status.show();
           channel.append(`From driver: ${data.toString()}`);
       });

       p.on('exit', (exitCode : number) : void => {
           channel.appendLine("Profiler signaled completion!");
           if (exitCode === 0) {          
            if (this._panel) {
                this._panel.reveal(vscode.ViewColumn.Two);
                this._panel.webview.html = getHtmlContent(this._rootPath);
                this._status.text = "Profiler Done!";
                this._status.show();
                console.log("Done sending command");
              }
           } else {
               vscode.window.showErrorMessage(`Error while driving profiler: ${errString}.`);
           }
       });

        // this._output.appendLine(`Received a message: ${message}.`);
    }

    dispose() : void {
        this._output.dispose();
    }
}
