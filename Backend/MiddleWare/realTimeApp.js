const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const fs = require('fs');
const { v4: uuidv4 } = require("uuid");

//Data
let branchData = fs.readFileSync('./JsonData/data.json');
let branches = JSON.parse(branchData);
let requestData = fs.readFileSync('./JsonData/requests.json');
let requests = JSON.parse(requestData);
let adminData = fs.readFileSync('./JsonData/admin.json');
let adminCredentials = JSON.parse(adminData);
let managerData = fs.readFileSync('./JsonData/manager.json');
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
  fs.writeFileSync('./JsonData/requests.json', JSON.stringify(requests));
  return uid;
}

const addRequest = (requestId, branch) => {
  for(place of branches){
      if(place['Branch Incharge'] === branch['Branch Incharge']){
          place['request'].push(requestId);
      }
  }
  fs.writeFileSync('./JsonData/data.json', JSON.stringify(branches));
}

io.on('connection', socket => {
  socket.on('search', ({name, phone, pincode}) => {
    try{
      console.log(name, phone, pincode);
      const requestId = request(name, phone, pincode);
      let places = branches.filter((branch) => {
          return branch['Pincode covered'].includes(pincode);
      });
      places.map((branch) => addRequest(requestId, branch));
      console.log(places);
      if(places.length === 0){
        io.emit('search', { data : "Sorry no Donut for you!"})
      }else{
        io.emit('search', {
          message : "done",
          data : places
        })
      }
    }catch(error){
      io.emit('search', {error});
    }
  });

  socket.on('adminLogin', ({admin, password}) => {
    try{
      if(adminCredentials.name !== admin || adminCredentials.password !== password){
          io.emit('adminLogin', {
            message : "Invalid",
            data : false
          })
      }else{
        io.emit('adminLogin', {
          message : "Valid",
          data : true
        })
      }
    }catch(error){
      io.emit('search', {error});
    }
  });

  socket.on('managerLogin', ({branchAdmin, password}) => {
    try{
      for(manager of managers){
        if(branchAdmin === manager["managerName"] || password === manager["managerPassword"]){
          io.emit('managerLogin', {
            message : "Valid",
            data : true,
            branchId : manager["branchId"]
          })
        }
      }
      io.emit('managerLogin', {
        message : "Invalid",
        data : false
      })
    }catch(error){
      io.emit('search', {error});
    }
  })

  socket.on('getBranchRequests', ({branchId}) => {
    try{
      console.log(branchId);
      for(branch of branches){
        if(branch['branchId'] === branchId){
          let requestArray = [];
          for(req of branch["request"]){
              requestArray.push(requests.find(each => each['requestId'] === req));
          }
          io.emit('getBranchRequests', {
              message : "Here are all the requests",
              data : requestArray
          })
        }
      }
      io.emit('getBranchRequests', {
          message: "Error! Please enter valid branchId",
          data : []
      })
    }catch(error){
      io.emit('search', {error});
    }
  });

  io.sockets.emit('allRequests', {
    message: "here are all requests",
    data : requests
  })

});

http.listen(4000, function() {
  console.log('listening on port 4000')
})