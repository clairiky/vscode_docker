  (function () {
      const vscode = acquireVsCodeApi();
      window.vscode = vscode;
      const counter = document.getElementById("lines-of-code-counter");
      const commMsg = document.getElementById("latest-comm");
      const shouldDisplay = document.getElementById("container");
      let count = 0;
      setInterval( () => {
          counter.textContent = count++;
          if ((count % 5) === 0 && count < 10) {
              console.log("Sending a message to the host...");
              vscode.postMessage({
                  command: 'alert',
                  text: 'communicating with host'
              });
          }
      }, 500);


     let profileData = JSON.parse(document.getElementById("profileData").textContent);
         
     let moduleDistribution = profileData.module_attribution;
     let executionTime = profileData.total_time;
     var modules = [];
     var othersFraction = 0;
     moduleDistribution.forEach(function(element) {
        if (element.fraction > 1) {
            modules.push(Array(element.module, element.fraction));
        }
        else {
            othersFraction += element.fraction;
        }
            
      });
    modules.push(Array('others', othersFraction));
    
    var time = ['x', 0];
    var cpu = ['cpu', 0];

    profileData.cpu.forEach(function(element) {
       cpu.push(element);
     });
    
    var i = 0;
    profileData.cpu.forEach(function() {
        i += executionTime / (cpu.length - 2);
        //console.log(`i is ${i}`)
        time.push( i.toFixed(3) );
    });
    console.log(`Time length ${time.length}`);
    //console.log(`CPU lenght ${cpu.length}`);
    // CPU utilization timeline chart
    var chart = c3.generate({
        bindto: '#timeline',
        data: {
            x:'x',
            columns: [time, cpu],
            type: 'area-spline'
            
        },
        axis: {
            x: {
                padding: {left: 0},
                min: 0
            }
        }
    });

      // Modules chart
      var chart = c3.generate({
          bindto: '#modules',

          data: {
              columns : modules,
              type: 'donut',
              tooltip: {
                  show: true
              }
          },
          donut: {
              label: {
                  show: false
              },
              title: "Modules",
              width: 35,
          },
          legend: {
              hide: false,
              position: 'right'
          }
      });

     //  Handle a message inside the webview
     document.getElementById("message").textContent = "hello";
      window.addEventListener('message', event => {
          const message = event.data; // the message data the host sent
          //shouldDisplay.style.visibility = "visible";
          document.getElementById("message").textContent = "testing";

          counter.textContent = 10;
          commMsg.textContent = "Just received a message at time [" + count + "]";
          console.log("This should be displayed in the developer tools if they're open");

      });
  })();

function msg() {
    let folders = document.getElementById("myfolders").textContent;
    console.log(`Selected folders are ${folders}`);

    vscode.postMessage({
        command: 'alert',
        text: 'communicating with host'
    });
}

  function linkRenderer(params) {
    // Need to check data when grouping (see https://www.ag-grid.com/javascript-grid-cell-rendering-components/#cell-renderers-and-row-groups)
    if (!params.node.group) {
        // data exists, so we can access it
        return `<a href="javascript:testLink('${params.value}')">${params.value}</a>`;
    } else {
        // `null` signals ag-grid to display a blank cell
        return null;
    }
};

function testLink(functionName) {
    console.log(`Should be redirecting to function [${functionName}]`)
}

var columnDefs = [
    {headerName: "Function", field: 'function', cellRenderer:'agGroupCellRenderer'},
    {headerName: "CPU Time", field: "cpu_time"},
    {headerName: "Module", field: "module"},
    {headerName: "Function (Full)", field: "function_full", cellRenderer : linkRenderer},
    {headerName: "Source File", field: "source_file"},
    {headerName: "Start Address", field: "start_address"}
];

var minRowHeight = 5;
var currentRowHeight = minRowHeight;
var gridOptions = {
    columnDefs: columnDefs,
    enableSorting: true,
    animateRows: true,
    enableFilter: true,
    enableColResize: true,
    rowSelection: 'single',
    onSelectionChanged: onSelectionChanged,
    getNodeChildDetails: getNodeChildDetails
};

function onSelectionChanged() {
    var selectedRows = gridOptions.api.getSelectedRows();
    var selectedRowsString = '';
    selectedRows.forEach( function(selectedRow, index) { // this should only be one
        if (index!==0) {
            selectedRowsString += ', ';
        }
        selectedRowsString += selectedRow.source_file;
    });
    console.log(`The selected row is [${selectedRowsString}]`);

    if (window.vscode) {

        window.vscode.postMessage({
            command: 'should_open',
            text: selectedRowsString
        });
        console.log("Should have just sent message to host");
    } else {
        console.log("Cannot find vscode instance");
    }
}

function getNodeChildDetails(rowItem) {
    if (rowItem.children) {
        return {
            group: true,
            children: rowItem.children,
            // the key is used by the default group cellRenderer
            key: rowItem.function,

        };
    } else {
        return null;
    }
}

function onTextboxFilterChanged() {
    var value = document.getElementById('filter-textbox').value;
    gridOptions.api.setQuickFilter(value);
}


// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function() {
    //ag-grid setting up the appropriate theme
    if(document.body.className == "vscode-light"){
        document.getElementById("myGrid").classList.remove('ag-theme-dark');
        document.getElementById("myGrid").classList.add('ag-theme-blue');
    } else {
        document.getElementById("myGrid").classList.remove('ag-theme-blue');
        document.getElementById("myGrid").classList.add('ag-theme-dark');
    }   
    var gridDiv = document.querySelector('#myGrid');  
    var dataTxt = document.querySelector('#profileData').textContent;
    var data = JSON.parse(dataTxt);

    new agGrid.Grid(gridDiv, gridOptions);
    gridOptions.api.sizeColumnsToFit();
    gridOptions.api.setRowData(data.frames.frames);
    console.log(data.frames.frames);
    //gridOptions.api.setRowData(JSON.parse(data));
});
