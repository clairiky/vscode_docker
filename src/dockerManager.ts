import * as cp from 'child_process';
// this class manages the docker commands like build, run, exec, 
export class DockerManager {
    private _imageIds: string[]; // declare an array of image ids, that exists on the system, conversionContainerImage, QuantizationImage
    private _containerIds: string[];
    // the constructor might need to get the required images from the docker hub too.
    constructor () {
        this._imageIds = [];
        let images = cp.spawn('docker', ['images', 'test_8']);
        let fs = require('fs');
        let stream = fs.createWriteStream("images.txt"); 
        images.stdout.on("data", (data : string | Buffer) : void => {
            console.log(`data ${data} `); // got the images, split the images into the image 
            stream.write(data);

        });
        images.on("exit", (data : string | Buffer) : void => {
            console.log(`data ${data} `); // got the images, split the images into the image 
                                         // TODO: fix this!?
            fs.readFile('images.txt', (err: any, data: string) => {
            if (err) {
                return console.error(err);
            }
            console.log("Asynchronous read: " + data.toString().trim());
            console.log("Testing");
            this._imageIds.push(data.toString().trim().split(/\s+ \s+/)[4].split('\n')[1]);
            });
        });
    }

    // Docker run and then get the container id
    dockerRun(data: string) {
        let images = cp.spawn('docker', ['images', 'test_8']);
        let fs = require('fs');
        let stream = fs.createWriteStream("images.txt"); 
        images.stdout.on("data", (data : string | Buffer) : void => {
            console.log(`data ${data} `); // got the images, split the images into the image 
            stream.write(data);

        });
    }

    // Docker exec needs a running container
    dockerExec(data: string) {

    }

}