'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as cp from 'child_process';

import { ModelManager } from './modelManager';
import { DockerManager } from './dockerManager';
import { basename } from 'path';
// utilities
function interpolateTemplate(template: string, params: Object) {
    const names = Object.keys(params);
    const vals = Object.values(params);
    return new Function(...names, `return \`${template}\`;`)(...vals);
}

// creates the docker class which is an abstraction of all the things that a docker does
export function activate(context: vscode.ExtensionContext) {

    let dockerManager : DockerManager = new DockerManager();  // constructor gets all the images in the host. This needs to get the 
                                                              // images from dockerhub if the images that we need arent there in the host.
                                                              // The on.exit is when we have all the images. So that needs to ha
    let startDocker = vscode.commands.registerCommand('extension.testDocker', () => {
        // tell the user that the development/deployment env is getting ready
        // using a pop up.
        vscode.window.showInformationMessage("Starting the target development environment...");
    });

    
    let convert = vscode.commands.registerCommand('extension.Convert',  (fileuri:any) => {
        // get the file name with which the right click command was executed
        dockerManager.dockerExec(fileuri);
        console.log(`Converting....${basename(fileuri.fsPath)}`); // get the first 10 letters of the hash for the container id
    });


    let quantize = vscode.commands.registerCommand('extension.Quantize', () => {
        //dockerManager.dockerExec("dockerRun_command")
        console.log("Quantize...."); // get the first 10 letters of the hash for the container id
    });
    context.subscriptions.push(startDocker);
    context.subscriptions.push(convert);
    context.subscriptions.push(quantize);
    context.subscriptions.push(dockerManager);
}

// this method is called when your extension is deactivated
export function deactivate() {
    /* empty */
}




