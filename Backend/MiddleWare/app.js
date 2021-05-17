const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require("uuid");
const app = express();
app.use(express.json());
const http = require('http').createServer(app)
const io = require('socket.io')(http)

io.on('connection', (socket) => {
    socket.on('try', () => {
        io.emit('message', { message : "hello" })
    })
})

//Data
let branchData = fs.readFileSync('./MiddleWare/JsonData/data.json');
let branches = JSON.parse(branchData);
let requestData = fs.readFileSync('./MiddleWare/JsonData/requests.json');
let requests = JSON.parse(requestData);
let adminData = fs.readFileSync('./MiddleWare/JsonData/admin.json');
let adminCredentials = JSON.parse(adminData);
let managerData = fs.readFileSync('./MiddleWare/JsonData/manager.json');
let managers = JSON.parse(managerData);


const request = (name, phone, pincode) => {
    const today = new Date();
    const date = `${today.getDate()}/${today.getMonth()+1}/${today.getFullYear()}`
    const time = `${today.getHours()}:${today.getMinutes()}`
    const uid = uuidv4();
    const requestEntry = {
        requestId : uid,
        customerName : name,
        customerPhone : phone,
        customerPincode : pincode,
        orderStatus : "pending",
        orderDate : date,
        orderTime : time,
        orderDateObj : today
    }
    requests.push(requestEntry);
    fs.writeFileSync('./MiddleWare/JsonData/requests.json', JSON.stringify(requests));
    return uid;
}

const addRequest = (requestId, branch) => {
    for(place of branches){
        if(place['Branch Incharge'] === branch['Branch Incharge']){
            place['request'].push(requestId);
        }
    }
    fs.writeFileSync('./MiddleWare/JsonData/data.json', JSON.stringify(branches));
}

app.post("/search", function(req, res){
    try{
        const {name, phone} = req.body;
        const pincode = req.body.pin;
        // console.log("1");
        const requestId = request(name, phone, pincode);
        // console.log("1");
        let places = branches.filter((branch) => {
            return branch['Pincode covered'].includes(pincode);
        })
        console.log("2");
        places.map((branch) => addRequest(requestId, branch));
        console.log("3");
        if(places.length === 0){
            res.json({
                message: "No donut for you!"
            })
        }else{
            res.json({
                message: "done",
                data : places
            })
        }
    }catch(error){
        res.json({
            message: "Error occured!!",
            data: error
        })
    }
    
})

app.post('/getBranch', function(req, res){
    try{
        const {branchId} = req.body;
        const branch = branches.filter((each) => {
            return each["branchId"] === branchId;
        })
        if(branch){
            res.json({
                message: "Branch Found!",
                data: branch
            })
        }else{
            res.json({
                message: "branch not found!"
            })
        }
    }catch(error){
        res.json({
            message: "Error occured!!",
            data: error
        })
    }
})

app.post('/adminLogIn', function(req, res){
    try{
        const {name, password} = req.body;
        if(adminCredentials.name !== name || adminCredentials.password !== password){
            res.json({
                message: "Invalid",
                data : false
            })
        }else{
            res.json({
                message: "valid",
                data : true
            })
        }
    }catch(error){
        res.json({
            message: "Error occured!!",
            data: error
        });
    }
});

app.post('/managerLogIn', function(req, res){
    try{
        const {name, password} = req.body;
        for(manager of managers){
            if(name === manager["managerName"] || password === manager["managerPassword"]){
                res.json({
                    message: "Invalid",
                    data : true,
                    branchId : manager["branchId"]
                })
            }
        }
        res.json({
            message: "Invalid",
            data : false
        })
    }catch(error){
        res.json({
            message: "Error occured!!",
            data: error
        });
    }
});

app.post('/getAllBranchRequests', function(req, res){
    try{
        const {branchId} = req.body;
        for(branch of branches){
            if(branch["branchId"] === branchId){
                let requestArray = [];
                for(req of branch["request"]){
                    requestArray.push(
                        requests.filter(
                            each => each['requestId'] === req
                        )
                    );
                }
                res.json({
                    message : "Here are all the requests",
                    data : requestArray
                })
            }
        }
        res.json({
            message: "Error! Please enter valid branchId",
            data : []
        })
    }catch(error){
        res.json({
            message: "Error occured!!",
            data: error
        });
    }
});

app.post('/getRequestById', function(req, res){
    try{
        const {requestId} = req.body;
        for(each of requests){
            if(each["requestId"] === requestId){
                res.json({
                    message : "Here is the request",
                    data : each
                })
            }
        }
        res.json({
            message: "Error! Please enter valid requestId",
            data : []
        })
    }catch(error){
        res.json({
            message: "Error occured!!",
            data: error
        });
    }
});

app.get('/allRequests', function(req, res){
    try{
        res.json({
            message: "Here are all requests!",
            data: requests
        })
    }catch(error){
        res.json({
            message: "Error occured!!",
            data: error
        });
    }
});

http.listen(3001, function() {
    console.log('listening on port 3001')
})