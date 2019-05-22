'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as cp from 'child_process';
import * as d3x from './d3extension';
import { ModelManager } from './modelManager';
import { DockerManager } from './dockerManager';

// utilities
function interpolateTemplate(template: string, params: Object) {
    const names = Object.keys(params);
    const vals = Object.values(params);
    return new Function(...names, `return \`${template}\`;`)(...vals);
}

// creates the docker class which is an abstraction of all the things that a docker does
export function activate(context: vscode.ExtensionContext) {

    let dockerManager = new DockerManager();
    
    let createPanelDisposable = vscode.commands.registerCommand('extension.testD3js', () => {
        
        let p = cp.spawn('docker', ['run', '-d', '-it' ,'test_7', 'cmd']);
        
        p.stdout.on("data", (data : string | Buffer) : void => {
            console.log(`data ${data} `); // get the first 10 letters of the hash for the container id
       });
       p.stderr.on("data", (data : string | Buffer) : void => {
            console.log(`error ${data} `);
       });

       p.on('exit', (exitCode : number, signal) : void => {
                console.log('child process exited with ' +
                `code ${exitCode} and signal ${signal}`); // check exit code to check if the container is running
              });
    });
    context.subscriptions.push(createPanelDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
    /* empty */
}

export function getHtmlContent(extensionPath: string): string {
    let resourcePath = path.join(extensionPath, 'resources');
    let scriptPath = vscode.Uri.file(path.join(resourcePath, 'main.js')).with({ scheme: 'vscode-resource' });
    let bundleUri = vscode.Uri.file(path.join(resourcePath, 'bundle.js')).with({ scheme: 'vscode-resource' });
    // Async read
    //let datajson = fs.readFile(path.join(resourcePath, "/data/data2.json"), "utf8", 
    //                function(err, contents){console.log(`data found ${contents}.`);});

    let htmlTemplate = fs.readFileSync(path.join(resourcePath, "index.html"), "utf8");
    let datajson = fs.readFileSync(path.join(os.tmpdir(), "output.json"), "utf8");

    let result = interpolateTemplate(htmlTemplate, {
        profileData: datajson,
        script: scriptPath,
        bundleUri: bundleUri
    });

    return result;
}

function getSourceWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Source</title>
</head>
<body>
    <h1>Source</h1>
</body>
</html>`;
}
