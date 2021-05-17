const xlsxFile = require('read-excel-file/node');
const fs = require('fs');
const { v4: uuidv4 } = require("uuid");

xlsxFile('../Data/BeetleNut_Data..xlsx').then((rows) => {
    columnNames = rows[0];
    branchData = [];
    managerData = [];
    for(let i = 1; i < rows.length; i++){ 
        myEntry = {};
        let j = 0;
        for(column of columnNames){
            if(column !== null){
                if(column === 'Pincode covered'){
                    if(typeof rows[i][j] === 'string'){
                        const pincodes = rows[i][j].split(/[,, \r\n]+/)
                        const pincodeArray = pincodes.filter((pin) => {
                            return pin !== '';
                        })
                        myEntry[column] = pincodeArray;
                    }else{
                        const pincodeArray = [];
                        pincodeArray.push(rows[i][j].toString());
                        myEntry[column] = pincodeArray;
                    }
                    
                }else{
                    myEntry[column] = rows[i][j];
                }
                
                j++;
            }else{
                j = 0; 
                break;
            }
        }
        const uid = uuidv4();
        myEntry['branchId'] = uid;
        myEntry['request'] = [];
        branchData.push(myEntry);

        managerEntry = {};
        managerEntry['managerName'] = myEntry['Branch Incharge'];
        managerEntry['managerPassword'] = myEntry['Branch Name'];
        managerEntry['branchId'] = uid;
        managerData.push(managerEntry);
    }
    fs.writeFileSync('./JsonData/data.json', JSON.stringify(branchData));
    fs.writeFileSync('./JsonData/manager.json', JSON.stringify(managerData));
})
