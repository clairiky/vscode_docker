// this class manages the tasks that are needed by the extention
// like convert, quantize
import {DockerManager} from './dockerManager'
export class ModelManager {
    private _dm: DockerManager;

    constructor(dm: DockerManager) {
        this._dm = dm;
    }

    convert(data: string) { // this data contains the python script to convert.. maybe
        //this._dm.dockerRun(data);
    }

    quantize(data: string) { 
        this._dm.dockerExec
    }
}